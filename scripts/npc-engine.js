/**
 * Data-driven NPC generation for the Wraeclast campaign.
 * This file contains no Foundry globals, so the same logic can be tested in Node.
 */
export class NPCEngine {
  static DATA_FILES = Object.freeze({
    main: "main_tables.csv",
    names: "names.csv",
    descriptors: "descriptors.csv",
    professions: "professions.csv",
    hooks: "hooks.csv",
    drives: "drives.csv"
  });

  static RESERVED_NAMES = new Set([
    "atziri", "doryani", "innocence", "kitava", "piety", "oak", "haku",
    "irasha", "tasuni", "cassia", "clarissa", "hargan", "dannig", "gwennen",
    "rog", "tujen", "sekhema", "arohongui", "oris steelhand", "ceilia steelhand",
    "dominus", "avarius", "venarius", "gravicius", "divinia", "zana", "alira",
    "kraityn", "kaom", "hyrri", "lani", "utula", "oyun", "kira", "yeena",
    "greust", "silk", "oshabi", "grigor", "einhar", "rigwald", "zerphi",
    "vorana", "olroth", "uhtred", "medved", "niko", "dialla", "siosa",
    "maramoa", "tarkleigh", "nessa", "bestel", "tane", "cato", "lucan"
  ]);

  static CONTRADICTIONS = Object.freeze([
    ["Towering", "Very short"],
    ["Broad-shouldered", "Narrow-shouldered"],
    ["Powerfully built", "Frail"],
    ["Immaculately groomed", "Grime-streaked"],
    ["Shaven-headed", "Waist-length hair"],
    ["Shaven-headed", "Bead-threaded braids"],
    ["Shaven-headed", "Grey-streaked hair"],
    ["Shaven-headed", "Oiled hair"],
    ["Shaven-headed", "Shoulder-length curls"],
    ["Shaven-headed", "Silver-streaked hair"],
    ["Shaven-headed", "Tangled hair"],
    ["Shaven-headed", "White lock of hair"],
    ["Shaven-headed", "Wind-tossed hair"],
    ["Clean-shaven", "Closely trimmed beard"],
    ["Clean-shaven", "Full braided beard"],
    ["Clean-shaven", "Long braided beard"],
    ["Freshly shaved jaw", "Closely trimmed beard"],
    ["Freshly shaved jaw", "Full braided beard"],
    ["Freshly shaved jaw", "Long braided beard"],
    ["Long braided beard", "Full braided beard"],
    ["Narrow face", "Round face"],
    ["Shaved eyebrows", "Thick eyebrows"],
    ["Barefoot", "Dust-caked boots"],
    ["Barefoot", "Iron-shod boots"],
    ["Barefoot", "Travel-worn boots"],
    ["Broken nose", "Flattened nose"],
    ["Broken nose", "Sharp nose"],
    ["Crooked nose", "Flattened nose"],
    ["Crooked nose", "Sharp nose"],
    ["Clouded eye", "Milky left eye"],
    ["Missing finger", "Missing two fingers"],
    ["Grey-streaked hair", "Silver-streaked hair"],
    ["Booming voice", "Whisper-soft voice"],
    ["Restless", "Unhurried"],
    ["Patient", "Impatient"],
    ["Cheerful", "Melancholy"],
    ["Boisterous", "Laconic"],
    ["Calm under pressure", "Tense"],
    ["Commanding", "Self-effacing"],
    ["Compassionate", "Vindictive"],
    ["Cautiously optimistic", "Bitter"],
    ["Eager", "Resigned"],
    ["Formal", "Irreverent"],
    ["Jovial", "Severe"],
    ["Nervously energetic", "Unflappable"],
    ["Shy", "Talkative"],
    ["Openly trusting", "Suspicious"],
    ["Openly trusting", "Distrustful"],
    ["Bows to visible authority", "Questions every order"],
    ["Demands evidence", "Sees omens everywhere"],
    ["Expects payment in advance", "Offers help before being asked"],
    ["Fears organised religion", "Trusts priests"],
    ["Mocks formal titles", "Treats titles seriously"],
    ["Never raises their voice", "Raises their voice to seize control"],
    ["Prioritises clan over law", "Prioritises law over friendship"],
    ["Shares supplies freely", "Counts every ration"],
    ["Assumes strangers are spies", "Treats strangers as potential kin"],
    ["Warm and welcoming", "Cold and distant"]
  ]);

  static LEGACY_BRANCH_AFFILIATIONS = Object.freeze({
    Hinekora: Object.freeze({ culture: "Karui", affiliation: "Karui" }),
    Tawhoa: Object.freeze({ culture: "Karui", affiliation: "Karui" }),
    Emberforged: Object.freeze({ culture: "Stygian", affiliation: "Stygian" }),
    "Hollowed Vein": Object.freeze({ culture: "Stygian", affiliation: "Stygian" })
  });

  static #cache = new Map();
  static #indexes = new WeakMap();
  static #contradictionIndex = null;

  /** Parse RFC-4180-style CSV, including quoted commas and escaped quotes. */
  static parseCSVText(text, source = "CSV") {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    const input = String(text ?? "").replace(/^\uFEFF/, "");

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      if (quoted) {
        if (char === '"' && input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") {
        row.push(field.trim());
        field = "";
      } else if (char === "\n") {
        row.push(field.trim());
        if (row.some((cell) => cell.length)) rows.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") field += char;
    }

    if (quoted) throw new Error(`${source}: unterminated quoted field`);
    row.push(field.trim());
    if (row.some((cell) => cell.length)) rows.push(row);
    if (!rows.length) return [];

    const headers = rows.shift().map((header) => this.#camelCase(header));
    return rows.map((cells, index) => {
      if (cells.length !== headers.length) {
        throw new Error(`${source}:${index + 2}: expected ${headers.length} columns, found ${cells.length}`);
      }
      const record = Object.fromEntries(headers.map((header, column) => [header, cells[column]]));
      record.weight = this.#weight(record.weight, `${source}:${index + 2}`);
      return record;
    });
  }

  static async loadTables(basePath = "modules/wraeclast-npc-gen/data", { refresh = false } = {}) {
    const cacheKey = basePath.replace(/\/$/, "");
    if (!refresh && this.#cache.has(cacheKey)) return this.#cache.get(cacheKey);

    const promise = (async () => {
      const entries = await Promise.all(Object.entries(this.DATA_FILES).map(async ([key, filename]) => {
        const response = await fetch(`${cacheKey}/${filename}`);
        if (!response.ok) throw new Error(`${filename}: HTTP ${response.status} ${response.statusText}`);
        return [key, this.parseCSVText(await response.text(), filename)];
      }));
      const [presetResponse, factionResponse] = await Promise.all([
        fetch(`${cacheKey}/presets.json`),
        fetch(`${cacheKey}/factions.json`)
      ]);
      if (!presetResponse.ok) throw new Error(`presets.json: HTTP ${presetResponse.status} ${presetResponse.statusText}`);
      if (!factionResponse.ok) throw new Error(`factions.json: HTTP ${factionResponse.status} ${factionResponse.statusText}`);
      const tables = Object.fromEntries(entries);
      tables.presets = await presetResponse.json();
      tables.factions = await factionResponse.json();
      const report = this.validateTables(tables);
      if (report.errors.length) throw new Error(`Invalid NPC data:\n- ${report.errors.join("\n- ")}`);
      tables.validation = report;
      return tables;
    })();

    this.#cache.set(cacheKey, promise);
    try {
      return await promise;
    } catch (error) {
      this.#cache.delete(cacheKey);
      throw error;
    }
  }

  static clearCache() {
    this.#cache.clear();
    this.#indexes = new WeakMap();
  }

  /** Apply world-local JSON overrides without changing the bundled campaign data. */
  static applyOverrides(tables, overrides = {}) {
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
      throw new Error("Custom data overrides must be a JSON object");
    }
    const next = structuredClone(tables);
    const tableKeys = Object.keys(this.DATA_FILES);
    const additions = overrides.add ?? overrides;
    const removals = overrides.remove ?? {};
    const identity = (row) => [row.category, row.parent, row.subParent, row.value]
      .map((value) => String(value ?? "").toLocaleLowerCase()).join("|");

    for (const key of tableKeys) {
      if (removals[key] !== undefined && !Array.isArray(removals[key])) throw new Error(`remove.${key} must be an array`);
      const removeIds = new Set((removals[key] ?? []).map(identity));
      next[key] = (next[key] ?? []).filter((row) => !removeIds.has(identity(row)));
      if (additions[key] === undefined) continue;
      if (!Array.isArray(additions[key])) throw new Error(`${key} overrides must be an array`);
      const positions = new Map(next[key].map((row, index) => [identity(row), index]));
      for (const input of additions[key]) {
        if (!input || typeof input !== "object" || !input.category || !input.value) {
          throw new Error(`${key} override rows require category and value`);
        }
        const row = {
          ...input,
          parent: input.parent || "Any",
          subParent: input.subParent || "Any",
          weight: this.#weight(input.weight, `custom ${key}`)
        };
        const rowId = identity(row);
        if (positions.has(rowId)) next[key][positions.get(rowId)] = row;
        else {
          positions.set(rowId, next[key].length);
          next[key].push(row);
        }
      }
    }

    if (additions.presets !== undefined) {
      const supplied = Array.isArray(additions.presets) ? additions.presets : additions.presets?.presets;
      if (!Array.isArray(supplied)) throw new Error("presets overrides must be an array or { presets: [] }");
      const presets = next.presets?.presets ?? [];
      const positions = new Map(presets.map((preset, index) => [preset.id, index]));
      for (const preset of supplied) {
        if (!preset?.id || !preset?.label) throw new Error("custom presets require id and label");
        if (positions.has(preset.id)) presets[positions.get(preset.id)] = preset;
        else presets.push(preset);
      }
      next.presets = { ...(next.presets ?? {}), presets };
    }
    this.#indexes.delete(next);
    const report = this.validateTables(next);
    if (report.errors.length) throw new Error(`Invalid custom NPC data:\n- ${report.errors.join("\n- ")}`);
    next.validation = report;
    return next;
  }

  static rollWeighted(options, rng = Math.random) {
    const pool = (options ?? []).filter((option) => Number(option.weight) > 0);
    if (!pool.length) return null;
    const total = pool.reduce((sum, option) => sum + Number(option.weight), 0);
    let roll = rng() * total;
    for (const option of pool) {
      roll -= Number(option.weight);
      if (roll < 0) return option;
    }
    return pool.at(-1);
  }

  static getPreset(tables, id) {
    return (tables.presets?.presets ?? []).find((preset) => preset.id === id)
      ?? (tables.presets?.presets ?? []).find((preset) => preset.id === "general")
      ?? null;
  }

  static getOptions(tables, constraints = {}) {
    constraints = this.#cleanConstraints(constraints);
    const cultures = this.#uniqueRows(tables.main.filter((row) => row.category === "Culture"));
    const compatibleCultures = cultures.filter((row) => {
      const affiliationOK = !constraints.affiliation || tables.main.some((candidate) =>
        candidate.category === "Affiliation" && candidate.parent === row.value && candidate.value === constraints.affiliation
      );
      const branchOK = !constraints.branch || tables.main.some((candidate) =>
        candidate.category === "Branch"
        && candidate.parent === row.value
        && candidate.value === constraints.branch
        && (!constraints.affiliation || this.#isAny(candidate.subParent) || candidate.subParent === constraints.affiliation)
      );
      const speciesOK = !constraints.species || tables.main.some((candidate) =>
        candidate.category === "Species" && candidate.parent === row.value && candidate.value === constraints.species
      );
      const professionOK = !constraints.professionCategory || constraints.age === "Child"
        || this.#supportsProfession(tables, row.value, constraints.affiliation, constraints.branch, constraints.professionCategory);
      const ageOK = constraints.age !== "Ancient" || tables.main.some((candidate) =>
        candidate.category === "Species" && candidate.parent === row.value && this.#isLongLived(candidate.value)
      );
      return affiliationOK && branchOK && speciesOK && professionOK && ageOK;
    });

    const culture = constraints.culture || (compatibleCultures.length === 1 ? compatibleCultures[0].value : "");
    const affiliations = this.#uniqueRows(tables.main.filter((row) =>
      row.category === "Affiliation"
      && (!culture || row.parent === culture)
      && (!constraints.branch || tables.main.some((branch) =>
        branch.category === "Branch"
        && branch.parent === row.parent
        && branch.value === constraints.branch
        && (this.#isAny(branch.subParent) || branch.subParent === row.value)
      ))
    ));
    const affiliation = constraints.affiliation || (affiliations.length === 1 ? affiliations[0].value : "");
    const branches = this.#uniqueRows(tables.main.filter((row) =>
      row.category === "Branch"
      && (!culture || row.parent === culture)
      && (!affiliation || this.#isAny(row.subParent) || row.subParent === affiliation)
      && (!constraints.professionCategory || constraints.age === "Child"
        || this.#professionCategoryPool(tables, row.parent, affiliation || row.subParent, row.value)
          .some((category) => category.value === constraints.professionCategory))
    ));
    const species = this.#uniqueRows(tables.main.filter((row) =>
      row.category === "Species"
      && (!culture || row.parent === culture)
      && (constraints.age !== "Ancient" || this.#isLongLived(row.value))
    ));
    const professionCategories = culture
      ? this.#professionOptions(tables, culture, affiliation, constraints.branch || "")
      : this.#uniqueRows(tables.main.filter((row) => row.category === "ProfessionCategory"));

    let ages = this.#agePool(tables, constraints.species);
    if (constraints.professionCategory && constraints.professionCategory !== "Youth") {
      ages = ages.filter((row) => row.value !== "Child");
    } else if (constraints.professionCategory === "Youth") {
      ages = ages.filter((row) => row.value === "Child");
    }
    return {
      cultures: compatibleCultures.length ? compatibleCultures : cultures,
      affiliations,
      branches,
      species,
      socialOrigins: this.#uniqueRows(tables.main.filter((row) => row.category === "SocialOrigin")),
      ages,
      alignments: this.#uniqueRows(tables.main.filter((row) => row.category === "Alignment")),
      locations: this.#uniqueRows(tables.main.filter((row) => row.category === "Location")),
      eras: this.#uniqueRows(tables.main.filter((row) => row.category === "Era")),
      capabilityTiers: this.#uniqueRows(tables.main.filter((row) => row.category === "CapabilityTier")),
      professionCategories: constraints.age === "Child" ? [{ value: "Youth", weight: 1 }] : professionCategories,
      presets: tables.presets?.presets ?? []
    };
  }

  static generateNPC(constraints, tables, rng = Math.random) {
    const requested = this.#cleanConstraints(constraints);
    this.#validateRequested(requested, tables);
    const preset = this.getPreset(tables, requested.preset || "general");
    const culture = this.#resolveCulture(requested, preset, tables, rng);
    const affiliation = this.#resolveAffiliation(requested, preset, culture, tables, rng);
    const branch = this.#resolveBranch(requested, preset, culture, affiliation, tables, rng);
    const organization = this.#resolveOrganization({ culture, affiliation, branch }, tables, rng);
    const ordination = this.#resolveOrdination({ culture, affiliation, branch, organization }, rng);
    const species = this.#resolveSpecies(requested, preset, culture, tables, rng, organization);
    const socialOrigin = requested.socialOrigin
      || this.#pickValue(this.#presetRows(preset?.socialOrigins), rng)
      || this.#pickValue(this.#categoryRows(tables, "main", "SocialOrigin"), rng)
      || "Native";
    let agePool = this.#agePool(tables, species);
    if (requested.professionCategory && requested.professionCategory !== "Youth") {
      agePool = agePool.filter((row) => row.value !== "Child");
    }
    const age = requested.age || (requested.professionCategory === "Youth" ? "Child" : this.#pickValue(agePool, rng)) || "Adult";
    const alignment = requested.alignment
      || this.#pickValue(this.#categoryRows(tables, "main", "Alignment"), rng)
      || "True Neutral";
    const location = requested.location
      || (culture === "Vaal" ? "Ancient Vaal city" : this.#pickValue(this.#presetRows(preset?.locations), rng))
      || this.#defaultLocation(culture);
    const era = requested.era
      || (culture === "Vaal" ? "Ancient Vaal" : this.#pickValue(this.#presetRows(preset?.eras), rng))
      || (culture === "Vaal" ? "Ancient Vaal" : "1599 IC");
    const rank = this.#resolveRank({ affiliation, organization, ordination }, rng);

    const npc = {
      culture, affiliation, branch, species, socialOrigin, age, alignment, organization,
      ordination, rank, location, era, preset: preset?.id ?? "general"
    };
    Object.assign(npc, this.#resolveFactionIds(npc, tables));
    Object.assign(npc, this.#generateName(npc, tables, rng));
    Object.assign(npc, this.#generateProfession(npc, tables, requested, rng));
    npc.capabilityTier = this.#resolveCapabilityTier(npc, requested.capabilityTier, rng);
    Object.assign(npc, this.#generateAppearance(npc, tables, rng));
    Object.assign(npc, this.#generatePersonality(npc, tables, rng));
    Object.assign(npc, this.#generateHooks(npc, tables, rng));
    Object.assign(npc, this.#generateDrives(npc, tables, rng));
    return npc;
  }

  static generateBatch(count, constraints, tables, rng = Math.random) {
    const size = Math.max(1, Math.min(10, Number.parseInt(count, 10) || 1));
    return Array.from({ length: size }, () => this.generateNPC(constraints, tables, rng));
  }

  static rerollSection(npc, section, constraints, tables, rng = Math.random) {
    const next = structuredClone(npc);
    if (section === "name") Object.assign(next, this.#generateName(next, tables, rng));
    else if (section === "profession") Object.assign(next, this.#generateProfession(next, tables, this.#cleanConstraints(constraints), rng));
    else if (section === "appearance") Object.assign(next, this.#generateAppearance(next, tables, rng));
    else if (section === "personality") Object.assign(next, this.#generatePersonality(next, tables, rng));
    else if (section === "hooks") Object.assign(next, this.#generateHooks(next, tables, rng));
    else if (section === "drives") Object.assign(next, this.#generateDrives(next, tables, rng));
    else throw new Error(`Unknown reroll section: ${section}`);
    return next;
  }

  static validateTables(tables) {
    const errors = [];
    const warnings = [];
    for (const key of ["main", "names", "descriptors", "professions", "hooks", "drives"]) {
      if (!Array.isArray(tables[key]) || !tables[key].length) errors.push(`${key} has no rows`);
    }
    if (!Array.isArray(tables.factions?.factions)) errors.push("factions registry has no entries");

    const cultures = new Set((tables.main ?? []).filter((row) => row.category === "Culture").map((row) => row.value));
    for (const required of ["Oriathan", "Azmeri", "Ezomyte", "Maraketh", "Karui", "Vaal", "Kalguur", "Stygian"]) {
      if (!cultures.has(required)) errors.push(`missing culture: ${required}`);
    }
    for (const culture of cultures) {
      const hasAffiliation = tables.main.some((row) => row.category === "Affiliation" && row.parent === culture);
      const hasSpecies = tables.main.some((row) => row.category === "Species" && row.parent === culture);
      const firstNames = tables.names.filter((row) => row.category === "Name" && row.parent === culture);
      const surnames = tables.names.filter((row) => row.category === "Surname" && row.parent === culture);
      const hasProfession = tables.main.some((row) => row.category === "ProfessionCategory" && row.parent === culture);
      if (!hasAffiliation) errors.push(`${culture} has no affiliation pool`);
      if (!hasSpecies) errors.push(`${culture} has no species pool`);
      if (!firstNames.length || !surnames.length) errors.push(`${culture} has incomplete name pools`);
      if (firstNames.length < 60) errors.push(`${culture} has fewer than 60 first names`);
      if (surnames.length < 40) errors.push(`${culture} has fewer than 40 surnames`);
      if (!hasProfession) errors.push(`${culture} has no profession categories`);
    }

    for (const row of (tables.main ?? []).filter((candidate) => candidate.category === "Affiliation")) {
      if (!cultures.has(row.parent)) errors.push(`affiliation ${row.value} has unknown culture ${row.parent}`);
    }
    for (const row of (tables.main ?? []).filter((candidate) => candidate.category === "Branch")) {
      if (!cultures.has(row.parent)) errors.push(`branch ${row.value} has unknown culture ${row.parent}`);
      const hasParent = tables.main.some((candidate) =>
        candidate.category === "Affiliation"
        && candidate.parent === row.parent
        && (this.#isAny(row.subParent) || candidate.value === row.subParent)
      );
      if (!hasParent) errors.push(`branch ${row.value} has unknown ${row.parent} affiliation ${row.subParent}`);
    }
    for (const row of tables.names ?? []) {
      if (this.RESERVED_NAMES.has(row.value.toLocaleLowerCase())) errors.push(`reserved named character in names.csv: ${row.value}`);
    }
    for (const [tableName, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows)) continue;
      const seen = new Set();
      for (const row of rows) {
        const key = [row.category, row.parent, row.subParent, row.value].join("|").toLocaleLowerCase();
        if (seen.has(key)) errors.push(`duplicate ${tableName} row: ${row.value}`);
        seen.add(key);
      }
    }

    const presetIds = new Set();
    for (const preset of tables.presets?.presets ?? []) {
      if (!preset.id || !preset.label) errors.push("preset missing id or label");
      if (presetIds.has(preset.id)) errors.push(`duplicate preset id: ${preset.id}`);
      presetIds.add(preset.id);
      for (const culture of Object.keys(preset.cultures ?? {})) {
        if (!cultures.has(culture)) errors.push(`preset ${preset.id} references unknown culture ${culture}`);
      }
      for (const [culture, branches] of Object.entries(preset.branches ?? {})) {
        if (!cultures.has(culture)) {
          errors.push(`preset ${preset.id} references unknown branch culture ${culture}`);
          continue;
        }
        for (const branch of Object.keys(branches ?? {})) {
          if (!tables.main.some((row) => row.category === "Branch" && row.parent === culture && row.value === branch)) {
            errors.push(`preset ${preset.id} references unknown ${culture} branch ${branch}`);
          }
        }
      }
    }
    if (!presetIds.has("general")) errors.push("missing general preset");

    const knownCategories = new Set((tables.professions ?? []).map((row) => row.category));
    for (const row of (tables.main ?? []).filter((candidate) => candidate.category === "ProfessionCategory")) {
      if (!knownCategories.has(row.value)) errors.push(`profession category has no jobs: ${row.value}`);
    }
    if (!(tables.names ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian name pool");
    if (!(tables.hooks ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian hooks");
    if (!(tables.professions ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian professions");
    if (!(tables.main ?? []).some((row) => row.category === "Affiliation" && row.parent === "Oriathan" && row.value === "Oriath Militia")) {
      errors.push("missing Oriath Militia affiliation");
    }
    if (!(tables.professions ?? []).some((row) => row.parent === "Oriathan" && row.subParent === "Oriath Militia")) {
      errors.push("missing Oriath Militia professions");
    }
    if (!(tables.hooks ?? []).some((row) => row.parent === "Oriathan" && row.subParent === "Oriath Militia")) {
      errors.push("missing Oriath Militia hooks");
    }
    if ((tables.names ?? []).filter((row) => row.category === "OrdainedName" && row.parent === "Oriathan" && row.subParent === "Templar").length < 30) {
      errors.push("Templar ordained-name pool has fewer than 30 entries");
    }
    if ((tables.professions ?? []).length < 600) errors.push("profession library has fewer than 600 entries");
    for (const [category, minimum] of Object.entries({ Appearance: 120, Demeanor: 80, Attitude: 80, Voice: 140, Mannerism: 100 })) {
      const count = (tables.descriptors ?? []).filter((row) => row.category === category).length;
      if (count < minimum) errors.push(`${category} descriptor pool has fewer than ${minimum} entries`);
    }
    for (const [category, minimum] of Object.entries({ Build: 25, Features: 45, Attire: 45, Distinguishing: 40 })) {
      const count = (tables.descriptors ?? []).filter((row) => row.category === category).length;
      if (count < minimum) errors.push(`${category} structured descriptor pool has fewer than ${minimum} entries`);
    }
    for (const category of ["Goal", "Problem", "Secret", "Knowledge", "Offer", "Disposition"]) {
      if ((tables.drives ?? []).filter((row) => row.category === category).length < 35) {
        errors.push(`${category} narrative pool has fewer than 35 entries`);
      }
    }
    for (const culture of cultures) {
      for (const category of ["Ideal", "Bond", "Flaw"]) {
        if ((tables.hooks ?? []).filter((row) => row.parent === culture && row.category === category).length < 6) {
          errors.push(`${culture} has fewer than 6 ${category.toLocaleLowerCase()} hooks`);
        }
      }
    }

    const factionRows = tables.factions?.factions ?? [];
    const factionIds = new Set();
    for (const faction of factionRows) {
      if (!faction.id || !faction.label || !faction.type || !faction.culture) errors.push("faction registry entry is incomplete");
      if (factionIds.has(faction.id)) errors.push(`duplicate faction id: ${faction.id}`);
      factionIds.add(faction.id);
    }
    for (const faction of factionRows.filter((entry) => entry.type === "branch")) {
      if (!faction.parentId || !factionIds.has(faction.parentId)) errors.push(`branch registry ${faction.id} has unknown parentId`);
    }
    for (const row of (tables.main ?? []).filter((entry) => entry.category === "Affiliation" && entry.value !== "Unaffiliated")) {
      if (!factionRows.some((entry) => entry.type === "affiliation" && entry.culture === row.parent && entry.label === row.value)) {
        errors.push(`faction registry is missing ${row.parent}/${row.value}`);
      }
    }
    for (const row of (tables.main ?? []).filter((entry) => entry.category === "Branch" && entry.value !== "Unaffiliated")) {
      if (!factionRows.some((entry) => entry.type === "branch" && entry.culture === row.parent && entry.label === row.value)) {
        errors.push(`faction registry is missing ${row.parent}/${row.value}`);
      }
    }
    return { errors, warnings };
  }

  static #resolveCulture(requested, preset, tables, rng) {
    if (requested.culture) {
      const exists = tables.main.some((row) => row.category === "Culture" && row.value === requested.culture);
      if (!exists) throw new Error(`Unknown culture: ${requested.culture}`);
      return requested.culture;
    }
    const applyFilters = (source) => {
      let candidates = source;
      if (requested.affiliation) {
        const valid = new Set(this.#categoryRows(tables, "main", "Affiliation")
          .filter((row) => row.value === requested.affiliation).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.branch) {
        const valid = new Set(this.#categoryRows(tables, "main", "Branch").filter((row) =>
          row.value === requested.branch
          && (!requested.affiliation || this.#isAny(row.subParent) || row.subParent === requested.affiliation)
        ).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.species) {
        const valid = new Set(this.#categoryRows(tables, "main", "Species")
          .filter((row) => row.value === requested.species).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.professionCategory && requested.professionCategory !== "Youth" && requested.age !== "Child") {
        candidates = candidates.filter((row) => this.#supportsProfession(
          tables, row.value, requested.affiliation, requested.branch, requested.professionCategory
        ));
      }
      if (requested.age === "Ancient") {
        const valid = new Set(this.#categoryRows(tables, "main", "Species")
          .filter((row) => this.#isLongLived(row.value)).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      return candidates;
    };
    const globalPool = this.#categoryRows(tables, "main", "Culture");
    const presetPool = this.#presetRows(preset?.cultures);
    let pool = applyFilters(presetPool.length ? presetPool : globalPool);
    if (!pool.length && (requested.affiliation || requested.branch || requested.species || requested.professionCategory || requested.age)) {
      pool = applyFilters(globalPool);
    }
    const value = this.#pickValue(pool, rng);
    if (!value) throw new Error("No culture is compatible with the selected filters");
    return value;
  }

  static #resolveAffiliation(requested, preset, culture, tables, rng) {
    let pool = this.#categoryRows(tables, "main", "Affiliation").filter((row) => row.parent === culture);
    if (requested.affiliation) {
      if (!pool.some((row) => row.value === requested.affiliation)) throw new Error(`${requested.affiliation} is not a valid ${culture} affiliation`);
      if (requested.branch && !this.#categoryRows(tables, "main", "Branch").some((row) =>
        row.parent === culture
        && row.value === requested.branch
        && (this.#isAny(row.subParent) || row.subParent === requested.affiliation)
      )) throw new Error(`${requested.branch} is not a branch of ${requested.affiliation}`);
      return requested.affiliation;
    }
    if (requested.branch) {
      const parents = new Set(this.#categoryRows(tables, "main", "Branch").filter((row) =>
        row.parent === culture && row.value === requested.branch
      ).map((row) => row.subParent));
      pool = pool.filter((row) => parents.has(row.value) || [...parents].some((parent) => this.#isAny(parent)));
    }
    const presetPool = this.#presetRows(preset?.affiliations?.[culture] ?? preset?.affiliations);
    return this.#pickValue(presetPool.filter((row) => pool.some((valid) => valid.value === row.value)), rng)
      || this.#pickValue(pool, rng) || "Unaffiliated";
  }

  static #resolveBranch(requested, preset, culture, affiliation, tables, rng) {
    let pool = this.#categoryRows(tables, "main", "Branch").filter((row) =>
      row.parent === culture
      && (this.#isAny(row.subParent) || row.subParent === affiliation)
    );
    if (requested.branch) {
      if (!pool.some((row) => row.value === requested.branch)) {
        throw new Error(`${requested.branch} is not a valid ${culture} branch of ${affiliation}`);
      }
      return requested.branch;
    }
    if (!pool.length) return "";
    if (requested.professionCategory && requested.professionCategory !== "Youth" && requested.age !== "Child") {
      pool = pool.filter((row) => this.#professionCategoryPool(tables, culture, affiliation, row.value)
        .some((category) => category.value === requested.professionCategory));
      if (!pool.length) throw new Error(`No ${culture} branch supports ${requested.professionCategory}`);
    }
    const presetPool = this.#presetRows(preset?.branches?.[culture] ?? preset?.branches?.[affiliation] ?? preset?.branches);
    return this.#pickValue(presetPool.filter((row) => pool.some((valid) => valid.value === row.value)), rng)
      || this.#pickValue(pool, rng);
  }

  static #resolveSpecies(requested, preset, culture, tables, rng, organization = "") {
    const pool = this.#categoryRows(tables, "main", "Species").filter((row) =>
      row.parent === culture
      && (requested.age !== "Ancient" || this.#isLongLived(row.value))
    );
    if (requested.species) {
      if (!pool.some((row) => row.value === requested.species)) throw new Error(`${requested.species} is not a valid ${culture} species`);
      return requested.species;
    }
    const presetPool = this.#presetRows(preset?.species?.[culture] ?? preset?.species);
    let weightedPool = pool;
    if (organization.startsWith("Emerald Legion")) {
      const human = pool.find((row) => row.value === "Human");
      const nonHuman = pool.filter((row) => row.value !== "Human");
      const nonHumanTotal = nonHuman.reduce((sum, row) => sum + row.weight, 0);
      if (human && nonHumanTotal) {
        weightedPool = [
          { ...human, weight: 50 },
          ...nonHuman.map((row) => ({ ...row, weight: (row.weight / nonHumanTotal) * 50 }))
        ];
      }
    }
    const value = this.#pickValue(presetPool.filter((row) => weightedPool.some((valid) => valid.value === row.value)), rng)
      || this.#pickValue(weightedPool, rng);
    if (!value) throw new Error(`No species is compatible with ${culture}${requested.age ? ` at age ${requested.age}` : ""}`);
    return value;
  }

  static #generateName(npc, tables, rng) {
    if (npc.ordination === "Ordained") {
      const virtuePool = this.#selectedRows(tables, "names", "OrdainedName", npc);
      const virtueName = this.#pickValue(virtuePool, rng) || "Abnegation";
      return {
        firstName: virtueName,
        surname: "",
        fullName: `Templar ${virtueName}`,
        nameStyle: "Bestowed virtue-name"
      };
    }
    const firstPool = this.#selectedRows(tables, "names", "Name", npc);
    const surnamePool = this.#selectedRows(tables, "names", "Surname", npc);
    let firstName = this.#pickValue(firstPool, rng) || "Unnamed";
    const surnameChance = {
      Oriathan: 0.95, Azmeri: 0.85, Ezomyte: 0.9, Maraketh: 0.55,
      Karui: 0.8, Vaal: 0.4, Kalguur: 0.4, Stygian: 0.9
    }[npc.culture] ?? 0.85;
    let surname = rng() < surnameChance ? this.#pickValue(surnamePool, rng) : "";
    let fullName = `${firstName} ${surname}`.trim();
    for (let attempt = 0; attempt < 8 && this.RESERVED_NAMES.has(fullName.toLocaleLowerCase()); attempt += 1) {
      firstName = this.#pickValue(firstPool, rng) || "Unnamed";
      surname = rng() < surnameChance ? this.#pickValue(surnamePool, rng) : "";
      fullName = `${firstName} ${surname}`.trim();
    }
    return { firstName, surname, fullName, nameStyle: "Birth name" };
  }

  static #generateProfession(npc, tables, constraints, rng) {
    const pool = npc.age === "Child"
      ? [{ value: "Youth", weight: 1 }]
      : this.#professionCategoryPool(tables, npc.culture, npc.affiliation, npc.branch);
    const requestedCategory = constraints.professionCategory;
    if (requestedCategory && !pool.some((row) => row.value === requestedCategory)) {
      throw new Error(`${requestedCategory} is not valid for ${[npc.culture, npc.affiliation, npc.branch].filter(Boolean).join(" / ")}`);
    }
    const professionCategory = requestedCategory || this.#pickValue(pool, rng) || "Commoner";
    const jobPool = this.#selectedRows(tables, "professions", professionCategory, npc, true);
    const profession = this.#pickValue(jobPool, rng) || `${professionCategory} worker`;

    return { professionCategory, profession, organization: npc.organization || "" };
  }

  static #resolveOrganization(npc, tables, rng) {
    if (npc.affiliation === "Templar") {
      return this.#pickValue(this.#selectedRows(tables, "professions", "Templar Branch", npc), rng)
        || "Emerald Legion (Quartus, recruit and volunteer)";
    }
    if (npc.affiliation === "The Ring") return "The Ring";
    if (npc.affiliation === "Oriath Militia") return "Oriath Militia";
    if (["Kalguur Expedition"].includes(npc.affiliation)) return npc.affiliation;
    return "";
  }

  static #resolveOrdination(npc, rng) {
    if (npc.affiliation !== "Templar") return "";
    if (npc.organization === "Archivists") return "Ordained";
    const rate = npc.organization.startsWith("Ebony Legion") ? 0.15
      : npc.organization.startsWith("Crimson Legion") ? 0.07
        : npc.organization.startsWith("Azure Legion") ? 0.06
          : npc.organization.startsWith("Emerald Legion") ? 0.03
            : 0.08;
    return rng() < rate ? "Ordained" : "Lay";
  }

  static #resolveRank(npc, rng) {
    const pick = (rows) => this.#pickValue(rows.map(([value, weight]) => ({ value, weight })), rng);
    if (npc.affiliation === "Oriath Militia") {
      return pick([["Militia Guard", 62], ["Constable", 22], ["Watch Sergeant", 13], ["Militia Captain", 3]]);
    }
    if (npc.affiliation !== "Templar") return "";
    if (npc.organization === "Archivists") {
      return pick([["Initiate", 45], ["Archivist", 40], ["Lord Archivist", 13], ["High Archivist", 2]]);
    }
    if (npc.ordination === "Ordained") {
      return pick([["Initiate Templar", 44], ["Templar", 35], ["Templar Captain", 18], ["Lord Templar General", 3]]);
    }
    return pick([["Guard", 80], ["Sergeant", 17], ["Senior Sergeant", 3]]);
  }

  static #resolveCapabilityTier(npc, requested, rng) {
    if (requested) return requested;
    const pick = (rows) => this.#pickValue(rows.map(([value, weight]) => ({ value, weight })), rng);
    if (npc.age === "Child") return "Civilian";
    if (npc.ordination === "Ordained") return pick([["Veteran", 70], ["Elite", 30]]);
    if (npc.affiliation === "Oriath Militia") return pick([["Trained", 68], ["Veteran", 25], ["Elite", 7]]);
    if (npc.affiliation === "Templar" || npc.professionCategory === "Military") {
      return pick([["Trained", 57], ["Veteran", 34], ["Elite", 9]]);
    }
    if (["Magic", "Medical", "Scholarly", "Craftsman", "Religion"].includes(npc.professionCategory)) {
      return pick([["Skilled", 68], ["Trained", 24], ["Veteran", 8]]);
    }
    return pick([["Civilian", 54], ["Skilled", 35], ["Trained", 9], ["Veteran", 2]]);
  }

  static #resolveFactionIds(npc, tables) {
    const factions = tables.factions?.factions ?? [];
    const affiliation = factions.find((entry) =>
      entry.type === "affiliation" && entry.culture === npc.culture && entry.label === npc.affiliation
    );
    const branch = factions.find((entry) =>
      entry.type === "branch" && entry.culture === npc.culture && entry.label === npc.branch
    );
    return { factionId: affiliation?.id ?? "", branchId: branch?.id ?? "" };
  }

  static #defaultLocation(culture) {
    return {
      Oriathan: "Theopolis", Azmeri: "Forest Encampment", Ezomyte: "Wraeclast road or wilderness",
      Maraketh: "Highgate and the Vastiri", Karui: "Karui Archipelago", Vaal: "Ancient Vaal city",
      Kalguur: "Kalguur expedition camp", Stygian: "Azurite Mines"
    }[culture] ?? "Wraeclast road or wilderness";
  }

  static #generateAppearance(npc, tables, rng) {
    const build = this.#rollDescriptors(tables, "Build", 1, npc, rng)[0]
      || this.#rollDescriptors(tables, "Appearance", 1, npc, rng)[0] || "Average build";
    const features = this.#rollDescriptors(tables, "Features", 1, npc, rng)[0]
      || this.#rollDescriptors(tables, "Appearance", 1, npc, rng)[0] || "Weathered features";
    const attire = this.#rollDescriptors(tables, "Attire", 1, npc, rng)[0]
      || this.#rollDescriptors(tables, "Appearance", 1, npc, rng)[0] || "Practical clothing";
    const distinguishingMark = this.#rollDescriptors(tables, "Distinguishing", 1, npc, rng)[0]
      || this.#rollDescriptors(tables, "Appearance", 1, npc, rng)[0] || "Watchful eyes";
    return {
      build,
      features,
      attire,
      distinguishingMark,
      appearance: [build, features, attire, distinguishingMark],
      voice: this.#rollDescriptors(tables, "Voice", 1, npc, rng)[0] || "Measured voice"
    };
  }

  static #generatePersonality(npc, tables, rng) {
    return {
      demeanor: this.#rollDescriptors(tables, "Demeanor", 2, npc, rng),
      attitude: this.#rollDescriptors(tables, "Attitude", 2, npc, rng),
      mannerism: this.#rollDescriptors(tables, "Mannerism", 1, npc, rng)[0] || "Keeps careful watch"
    };
  }

  static #generateHooks(npc, tables, rng) {
    const pick = (category) => this.#pickValue(this.#selectedRows(tables, "hooks", category, npc), rng)
      || "Survival comes first.";
    return { ideal: pick("Ideal"), bond: pick("Bond"), flaw: pick("Flaw") };
  }

  static #generateDrives(npc, tables, rng) {
    const pick = (category) => this.#pickValue(this.#selectedRows(tables, "drives", category, npc), rng)
      || "They keep their reasons private.";
    return {
      goal: pick("Goal"),
      problem: pick("Problem"),
      secret: pick("Secret"),
      knowledge: pick("Knowledge"),
      offer: pick("Offer"),
      disposition: pick("Disposition")
    };
  }

  static #rollDescriptors(tables, category, count, npc, rng) {
    let pool = this.#selectedRows(tables, "descriptors", category, npc, true);
    pool = pool.filter((row) => this.#descriptorCompatible(row, npc)
      && this.#ageAllowsDescriptor(npc.age, row.value));
    const chosen = [];
    while (chosen.length < count) {
      const available = pool.filter((row) => !chosen.includes(row.value) && !chosen.some((value) => this.#contradicts(value, row.value)));
      const pick = this.rollWeighted(available, rng);
      if (!pick) break;
      chosen.push(pick.value);
    }
    return chosen;
  }

  static #professionCategoryPool(tables, culture, affiliation, branch = "") {
    const index = this.#dataIndex(tables);
    const cacheKey = [culture, affiliation, branch].join("|");
    if (index.professionPools.has(cacheKey)) return index.professionPools.get(cacheKey);
    const rows = this.#categoryRows(tables, "main", "ProfessionCategory").filter((row) => row.parent === culture);
    const branchExact = branch ? rows.filter((row) => row.subParent === branch) : [];
    if (branchExact.length) {
      const result = this.#uniqueRows(branchExact);
      index.professionPools.set(cacheKey, result);
      return result;
    }
    const affiliationExact = affiliation ? rows.filter((row) => row.subParent === affiliation) : [];
    const general = rows.filter((row) => this.#isAny(row.subParent));
    const result = this.#uniqueRows(affiliationExact.length ? affiliationExact : general);
    index.professionPools.set(cacheKey, result);
    return result;
  }

  static #professionOptions(tables, culture, affiliation = "", branch = "") {
    if (branch) return this.#professionCategoryPool(tables, culture, affiliation, branch);
    const affiliations = affiliation
      ? [{ value: affiliation }]
      : this.#categoryRows(tables, "main", "Affiliation").filter((row) => row.parent === culture);
    const pools = [];
    for (const affiliationRow of affiliations) {
      const branches = this.#categoryRows(tables, "main", "Branch").filter((row) =>
        row.parent === culture
        && (this.#isAny(row.subParent) || row.subParent === affiliationRow.value)
      );
      if (branches.length) {
        for (const branchRow of branches) {
          pools.push(...this.#professionCategoryPool(tables, culture, affiliationRow.value, branchRow.value));
        }
      } else pools.push(...this.#professionCategoryPool(tables, culture, affiliationRow.value));
    }
    return this.#uniqueRows(pools);
  }

  static #supportsProfession(tables, culture, affiliation = "", branch = "", professionCategory = "") {
    if (!professionCategory || professionCategory === "Youth") return true;
    return this.#professionOptions(tables, culture, affiliation, branch)
      .some((row) => row.value === professionCategory);
  }

  static #agePool(tables, species = "") {
    let pool = this.#categoryRows(tables, "main", "Age");
    if (species && !this.#isLongLived(species)) pool = pool.filter((row) => row.value !== "Ancient");
    return pool;
  }

  static #dataIndex(tables) {
    let index = this.#indexes.get(tables);
    if (index) return index;
    const categories = new Map();
    for (const tableName of ["main", "names", "descriptors", "professions", "hooks", "drives"]) {
      const byCategory = new Map();
      for (const row of tables[tableName] ?? []) {
        if (!byCategory.has(row.category)) byCategory.set(row.category, []);
        byCategory.get(row.category).push(row);
      }
      categories.set(tableName, byCategory);
    }
    index = { categories, selections: new Map(), professionPools: new Map() };
    this.#indexes.set(tables, index);
    return index;
  }

  static #categoryRows(tables, tableName, category) {
    return this.#dataIndex(tables).categories.get(tableName)?.get(category) ?? [];
  }

  static #selectedRows(tables, tableName, category, npc, layered = false) {
    const index = this.#dataIndex(tables);
    const cacheKey = [
      layered ? "layered" : "exact", tableName, category, npc.culture, npc.affiliation,
      npc.branch, npc.organization, npc.ordination, npc.professionCategory, npc.location, npc.era,
      npc.species, npc.age
    ].join("|");
    if (index.selections.has(cacheKey)) return index.selections.get(cacheKey);
    const rows = this.#categoryRows(tables, tableName, category);
    const result = layered ? this.#layeredRows(rows, npc) : this.#mostSpecific(rows, npc);
    index.selections.set(cacheKey, result);
    return result;
  }

  static #mostSpecific(rows, npc) {
    const targets = this.#specificityTargets(npc);
    const matches = rows.filter((row) => {
      if (!this.#isAny(row.parent) && row.parent !== npc.culture) return false;
      return this.#isAny(row.subParent) || targets.includes(row.subParent);
    });
    if (!matches.length) return [];
    const scored = matches.map((row) => ({
      row,
      score: (row.parent === npc.culture ? 4 : 0)
        + (npc.branch && row.subParent === npc.branch ? 8 : 0)
        + (npc.organization && row.subParent === npc.organization ? 7 : 0)
        + (npc.affiliation && row.subParent === npc.affiliation ? 6 : 0)
        + (npc.professionCategory && row.subParent === npc.professionCategory ? 5 : 0)
        + (npc.ordination && row.subParent === npc.ordination ? 4 : 0)
        + (npc.location && row.subParent === npc.location ? 3 : 0)
        + (npc.era && row.subParent === npc.era ? 2 : 0)
    }));
    const max = Math.max(...scored.map(({ score }) => score));
    return scored.filter(({ score }) => score === max).map(({ row }) => row);
  }

  static #layeredRows(rows, npc) {
    const targets = this.#specificityTargets(npc);
    return rows.filter((row) => {
      if (!this.#isAny(row.parent) && row.parent !== npc.culture) return false;
      return this.#isAny(row.subParent) || targets.includes(row.subParent);
    }).map((row) => {
      let multiplier = row.parent === npc.culture ? 3 : 1;
      if (npc.branch && row.subParent === npc.branch) multiplier *= 4;
      else if (npc.organization && row.subParent === npc.organization) multiplier *= 4;
      else if (npc.affiliation && row.subParent === npc.affiliation) multiplier *= 3;
      else if (npc.professionCategory && row.subParent === npc.professionCategory) multiplier *= 3;
      else if (npc.ordination && row.subParent === npc.ordination) multiplier *= 3;
      return { ...row, weight: row.weight * multiplier };
    });
  }

  static #specificityTargets(npc) {
    return [
      npc.branch, npc.organization, npc.affiliation, npc.professionCategory,
      npc.ordination, npc.location, npc.era
    ].filter(Boolean);
  }

  static #presetRows(weightMap) {
    if (!weightMap || Array.isArray(weightMap)) return [];
    return Object.entries(weightMap).map(([value, weight]) => ({ value, weight: Number(weight) || 0 }));
  }

  static #pickValue(pool, rng) {
    return this.rollWeighted(pool, rng)?.value ?? "";
  }

  static #uniqueRows(rows) {
    const values = new Map();
    for (const row of rows) if (!values.has(row.value)) values.set(row.value, row);
    return [...values.values()].sort((a, b) => a.value.localeCompare(b.value));
  }

  static #ageAllowsDescriptor(age, value) {
    if (age === "Child" && /(wrinkled|grey-streaked|silver-streaked|grizzled|stooped|weathered by decades|ancient)/i.test(value)) return false;
    if (["Elder", "Ancient"].includes(age) && /(childlike|youthful face|adolescent|fresh-faced)/i.test(value)) return false;
    return true;
  }

  static #descriptorCompatible(row, npc) {
    const allows = (raw, value) => {
      if (!raw || !value) return true;
      const accepted = String(raw).split("|").map((entry) => entry.trim()).filter(Boolean);
      return accepted.some((entry) => this.#isAny(entry)) || accepted.includes(value);
    };
    return allows(row.species, npc.species)
      && allows(row.ages, npc.age)
      && allows(row.professionCategories, npc.professionCategory);
  }

  static #contradicts(left, right) {
    if (!this.#contradictionIndex) {
      this.#contradictionIndex = new Map();
      for (const pair of this.CONTRADICTIONS) {
        for (const value of pair) {
          if (!this.#contradictionIndex.has(value)) this.#contradictionIndex.set(value, new Set());
          for (const other of pair) if (other !== value) this.#contradictionIndex.get(value).add(other);
        }
      }
    }
    return this.#contradictionIndex.get(left)?.has(right) ?? false;
  }

  static #cleanConstraints(constraints = {}) {
    const allowed = [
      "preset", "culture", "affiliation", "branch", "species", "socialOrigin", "age", "alignment",
      "professionCategory", "location", "era", "capabilityTier"
    ];
    const cleaned = Object.fromEntries(allowed.map((key) => [key, String(constraints[key] ?? "").trim()]));
    const legacy = this.LEGACY_BRANCH_AFFILIATIONS[cleaned.affiliation];
    if (!cleaned.branch && legacy && (!cleaned.culture || cleaned.culture === legacy.culture)) {
      cleaned.branch = cleaned.affiliation;
      cleaned.affiliation = legacy.affiliation;
      cleaned.culture ||= legacy.culture;
    }
    return cleaned;
  }

  static #validateRequested(requested, tables) {
    if (requested.preset && !(tables.presets?.presets ?? []).some((preset) => preset.id === requested.preset)) {
      throw new Error(`Unknown preset: ${requested.preset}`);
    }
    for (const [field, category] of [
      ["socialOrigin", "SocialOrigin"], ["age", "Age"], ["alignment", "Alignment"],
      ["location", "Location"], ["era", "Era"], ["capabilityTier", "CapabilityTier"]
    ]) {
      if (requested[field] && !tables.main.some((row) => row.category === category && row.value === requested[field])) {
        throw new Error(`Unknown ${field}: ${requested[field]}`);
      }
    }
    if (requested.professionCategory && requested.professionCategory !== "Youth"
      && !tables.main.some((row) => row.category === "ProfessionCategory" && row.value === requested.professionCategory)) {
      throw new Error(`Unknown professionCategory: ${requested.professionCategory}`);
    }
    if (requested.branch && !tables.main.some((row) => row.category === "Branch" && row.value === requested.branch)) {
      throw new Error(`Unknown branch: ${requested.branch}`);
    }
  }

  static #isAny(value) {
    return !value || ["Any", "None", "Global"].includes(value);
  }

  static #isLongLived(species) {
    return ["Elf", "Dwarf", "Gnome", "Drow", "Duergar", "Deep Gnome"].includes(species);
  }

  static #camelCase(value) {
    return String(value).trim().replace(/^[A-Z]/, (letter) => letter.toLowerCase()).replace(/[ _-]+(.)/g, (_, letter) => letter.toUpperCase());
  }

  static #weight(value, source) {
    const weight = Number(value || 1);
    if (!Number.isFinite(weight) || weight <= 0) throw new Error(`${source}: invalid weight ${value}`);
    return weight;
  }
}

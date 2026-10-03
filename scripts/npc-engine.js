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
    hooks: "hooks.csv"
  });

  static RESERVED_NAMES = new Set([
    "atziri", "doryani", "innocence", "kitava", "piety", "oak", "haku",
    "irasha", "tasuni", "cassia", "clarissa", "hargan", "dannig", "gwennen",
    "rog", "tujen", "sekhema", "arohongui", "oris steelhand", "ceilia steelhand"
  ]);

  static CONTRADICTIONS = Object.freeze([
    ["Towering", "Very short"],
    ["Broad-shouldered", "Narrow-shouldered"],
    ["Powerfully built", "Frail"],
    ["Immaculately groomed", "Grime-streaked"],
    ["Shaven-headed", "Waist-length hair"],
    ["Booming voice", "Whisper-soft voice"],
    ["Restless", "Unhurried"],
    ["Openly trusting", "Suspicious"],
    ["Warm and welcoming", "Cold and distant"]
  ]);

  static #cache = new Map();

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
      const presetResponse = await fetch(`${cacheKey}/presets.json`);
      if (!presetResponse.ok) throw new Error(`presets.json: HTTP ${presetResponse.status} ${presetResponse.statusText}`);
      const tables = Object.fromEntries(entries);
      tables.presets = await presetResponse.json();
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
    const cultures = this.#uniqueRows(tables.main.filter((row) => row.category === "Culture"));
    const compatibleCultures = cultures.filter((row) => {
      const affiliationOK = !constraints.affiliation || tables.main.some((candidate) =>
        candidate.category === "Affiliation" && candidate.parent === row.value && candidate.value === constraints.affiliation
      );
      const speciesOK = !constraints.species || tables.main.some((candidate) =>
        candidate.category === "Species" && candidate.parent === row.value && candidate.value === constraints.species
      );
      const professionOK = !constraints.professionCategory || constraints.age === "Child" || tables.main.some((candidate) =>
        candidate.category === "ProfessionCategory"
        && candidate.parent === row.value
        && candidate.value === constraints.professionCategory
        && (this.#isAny(candidate.subParent) || !constraints.affiliation || candidate.subParent === constraints.affiliation)
      );
      const ageOK = constraints.age !== "Ancient" || tables.main.some((candidate) =>
        candidate.category === "Species" && candidate.parent === row.value && this.#isLongLived(candidate.value)
      );
      return affiliationOK && speciesOK && professionOK && ageOK;
    });

    const culture = constraints.culture || (compatibleCultures.length === 1 ? compatibleCultures[0].value : "");
    const affiliations = this.#uniqueRows(tables.main.filter((row) =>
      row.category === "Affiliation" && (!culture || row.parent === culture)
    ));
    const species = this.#uniqueRows(tables.main.filter((row) =>
      row.category === "Species"
      && (!culture || row.parent === culture)
      && (constraints.age !== "Ancient" || this.#isLongLived(row.value))
    ));
    const professionCategories = culture
      ? this.#professionCategoryPool(tables, culture, constraints.affiliation || "")
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
      species,
      socialOrigins: this.#uniqueRows(tables.main.filter((row) => row.category === "SocialOrigin")),
      ages,
      alignments: this.#uniqueRows(tables.main.filter((row) => row.category === "Alignment")),
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
    const organization = this.#resolveOrganization({ culture, affiliation }, tables, rng);
    const species = this.#resolveSpecies(requested, preset, culture, tables, rng, organization);
    const socialOrigin = requested.socialOrigin
      || this.#pickValue(this.#presetRows(preset?.socialOrigins), rng)
      || this.#pickValue(tables.main.filter((row) => row.category === "SocialOrigin"), rng)
      || "Native";
    let agePool = this.#agePool(tables, species);
    if (requested.professionCategory && requested.professionCategory !== "Youth") {
      agePool = agePool.filter((row) => row.value !== "Child");
    }
    const age = requested.age || (requested.professionCategory === "Youth" ? "Child" : this.#pickValue(agePool, rng)) || "Adult";
    const alignment = requested.alignment
      || this.#pickValue(tables.main.filter((row) => row.category === "Alignment"), rng)
      || "True Neutral";

    const npc = { culture, affiliation, species, socialOrigin, age, alignment, organization, preset: preset?.id ?? "general" };
    Object.assign(npc, this.#generateName(npc, tables, rng));
    Object.assign(npc, this.#generateProfession(npc, tables, requested, rng));
    Object.assign(npc, this.#generateAppearance(npc, tables, rng));
    Object.assign(npc, this.#generatePersonality(npc, tables, rng));
    Object.assign(npc, this.#generateHooks(npc, tables, rng));
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
    else throw new Error(`Unknown reroll section: ${section}`);
    return next;
  }

  static validateTables(tables) {
    const errors = [];
    const warnings = [];
    for (const key of ["main", "names", "descriptors", "professions", "hooks"]) {
      if (!Array.isArray(tables[key]) || !tables[key].length) errors.push(`${key} has no rows`);
    }

    const cultures = new Set((tables.main ?? []).filter((row) => row.category === "Culture").map((row) => row.value));
    for (const required of ["Oriathan", "Azmeri", "Ezomyte", "Maraketh", "Karui", "Vaal", "Kalguur", "Stygian"]) {
      if (!cultures.has(required)) errors.push(`missing culture: ${required}`);
    }
    for (const culture of cultures) {
      const hasAffiliation = tables.main.some((row) => row.category === "Affiliation" && row.parent === culture);
      const hasSpecies = tables.main.some((row) => row.category === "Species" && row.parent === culture);
      const hasFirst = tables.names.some((row) => row.category === "Name" && row.parent === culture);
      const hasSurname = tables.names.some((row) => row.category === "Surname" && row.parent === culture);
      const hasProfession = tables.main.some((row) => row.category === "ProfessionCategory" && row.parent === culture);
      if (!hasAffiliation) errors.push(`${culture} has no affiliation pool`);
      if (!hasSpecies) errors.push(`${culture} has no species pool`);
      if (!hasFirst || !hasSurname) errors.push(`${culture} has incomplete name pools`);
      if (!hasProfession) errors.push(`${culture} has no profession categories`);
    }

    for (const row of (tables.main ?? []).filter((candidate) => candidate.category === "Affiliation")) {
      if (!cultures.has(row.parent)) errors.push(`affiliation ${row.value} has unknown culture ${row.parent}`);
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
    }
    if (!presetIds.has("general")) errors.push("missing general preset");

    const knownCategories = new Set((tables.professions ?? []).map((row) => row.category));
    for (const row of (tables.main ?? []).filter((candidate) => candidate.category === "ProfessionCategory")) {
      if (!knownCategories.has(row.value)) errors.push(`profession category has no jobs: ${row.value}`);
    }
    if (!(tables.names ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian name pool");
    if (!(tables.hooks ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian hooks");
    if (!(tables.professions ?? []).some((row) => row.parent === "Stygian")) errors.push("missing Stygian professions");
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
        const valid = new Set(tables.main.filter((row) => row.category === "Affiliation" && row.value === requested.affiliation).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.species) {
        const valid = new Set(tables.main.filter((row) => row.category === "Species" && row.value === requested.species).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.professionCategory && requested.professionCategory !== "Youth" && requested.age !== "Child") {
        const valid = new Set(tables.main.filter((row) =>
          row.category === "ProfessionCategory"
          && row.value === requested.professionCategory
          && (this.#isAny(row.subParent) || !requested.affiliation || row.subParent === requested.affiliation)
        ).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      if (requested.age === "Ancient") {
        const valid = new Set(tables.main.filter((row) => row.category === "Species" && this.#isLongLived(row.value)).map((row) => row.parent));
        candidates = candidates.filter((row) => valid.has(row.value));
      }
      return candidates;
    };
    const globalPool = tables.main.filter((row) => row.category === "Culture");
    const presetPool = this.#presetRows(preset?.cultures);
    let pool = applyFilters(presetPool.length ? presetPool : globalPool);
    if (!pool.length && (requested.affiliation || requested.species || requested.professionCategory || requested.age)) {
      pool = applyFilters(globalPool);
    }
    const value = this.#pickValue(pool, rng);
    if (!value) throw new Error("No culture is compatible with the selected filters");
    return value;
  }

  static #resolveAffiliation(requested, preset, culture, tables, rng) {
    const pool = tables.main.filter((row) => row.category === "Affiliation" && row.parent === culture);
    if (requested.affiliation) {
      if (!pool.some((row) => row.value === requested.affiliation)) throw new Error(`${requested.affiliation} is not a valid ${culture} affiliation`);
      return requested.affiliation;
    }
    const presetPool = this.#presetRows(preset?.affiliations?.[culture] ?? preset?.affiliations);
    return this.#pickValue(presetPool.filter((row) => pool.some((valid) => valid.value === row.value)), rng)
      || this.#pickValue(pool, rng) || "Unaffiliated";
  }

  static #resolveSpecies(requested, preset, culture, tables, rng, organization = "") {
    const pool = tables.main.filter((row) =>
      row.category === "Species"
      && row.parent === culture
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
    const firstPool = this.#mostSpecific(tables.names.filter((row) => row.category === "Name"), npc);
    const surnamePool = this.#mostSpecific(tables.names.filter((row) => row.category === "Surname"), npc);
    let firstName = this.#pickValue(firstPool, rng) || "Unnamed";
    let surname = this.#pickValue(surnamePool, rng) || "";
    let fullName = `${firstName} ${surname}`.trim();
    for (let attempt = 0; attempt < 8 && this.RESERVED_NAMES.has(fullName.toLocaleLowerCase()); attempt += 1) {
      firstName = this.#pickValue(firstPool, rng) || "Unnamed";
      surname = this.#pickValue(surnamePool, rng) || "";
      fullName = `${firstName} ${surname}`.trim();
    }
    return { firstName, surname, fullName };
  }

  static #generateProfession(npc, tables, constraints, rng) {
    const pool = npc.age === "Child" ? [{ value: "Youth", weight: 1 }] : this.#professionCategoryPool(tables, npc.culture, npc.affiliation);
    const requestedCategory = constraints.professionCategory;
    if (requestedCategory && !pool.some((row) => row.value === requestedCategory)) {
      throw new Error(`${requestedCategory} is not valid for ${npc.culture}${npc.affiliation ? ` / ${npc.affiliation}` : ""}`);
    }
    const professionCategory = requestedCategory || this.#pickValue(pool, rng) || "Commoner";
    const jobPool = this.#mostSpecific(tables.professions.filter((row) => row.category === professionCategory), npc);
    const profession = this.#pickValue(jobPool, rng) || `${professionCategory} worker`;

    return { professionCategory, profession, organization: npc.organization || "" };
  }

  static #resolveOrganization(npc, tables, rng) {
    if (npc.affiliation === "Templar") {
      return this.#pickValue(this.#mostSpecific(
        tables.professions.filter((row) => row.category === "Templar Branch"), npc
      ), rng) || "Emerald Legion (Quartus, recruit and volunteer)";
    }
    if (npc.affiliation === "The Ring") return "The Ring";
    if (["Hinekora", "Tawhoa", "Emberforged", "Hollowed Vein", "Kalguur Expedition"].includes(npc.affiliation)) return npc.affiliation;
    return "";
  }

  static #generateAppearance(npc, tables, rng) {
    return {
      appearance: this.#rollDescriptors(tables, "Appearance", 3, npc, rng),
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
    const pick = (category) => this.#pickValue(this.#mostSpecific(tables.hooks.filter((row) => row.category === category), npc), rng)
      || "Survival comes first.";
    return { ideal: pick("Ideal"), bond: pick("Bond"), flaw: pick("Flaw") };
  }

  static #rollDescriptors(tables, category, count, npc, rng) {
    let pool = this.#mostSpecific(tables.descriptors.filter((row) => row.category === category), npc);
    pool = pool.filter((row) => this.#ageAllowsDescriptor(npc.age, row.value));
    const chosen = [];
    while (chosen.length < count) {
      const available = pool.filter((row) => !chosen.includes(row.value) && !chosen.some((value) => this.#contradicts(value, row.value)));
      const pick = this.rollWeighted(available, rng);
      if (!pick) break;
      chosen.push(pick.value);
    }
    return chosen;
  }

  static #professionCategoryPool(tables, culture, affiliation) {
    const rows = tables.main.filter((row) => row.category === "ProfessionCategory" && row.parent === culture);
    if (!affiliation) return this.#uniqueRows(rows);
    const exact = rows.filter((row) => row.subParent === affiliation);
    const general = rows.filter((row) => this.#isAny(row.subParent));
    return this.#uniqueRows(exact.length ? exact : general);
  }

  static #agePool(tables, species = "") {
    let pool = tables.main.filter((row) => row.category === "Age");
    if (species && !this.#isLongLived(species)) pool = pool.filter((row) => row.value !== "Ancient");
    return pool;
  }

  static #mostSpecific(rows, npc) {
    const matches = rows.filter((row) =>
      (this.#isAny(row.parent) || row.parent === npc.culture)
      && (this.#isAny(row.subParent) || row.subParent === npc.affiliation)
    );
    if (!matches.length) return [];
    const scored = matches.map((row) => ({ row, score: (row.parent === npc.culture ? 2 : 0) + (row.subParent === npc.affiliation ? 1 : 0) }));
    const max = Math.max(...scored.map(({ score }) => score));
    return scored.filter(({ score }) => score === max).map(({ row }) => row);
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
    if (age === "Child" && /(wrinkled|grey|grizzled|stooped|weathered by decades|ancient)/i.test(value)) return false;
    if (["Elder", "Ancient"].includes(age) && /(childlike|youthful face|adolescent)/i.test(value)) return false;
    return true;
  }

  static #contradicts(left, right) {
    return this.CONTRADICTIONS.some((pair) => pair.includes(left) && pair.includes(right));
  }

  static #cleanConstraints(constraints = {}) {
    const allowed = ["preset", "culture", "affiliation", "species", "socialOrigin", "age", "alignment", "professionCategory"];
    return Object.fromEntries(allowed.map((key) => [key, String(constraints[key] ?? "").trim()]));
  }

  static #validateRequested(requested, tables) {
    if (requested.preset && !(tables.presets?.presets ?? []).some((preset) => preset.id === requested.preset)) {
      throw new Error(`Unknown preset: ${requested.preset}`);
    }
    for (const [field, category] of [["socialOrigin", "SocialOrigin"], ["age", "Age"], ["alignment", "Alignment"]]) {
      if (requested[field] && !tables.main.some((row) => row.category === category && row.value === requested[field])) {
        throw new Error(`Unknown ${field}: ${requested[field]}`);
      }
    }
    if (requested.professionCategory && requested.professionCategory !== "Youth"
      && !tables.main.some((row) => row.category === "ProfessionCategory" && row.value === requested.professionCategory)) {
      throw new Error(`Unknown professionCategory: ${requested.professionCategory}`);
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

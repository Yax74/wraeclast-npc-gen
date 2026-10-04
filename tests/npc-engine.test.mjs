import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { NPCEngine } from "../scripts/npc-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readCSV = async (name) => NPCEngine.parseCSVText(
  await readFile(path.join(root, "data", `${name}.csv`), "utf8"),
  `${name}.csv`
);
const tables = {
  main: await readCSV("main_tables"),
  names: await readCSV("names"),
  descriptors: await readCSV("descriptors"),
  professions: await readCSV("professions"),
  hooks: await readCSV("hooks"),
  drives: await readCSV("drives"),
  presets: JSON.parse(await readFile(path.join(root, "data", "presets.json"), "utf8")),
  factions: JSON.parse(await readFile(path.join(root, "data", "factions.json"), "utf8"))
};

const rng = (seed = 0x1a2b3c4d) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

test("CSV parser handles quoted commas and escaped quotes", () => {
  const parsed = NPCEngine.parseCSVText('Category,Parent,SubParent,Value,Weight\nTest,Any,Any,"Smith, \"\"the Quiet\"\"",2\n');
  assert.deepEqual(parsed[0], {
    category: "Test", parent: "Any", subParent: "Any", value: 'Smith, "the Quiet"', weight: 2
  });
});

test("campaign data passes structural and lore validation", () => {
  const report = NPCEngine.validateTables(tables);
  assert.deepEqual(report.errors, []);
  const branches = (culture) => new Set(tables.main
    .filter((entry) => entry.category === "Branch" && entry.parent === culture && entry.value !== "Unaffiliated")
    .map((entry) => entry.value));
  assert.deepEqual(branches("Karui"), new Set([
    "Tukohama", "Ngamahu", "Valako", "Tasalio", "Ramako", "Rongokurai",
    "Arohongui", "Tawhoa", "Kitava", "Hinekora", "Sione", "Lani Lua"
  ]));
  assert.deepEqual(branches("Stygian"), new Set([
    "Deepwardens", "Sulphite Syndicate", "Shadowborn", "Emberforged", "Hollowed Vein"
  ]));
  assert.deepEqual(
    tables.main.filter((entry) => entry.category === "Affiliation" && entry.parent === "Karui").map((entry) => entry.value),
    ["Karui"]
  );
  assert.deepEqual(
    tables.main.filter((entry) => entry.category === "Affiliation" && entry.parent === "Stygian").map((entry) => entry.value),
    ["Stygian"]
  );
  assert.equal(tables.names.length, 870);
  assert.equal(tables.professions.length, 691);
  assert.equal(tables.descriptors.length, 860);
  assert.equal(tables.hooks.length, 480);
  assert.equal(tables.drives.length, 300);
  for (const reserved of ["Cato", "Tane", "Lucan", "Kaom", "Hyrri", "Lani", "Utula", "Oyun", "Kira", "Dannig", "Gwennen", "Rog", "Tujen"]) {
    assert.ok(!tables.names.some((entry) => entry.value === reserved), `${reserved} leaked into the random name pool`);
  }
  for (const culture of ["Oriathan", "Azmeri", "Ezomyte", "Maraketh", "Karui", "Vaal", "Kalguur", "Stygian"]) {
    assert.ok(tables.names.filter((entry) => entry.parent === culture && entry.category === "Name").length >= 60);
    assert.ok(tables.names.filter((entry) => entry.parent === culture && entry.category === "Surname").length >= 40);
    assert.ok(tables.descriptors.filter((entry) => entry.parent === culture && entry.category === "Voice").length >= 12);
  }
  assert.ok(tables.professions.filter((entry) => entry.parent === "Stygian").length >= 50);
  assert.ok(tables.hooks.filter((entry) => entry.parent === "Stygian").length >= 30);
});

test("every preset generates complete and internally consistent NPCs", () => {
  const random = rng(42);
  const contradictions = NPCEngine.CONTRADICTIONS;
  for (const preset of tables.presets.presets) {
    for (let i = 0; i < 1200; i += 1) {
      const npc = NPCEngine.generateNPC({ preset: preset.id }, tables, random);
      for (const field of [
        "culture", "affiliation", "species", "age", "alignment", "fullName", "profession",
        "location", "era", "capabilityTier", "ideal", "bond", "flaw", "goal", "problem",
        "secret", "knowledge", "offer", "disposition", "build", "features", "attire", "distinguishingMark"
      ]) {
        assert.ok(npc[field], `${preset.id} produced a blank ${field}`);
      }
      assert.ok(tables.main.some((entry) => entry.category === "Affiliation" && entry.parent === npc.culture && entry.value === npc.affiliation));
      const branchPool = tables.main.filter((entry) =>
        entry.category === "Branch" && entry.parent === npc.culture && entry.subParent === npc.affiliation
      );
      if (branchPool.length) assert.ok(branchPool.some((entry) => entry.value === npc.branch));
      else assert.equal(npc.branch, "");
      assert.ok(tables.main.some((entry) => entry.category === "Species" && entry.parent === npc.culture && entry.value === npc.species));
      assert.equal(NPCEngine.RESERVED_NAMES.has(npc.fullName.toLocaleLowerCase()), false);
      assert.notEqual(npc.firstName, "Unnamed");
      assert.notEqual(npc.profession, `${npc.professionCategory} worker`);
      if (npc.age === "Child") assert.equal(npc.professionCategory, "Youth");
      if (npc.age === "Ancient") assert.ok(["Elf", "Dwarf", "Gnome", "Drow", "Duergar", "Deep Gnome"].includes(npc.species));
      const descriptors = [...npc.appearance, ...npc.demeanor, ...npc.attitude, npc.voice, npc.mannerism];
      for (const pair of contradictions) {
        assert.ok(pair.filter((value) => descriptors.includes(value)).length < 2, `contradictory descriptors: ${pair.join(" / ")}`);
      }
    }
  }
});

test("expanded pools produce broad cultural variety", () => {
  const random = rng(90210);
  for (const culture of ["Oriathan", "Azmeri", "Ezomyte", "Maraketh", "Karui", "Vaal", "Kalguur", "Stygian"]) {
    const seen = {
      firstNames: new Set(), surnames: new Set(), professions: new Set(), appearance: new Set(),
      demeanor: new Set(), attitude: new Set(), voices: new Set()
    };
    for (let i = 0; i < 1200; i += 1) {
      const npc = NPCEngine.generateNPC({ culture, age: "Adult" }, tables, random);
      seen.firstNames.add(npc.firstName);
      seen.surnames.add(npc.surname);
      seen.professions.add(npc.profession);
      npc.appearance.forEach((value) => seen.appearance.add(value));
      npc.demeanor.forEach((value) => seen.demeanor.add(value));
      npc.attitude.forEach((value) => seen.attitude.add(value));
      seen.voices.add(npc.voice);
    }
    assert.ok(seen.firstNames.size >= 55, `${culture} first-name variety was ${seen.firstNames.size}`);
    assert.ok(seen.surnames.size >= 35, `${culture} surname variety was ${seen.surnames.size}`);
    assert.ok(seen.professions.size >= 100, `${culture} profession variety was ${seen.professions.size}`);
    assert.ok(seen.appearance.size >= 120, `${culture} appearance variety was ${seen.appearance.size}`);
    assert.ok(seen.demeanor.size >= 80, `${culture} demeanor variety was ${seen.demeanor.size}`);
    assert.ok(seen.attitude.size >= 75, `${culture} attitude variety was ${seen.attitude.size}`);
    assert.ok(seen.voices.size >= 55, `${culture} voice variety was ${seen.voices.size}`);
  }
});

test("general and location presets respect their intended scope", () => {
  const random = rng(73);
  for (let i = 0; i < 2500; i += 1) {
    assert.notEqual(NPCEngine.generateNPC({ preset: "general" }, tables, random).culture, "Vaal");
    assert.equal(NPCEngine.generateNPC({ preset: "stygian_mines" }, tables, random).culture, "Stygian");
    assert.equal(NPCEngine.generateNPC({ preset: "karui_tribe" }, tables, random).culture, "Karui");
    assert.equal(NPCEngine.generateNPC({ preset: "kalguur_expedition" }, tables, random).culture, "Kalguur");
    assert.equal(NPCEngine.generateNPC({ preset: "vaal_historical" }, tables, random).culture, "Vaal");
  }
});

test("corrected species distributions match campaign canon", () => {
  const random = rng(98);
  const counts = {
    Ezomyte: new Map(), Karui: new Map(), Kalguur: new Map(), Stygian: new Map(), Maraketh: new Map(), Vaal: new Map()
  };
  for (const culture of Object.keys(counts)) {
    for (let i = 0; i < 4000; i += 1) {
      const species = NPCEngine.generateNPC({ culture }, tables, random).species;
      counts[culture].set(species, (counts[culture].get(species) ?? 0) + 1);
    }
  }
  assert.ok(counts.Ezomyte.get("Dwarf") > 2700);
  assert.ok(counts.Karui.get("Half-Orc") > 2500);
  assert.ok(counts.Kalguur.get("Elf") > 3000);
  assert.ok(counts.Maraketh.get("Halfling") > 2700);
  assert.ok(counts.Vaal.get("Gnome") > 3000);
  assert.deepEqual([...counts.Stygian.keys()].sort(), ["Deep Gnome", "Drow", "Duergar"]);
});

test("factions generate their own jobs, branches, and hooks", () => {
  const random = rng(240);
  const templarBranches = new Set(tables.professions.filter((entry) => entry.category === "Templar Branch").map((entry) => entry.value));
  const ringJobs = new Set(tables.professions.filter((entry) => entry.category === "The Ring" && entry.parent === "Oriathan").map((entry) => entry.value));
  for (let i = 0; i < 500; i += 1) {
    const templar = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "Templar" }, tables, random);
    assert.ok(templarBranches.has(templar.organization));
    const ring = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "The Ring", professionCategory: "The Ring" }, tables, random);
    assert.ok(ringJobs.has(ring.profession));
    assert.equal(ring.organization, "The Ring");
    const stygian = NPCEngine.generateNPC({ culture: "Stygian", affiliation: "Stygian", branch: "Emberforged" }, tables, random);
    assert.equal(stygian.affiliation, "Stygian");
    assert.equal(stygian.branch, "Emberforged");
    const karui = NPCEngine.generateNPC({ culture: "Karui", affiliation: "Karui", branch: "Hinekora" }, tables, random);
    assert.equal(karui.affiliation, "Karui");
    assert.equal(karui.branch, "Hinekora");
  }
  assert.ok([...templarBranches].some((branch) => branch.includes("first Sarn legion")));
  assert.ok([...templarBranches].some((branch) => branch.includes("second Sarn legion")));
});

test("branch options preserve the faction hierarchy", () => {
  const karui = NPCEngine.getOptions(tables, { culture: "Karui" });
  assert.deepEqual(karui.affiliations.map((entry) => entry.value), ["Karui"]);
  assert.equal(karui.branches.length, 13);
  assert.ok(karui.branches.some((entry) => entry.value === "Lani Lua"));

  const shadowborn = NPCEngine.getOptions(tables, { branch: "Shadowborn" });
  assert.deepEqual(shadowborn.cultures.map((entry) => entry.value), ["Stygian"]);
  assert.deepEqual(shadowborn.affiliations.map((entry) => entry.value), ["Stygian"]);

  const oriathan = NPCEngine.getOptions(tables, { culture: "Oriathan" });
  assert.deepEqual(oriathan.branches, []);
});

test("legacy flattened affiliation constraints migrate to branches", () => {
  const stygian = NPCEngine.generateNPC({ affiliation: "Emberforged" }, tables, rng(11));
  assert.equal(stygian.culture, "Stygian");
  assert.equal(stygian.affiliation, "Stygian");
  assert.equal(stygian.branch, "Emberforged");

  const karui = NPCEngine.generateNPC({ affiliation: "Tawhoa" }, tables, rng(12));
  assert.equal(karui.culture, "Karui");
  assert.equal(karui.affiliation, "Karui");
  assert.equal(karui.branch, "Tawhoa");
});

test("every named branch generates branch-specific hooks", () => {
  const random = rng(551);
  const namedBranches = tables.main.filter((entry) => entry.category === "Branch" && entry.value !== "Unaffiliated");
  for (const branch of namedBranches) {
    const npc = NPCEngine.generateNPC({
      culture: branch.parent,
      affiliation: branch.subParent,
      branch: branch.value,
      age: "Adult"
    }, tables, random);
    assert.equal(npc.branch, branch.value);
    for (const [field, category] of [["ideal", "Ideal"], ["bond", "Bond"], ["flaw", "Flaw"]]) {
      assert.ok(tables.hooks.some((entry) =>
        entry.category === category
        && entry.parent === branch.parent
        && entry.subParent === branch.value
        && entry.value === npc[field]
      ), `${branch.parent}/${branch.value} did not use a branch-specific ${field}`);
    }
  }
});

test("Emerald Legion recruitment is approximately half non-human", () => {
  const random = rng(1240);
  let emerald = 0;
  let human = 0;
  for (let i = 0; i < 12000; i += 1) {
    const npc = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "Templar", age: "Adult" }, tables, random);
    if (!npc.organization.startsWith("Emerald Legion")) continue;
    emerald += 1;
    if (npc.species === "Human") human += 1;
  }
  assert.ok(emerald > 2500);
  assert.ok(human / emerald > 0.46 && human / emerald < 0.54, `human share was ${human / emerald}`);
});

test("surname selection honours affiliation specificity", () => {
  const custom = structuredClone(tables);
  custom.names.push({ category: "Surname", parent: "Oriathan", subParent: "The Ring", value: "ExactBranch", weight: 1 });
  const npc = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "The Ring", age: "Adult" }, custom, () => 0);
  assert.equal(npc.surname, "ExactBranch");
});

test("locks and API constraints reject impossible combinations", () => {
  assert.throws(
    () => NPCEngine.generateNPC({ culture: "Karui", species: "Drow" }, tables, rng(1)),
    /not a valid Karui species/
  );
  assert.throws(
    () => NPCEngine.generateNPC({ culture: "Karui", age: "Ancient" }, tables, rng(1)),
    /No species is compatible/
  );
  assert.throws(
    () => NPCEngine.generateNPC({ culture: "Stygian", affiliation: "Templar" }, tables, rng(1)),
    /not a valid Stygian affiliation/
  );
  assert.throws(
    () => NPCEngine.generateNPC({ culture: "Stygian", affiliation: "Stygian", branch: "Hinekora" }, tables, rng(1)),
    /not a branch of Stygian/
  );
  const overridden = NPCEngine.generateNPC({ preset: "general", professionCategory: "Royal Court", age: "Adult" }, tables, rng(2));
  assert.equal(overridden.culture, "Vaal");
  const youth = NPCEngine.generateNPC({ professionCategory: "Youth" }, tables, rng(3));
  assert.equal(youth.age, "Child");
  assert.equal(youth.professionCategory, "Youth");
  assert.throws(() => NPCEngine.generateNPC({ preset: "not-real" }, tables, rng(4)), /Unknown preset/);
});

test("ordained Templars use bestowed virtue-names while lay members keep birth names", () => {
  const random = rng(6201);
  const virtues = new Set(tables.names
    .filter((entry) => entry.category === "OrdainedName" && entry.parent === "Oriathan")
    .map((entry) => entry.value));
  let ordained = 0;
  let lay = 0;
  for (let i = 0; i < 5000; i += 1) {
    const npc = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "Templar", age: "Adult" }, tables, random);
    assert.equal(npc.factionId, "oriath.templar");
    if (npc.organization === "Archivists") assert.equal(npc.ordination, "Ordained");
    if (npc.ordination === "Ordained") {
      ordained += 1;
      assert.ok(virtues.has(npc.firstName));
      assert.equal(npc.surname, "");
      assert.equal(npc.fullName, `Templar ${npc.firstName}`);
      assert.equal(npc.nameStyle, "Bestowed virtue-name");
      assert.ok(["Initiate", "Archivist", "Lord Archivist", "High Archivist", "Initiate Templar", "Templar", "Templar Captain", "Lord Templar General"].includes(npc.rank));
    } else {
      lay += 1;
      assert.equal(npc.nameStyle, "Birth name");
      assert.ok(!npc.fullName.startsWith("Templar "));
      assert.ok(["Guard", "Sergeant", "Senior Sergeant"].includes(npc.rank));
    }
  }
  assert.ok(ordained > 600, `only ${ordained} ordained Templars generated`);
  assert.ok(lay > 2500, `only ${lay} lay Templars generated`);
});

test("Oriath Militia is distinct from the Templars and uses militia content", () => {
  const random = rng(7114);
  const militiaJobs = new Set(tables.professions
    .filter((entry) => entry.category === "Militia Service" && entry.parent === "Oriathan")
    .map((entry) => entry.value));
  for (let i = 0; i < 500; i += 1) {
    const npc = NPCEngine.generateNPC({
      culture: "Oriathan", affiliation: "Oriath Militia", professionCategory: "Militia Service", age: "Adult"
    }, tables, random);
    assert.equal(npc.organization, "Oriath Militia");
    assert.equal(npc.ordination, "");
    assert.equal(npc.factionId, "oriath.militia");
    assert.ok(militiaJobs.has(npc.profession));
    assert.ok(["Militia Guard", "Constable", "Watch Sergeant", "Militia Captain"].includes(npc.rank));
    assert.ok(!npc.fullName.startsWith("Templar "));
    for (const [field, category] of [["goal", "Goal"], ["problem", "Problem"], ["secret", "Secret"], ["knowledge", "Knowledge"], ["offer", "Offer"], ["disposition", "Disposition"]]) {
      assert.ok(tables.drives.some((entry) => entry.category === category
        && entry.parent === "Oriathan" && entry.subParent === "Oriath Militia" && entry.value === npc[field]));
    }
  }
});

test("structured descriptors honour species, age, and profession restrictions", () => {
  const custom = structuredClone(tables);
  const unrestricted = custom.descriptors.filter((entry) => !["Features", "Attire", "Distinguishing"].includes(entry.category));
  custom.descriptors = [
    ...unrestricted,
    { category: "Features", parent: "Any", subParent: "Any", value: "Wrong elder feature", weight: 100, species: "Any", ages: "Elder", professionCategories: "Any" },
    { category: "Features", parent: "Any", subParent: "Any", value: "Adult feature", weight: 1, species: "Any", ages: "Adult", professionCategories: "Any" },
    { category: "Attire", parent: "Any", subParent: "Any", value: "Wrong scholar attire", weight: 100, species: "Any", ages: "Any", professionCategories: "Scholarly" },
    { category: "Attire", parent: "Any", subParent: "Any", value: "Military attire", weight: 1, species: "Any", ages: "Any", professionCategories: "Military" },
    { category: "Distinguishing", parent: "Any", subParent: "Any", value: "Wrong gnome mark", weight: 100, species: "Gnome", ages: "Any", professionCategories: "Any" },
    { category: "Distinguishing", parent: "Any", subParent: "Any", value: "Half-orc mark", weight: 1, species: "Half-Orc", ages: "Any", professionCategories: "Any" }
  ];
  const npc = NPCEngine.generateNPC({
    culture: "Karui", species: "Half-Orc", age: "Adult", professionCategory: "Military"
  }, custom, rng(81));
  assert.equal(npc.features, "Adult feature");
  assert.equal(npc.attire, "Military attire");
  assert.equal(npc.distinguishingMark, "Half-orc mark");
});

test("location, era, capability, faction IDs, and custom overrides are first-class data", () => {
  const vaal = NPCEngine.generateNPC({ culture: "Vaal", capabilityTier: "Elite" }, tables, rng(91));
  assert.equal(vaal.location, "Ancient Vaal city");
  assert.equal(vaal.era, "Ancient Vaal");
  assert.equal(vaal.capabilityTier, "Elite");

  const overridden = NPCEngine.applyOverrides(tables, {
    add: {
      names: [
        { category: "Name", parent: "Oriathan", subParent: "The Ring", value: "LocalName", weight: 1 },
        { category: "Surname", parent: "Oriathan", subParent: "The Ring", value: "LocalSurname", weight: 1 }
      ]
    }
  });
  const local = NPCEngine.generateNPC({ culture: "Oriathan", affiliation: "The Ring", age: "Adult" }, overridden, () => 0);
  assert.equal(local.fullName, "LocalName LocalSurname");
  assert.throws(() => NPCEngine.applyOverrides(tables, { names: "bad" }), /names overrides must be an array/);
});

test("section rerolls preserve identity", () => {
  const random = rng(777);
  const npc = NPCEngine.generateNPC({ preset: "stygian_mines" }, tables, random);
  const identity = Object.fromEntries(["culture", "affiliation", "branch", "species", "socialOrigin", "age", "alignment"].map((key) => [key, npc[key]]));
  for (const section of ["name", "profession", "appearance", "personality", "hooks", "drives"]) {
    const rerolled = NPCEngine.rerollSection(npc, section, identity, tables, random);
    for (const [key, value] of Object.entries(identity)) assert.equal(rerolled[key], value);
  }
});

test("batch size is bounded for UI safety", () => {
  assert.equal(NPCEngine.generateBatch(0, {}, tables, rng(1)).length, 1);
  assert.equal(NPCEngine.generateBatch(4, {}, tables, rng(1)).length, 4);
  assert.equal(NPCEngine.generateBatch(999, {}, tables, rng(1)).length, 10);
});

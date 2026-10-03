import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const row = (category, parent, subParent, value, weight = 1) => ({ category, parent, subParent, value, weight });
const addValues = (target, category, parent, subParent, values, weight = 1) => {
  for (const value of values) target.push(row(category, parent, subParent, value, weight));
};
const split = (value) => value.split("|").map((item) => item.trim()).filter(Boolean);
const csv = (rows) => {
  const fields = ["Category", "Parent", "SubParent", "Value", "Weight"];
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return `${fields.join(",")}\n${rows.map((item) => [item.category, item.parent, item.subParent, item.value, item.weight].map(escape).join(",")).join("\n")}\n`;
};

const main = [];
for (const [value, weight] of Object.entries({ Oriathan: 28, Azmeri: 14, Ezomyte: 12, Maraketh: 11, Karui: 12, Vaal: 5, Kalguur: 10, Stygian: 8 })) {
  main.push(row("Culture", "Global", "None", value, weight));
}
const affiliationPools = {
  Oriathan: { Unaffiliated: 50, Templar: 30, "The Ring": 20 },
  Azmeri: { Unaffiliated: 100 },
  Ezomyte: { Unaffiliated: 100 },
  Maraketh: { Unaffiliated: 100 },
  Karui: { Hinekora: 40, Tawhoa: 40, Unaffiliated: 20 },
  Vaal: { Unaffiliated: 100 },
  Kalguur: { "Kalguur Expedition": 70, Unaffiliated: 30 },
  Stygian: { Emberforged: 60, "Hollowed Vein": 15, Unaffiliated: 25 }
};
for (const [culture, values] of Object.entries(affiliationPools)) {
  for (const [value, weight] of Object.entries(values)) main.push(row("Affiliation", culture, "Any", value, weight));
}
const speciesPools = {
  Oriathan: { Human: 72, "Half-Elf": 8, Dwarf: 5, Halfling: 5, Gnome: 4, Elf: 3, Tiefling: 3 },
  Azmeri: { Human: 70, "Half-Elf": 10, Dwarf: 7, Halfling: 5, Gnome: 5, Elf: 3 },
  Ezomyte: { Dwarf: 75, Human: 12, "Half-Orc": 5, Gnome: 4, Halfling: 4 },
  Maraketh: { Halfling: 76, Human: 12, "Half-Elf": 5, Dwarf: 3, Gnome: 2, Tiefling: 2 },
  Karui: { "Half-Orc": 72, Orc: 18, Human: 8, Goliath: 2 },
  Vaal: { Gnome: 82, Human: 6, Tiefling: 6, Elf: 6 },
  Kalguur: { Elf: 82, "Half-Elf": 10, Human: 5, Gnome: 3 },
  Stygian: { Drow: 50, Duergar: 30, "Deep Gnome": 20 }
};
for (const [culture, values] of Object.entries(speciesPools)) {
  for (const [value, weight] of Object.entries(values)) main.push(row("Species", culture, "Any", value, weight));
}
for (const [value, weight] of Object.entries({ Native: 50, Diaspora: 14, Refugee: 18, Exile: 10, "Mixed heritage": 8 })) {
  main.push(row("SocialOrigin", "Global", "Any", value, weight));
}
for (const [value, weight] of Object.entries({ Child: 7, "Young Adult": 20, Adult: 49, Elder: 20, Ancient: 4 })) {
  main.push(row("Age", "Global", "Any", value, weight));
}
for (const [value, weight] of Object.entries({
  "Lawful Good": 8, "Neutral Good": 15, "Chaotic Good": 10,
  "Lawful Neutral": 12, "True Neutral": 22, "Chaotic Neutral": 15,
  "Lawful Evil": 6, "Neutral Evil": 7, "Chaotic Evil": 5
})) main.push(row("Alignment", "Global", "Any", value, weight));

const categoryPools = {
  Oriathan: {
    Any: { Commoner: 14, Agriculture: 8, Artist: 5, Communications: 5, Construction: 7, Craftsman: 12, Magic: 6, Medical: 6, Military: 8, Outcast: 5, Religion: 4, Scholarly: 6, Trade: 10, Transport: 4 },
    Templar: { "Templar Service": 45, Religion: 18, Military: 17, Scholarly: 10, Medical: 5, Magic: 5 },
    "The Ring": { "The Ring": 55, Criminal: 25, Trade: 10, Communications: 5, Transport: 5 }
  },
  Azmeri: { Any: { Agriculture: 16, Commoner: 13, Craftsman: 12, Construction: 8, Medical: 8, Military: 8, Outcast: 7, Scholarly: 5, Survival: 15, Trade: 5, Transport: 3 } },
  Ezomyte: { Any: { Mining: 22, Craftsman: 20, Military: 13, Construction: 12, Commoner: 10, Agriculture: 6, Medical: 5, Trade: 7, Transport: 5 } },
  Maraketh: { Any: { Trade: 21, Transport: 16, Survival: 13, Military: 11, Craftsman: 12, Agriculture: 8, Commoner: 7, Medical: 5, Magic: 4, Religion: 3 } },
  Karui: {
    Any: { Tribal: 26, Survival: 22, Military: 16, Craftsman: 13, Agriculture: 7, Medical: 6, Religion: 6, Trade: 4 },
    Hinekora: { Tribal: 32, Religion: 18, Survival: 17, Military: 14, Craftsman: 9, Medical: 6, Trade: 4 },
    Tawhoa: { Tribal: 29, Survival: 20, Craftsman: 16, Agriculture: 12, Military: 10, Medical: 7, Religion: 4, Trade: 2 }
  },
  Vaal: { Any: { Magic: 24, Scholarly: 20, "Royal Court": 17, Religion: 14, Craftsman: 10, Military: 8, Medical: 4, Commoner: 3 } },
  Kalguur: {
    Any: { Exploration: 18, Engineering: 18, Military: 15, Craftsman: 14, "Black Powder": 10, Trade: 10, Mining: 7, Medical: 5, Scholarly: 3 },
    "Kalguur Expedition": { Exploration: 23, Engineering: 20, Military: 17, "Black Powder": 14, Craftsman: 10, Trade: 7, Mining: 5, Medical: 3, Scholarly: 1 }
  },
  Stygian: {
    Any: { Mining: 25, Engineering: 17, Craftsman: 15, "Black Powder": 12, Survival: 10, Military: 8, Trade: 6, Magic: 4, Religion: 3 },
    Emberforged: { Mining: 24, Engineering: 20, Craftsman: 18, "Black Powder": 16, Military: 10, Trade: 7, Medical: 3, Scholarly: 2 },
    "Hollowed Vein": { Survival: 24, Mining: 18, Exploration: 16, Outcast: 14, Magic: 10, Religion: 8, Craftsman: 6, Medical: 4 }
  }
};
for (const [culture, affiliations] of Object.entries(categoryPools)) {
  for (const [affiliation, values] of Object.entries(affiliations)) {
    for (const [value, weight] of Object.entries(values)) main.push(row("ProfessionCategory", culture, affiliation, value, weight));
  }
}

const names = [];
const namePools = {
  Oriathan: {
    Name: "Aelia|Aemilia|Agrippa|Albinus|Anthea|Aquila|Aurelia|Cassian|Crispin|Decima|Drusus|Fausta|Flavia|Gaius|Helvia|Junia|Laelia|Livia|Lucan|Marcellus|Octavia|Quintus|Sabina|Severin|Tertia|Tullia|Valeria|Varro|Vesta|Vitus",
    Surname: "Aquilinus|Calpurnius|Cassidor|Cornelian|Domitian|Fabrian|Falconer|Flavian|Galenus|Horatian|Junian|Laelian|Marcellan|Nerian|Octavian|Praetoran|Quillian|Rufian|Sabinian|Severian|Tertian|Valerian|Varrian|Vespian|Vigilan"
  },
  Azmeri: {
    Name: "Aldren|Anwen|Brenna|Cadoc|Cerys|Deryn|Elowen|Emrys|Enid|Gareth|Gwenna|Ianto|Idris|Kellan|Lowri|Mabon|Mared|Nerys|Owain|Rhiannon|Rhodri|Seren|Tegan|Tudor|Wenna",
    Surname: "Ashdown|Blackbriar|Brambleward|Cairnwell|Dunmere|Elderfield|Ferncross|Glenward|Greyfen|Harthill|Hawthorn|Heatherby|Moorcroft|Oakrest|Redbrook|Rowanfield|Stonecross|Thornmere|Valeheart|Willowfen"
  },
  Ezomyte: {
    Name: "Ailsa|Alasdair|Arran|Beitris|Bhaltair|Blair|Catriona|Coinneach|Dòmhnall|Eilidh|Eòghan|Fergus|Finlay|Fiona|Fraser|Iona|Isla|Lachlan|Màiri|Morag|Muirenn|Niall|Rona|Seumas|Sorcha",
    Surname: "Abernethy|Cairnhewn|Craigward|Dunbrae|Farquhar|Fellhammer|Glenmuir|Granitehand|Heatherforge|Ironbrae|Kilgour|MacCrae|MacRuaridh|Morningsmith|Rannoch|Redcairn|Stonevein|Strathmore|Tarnshield|Thistlebrae"
  },
  Maraketh: {
    Name: "Adila|Arash|Azra|Bahram|Darya|Farid|Golnar|Hadi|Jahan|Kamran|Kaveh|Laleh|Mahin|Mehrdad|Nadia|Nasrin|Parisa|Ramin|Roxana|Samira|Shahin|Soraya|Tahira|Yasmin|Zahir",
    Surname: "Amberstep|Caravanborn|Dawnpath|Dunewalker|Farstrider|Goldsaddle|Moonreins|Oasisward|Redcairn|Roadwise|Saltwind|Sandlark|Silkroad|Starbridle|Sunveil|Swiftspur|Waterfinder|Windrider|Zarinfar|Zharavan"
  },
  Karui: {
    Name: "Arihi|Hauiti|Hinewai|Kaewa|Kahurangi|Karewa|Kiriata|Korihau|Mairehau|Marama|Matiu|Ngarimu|Paora|Raukiri|Rawiri|Rereahu|Rauheke|Taika|Tamaio|Tamakiri|Mauwera|Waimaru|Wiremu|Whaireka|Whareka",
    Surname: "Ancestor-Singer|Ash-Spear|Cliff-Warden|Ember-Paddle|Flax-Binder|Greenstone-Hand|Iron-Tide|Reef-Born|Red-Feather|Salt-Blood|Shell-Carver|Sky-Drummer|Storm-Prow|Tide-Walker|War-Canoe|Wave-Breaker|Whale-Rider|White-Shark|Wind-Spear|Wood-Smoke"
  },
  Vaal: {
    Name: "Aqama|Azqel|Calqet|Chimal|Eztan|Ixtara|Izqel|Mazatl|Metzli|Nahuac|Nexali|Ocelan|Qalchi|Qetza|Tecuani|Tezma|Tizoc|Xalua|Xical|Ximara|Yaret|Yoltzin|Zaqal|Zeltan|Zyanya",
    Surname: "Ashen Glyph|Blood Calendar|Coil Scribe|Fifth Sun|Glass Serpent|Jade Circuit|Moon Cipher|Obsidian Eye|Quetzal Mark|Red Ziggurat|Ritual Gear|Serpent Seal|Sun Engine|Temple Key|Veiled Axis|Void Calendar|Wheel Keeper|Xoac Line|Ziggurat Born|Zodiac Hand"
  },
  Kalguur: {
    Name: "Aelrik|Alvaine|Brynja|Caelvar|Dagnyr|Eirlys|Elvarin|Freydis|Halvyr|Hildra|Iskell|Jorunn|Kaelith|Leifran|Maelvir|Njalda|Orlenn|Ragniel|Sigrune|Solveig|Thalrik|Valdis|Veyra|Yrsael|Zevran",
    Surname: "Argentthorn|Ashenquillon|Blacklance|Brightspur|Coldspire|Frostvane|Giltbriar|Glasspike|Ironbough|Nightquillon|Palespear|Rimecrown|Shardhelm|Silverbarb|Starlance|Steelpetal|Stormquillon|Thornspire|Veylance|Winterbriar"
  },
  Stygian: {
    Name: "Akhra|Ashk|Bherik|Dhezra|Dravh|Ekhren|Ezhr|Gharra|Gheld|Ithr|Jhevik|Khaela|Kharv|Kheldra|Khesh|Lhessa|Mhevik|Nharra|Orvhen|Pharek|Pheldra|Phorin|Qhessa|Rhekk|Shavra|Skarh|Tharek|Thelra|Thren|Ulkh|Vhaela|Vhezz|Yharn|Zhevr|Zhurra|Azhrek|Bhavra|Dhessa|Ekhra|Gherv|Khadr|Khelv|Mhazra|Pherr|Rhazh|Thava|Vhekh|Zharra|Zheln|Zhorr",
    Surname: "Ashvein|Blackrune|Cinderbrand|Deepchime|Duskanvil|Embermark|Gloompick|Gravenore|Hollowecho|Ironscript|Khazvein|Nightdelve|Obsidianword|Phosphoreye|Runebound|Sableforge|Shadowseam|Slatevoice|Smokesigil|Steelhand|Sulphiteborn|Thornore|Underflame|Veinkeeper|Voidhammer|Whisperrune|Zharrmark|Ashglyph|Basaltkin|Cavescript|Coalbreath|Deepsigil|Emberveil|Forgewhisper|Greydelve|Lowchant|Runevein|Sootmantle|Stoneaccent|Underrune"
  }
};
for (const [culture, categories] of Object.entries(namePools)) {
  for (const [category, values] of Object.entries(categories)) addValues(names, category, culture, "Any", split(values));
}

const descriptors = [];
const descriptorPools = {
  Appearance: "Acne-scarred|Athletic|Battered travel cloak|Beautiful|Blind in one eye|Broad-shouldered|Broken nose|Burn-scarred|Calloused hands|Carefully braided hair|Ceremonial tattoos|Close-cropped hair|Crooked smile|Frail|Freckled|Grime-streaked|Heavy-set|Immaculately groomed|Ink-stained fingers|Lean and corded|Missing finger|Narrow-shouldered|Old blade scars|Patchwork armour|Pierced ears|Powerfully built|Ritual scarification|Shaven-headed|Soot-blackened|Stooped|Sun-darkened|Towering|Very short|Waist-length hair|Weathered by decades|Youthful face",
  Demeanor: "Alert|Boisterous|Careful|Cheerful|Cold and distant|Disciplined|Dryly humorous|Earnest|Guarded|Impatient|Melancholy|Mercurial|Openly trusting|Patient|Proud|Restless|Sardonic|Solemn|Suspicious|Unhurried|Warm and welcoming|Weary but resolute",
  Attitude: "Always bargaining|Assumes authority|Avoids eye contact|Challenges every claim|Eager to help|Expects betrayal|Fascinated by outsiders|Fiercely hospitable|Keeps emotional distance|Looks for an escape|Protective of the vulnerable|Quick to forgive|Quick to take offence|Respectful of custom|Studies everyone carefully|Treats danger as routine|Trust must be earned|Values practical results",
  Voice: "Breathy voice|Booming voice|Careful formal diction|Clipped cadence|Gravelly voice|High musical voice|Low resonant voice|Measured voice|Rapid speech|Rasping voice|Rough provincial accent|Soft-spoken|Whisper-soft voice",
  Mannerism: "Counts exits on entering a room|Drums fingers in coded rhythms|Folds arms when challenged|Keeps one hand near a weapon|Laughs at the wrong moment|Murmurs an old prayer|Never sits with a door behind them|Polishes a keepsake while thinking|Repeats the last word of a question|Rolls a coin across the knuckles|Sketches symbols in dust|Speaks in short decisive phrases|Touches a scar before answering|Watches hands instead of faces"
};
for (const [category, values] of Object.entries(descriptorPools)) addValues(descriptors, category, "Any", "Any", split(values));
addValues(descriptors, "Voice", "Stygian", "Any", split("Clipped low Azmeri with hardened consonants|Shortened vowels and a low pitch|Rune-reader's measured underground cadence|A gravelly accent that turns t to th|A terse accent that turns k to kh|A soft accent that turns p to ph|Resonant speech shaped by stone chambers|Whispered Azmeri with sharply stressed consonants"), 2);

const professions = [];
const addJobs = (category, values, parent = "Any", subParent = "Any") => addValues(professions, category, parent, subParent, split(values));
addJobs("Agriculture", "Apiarist|Goatherd|Grain farmer|Herbal grower|Orchard keeper|Reed cutter|Vintner|Water tender");
addJobs("Artist", "Bone carver|Chronicler|Dyer|Mosaic maker|Muralist|Poet|Street musician|Woodblock printer");
addJobs("Communications", "Bell keeper|Cipher clerk|Courier|Herald|Interpreter|Message runner|Scribe|Signal-tower watcher");
addJobs("Construction", "Bricklayer|Carpenter|Fortification mason|Roofer|Scaffolder|Stonecutter|Surveyor|Well digger");
addJobs("Craftsman", "Armourer|Bowyer|Brewer|Cooper|Glassworker|Jeweller|Leatherworker|Potter|Tailor|Weaponsmith");
addJobs("Criminal", "Burglar|Counterfeiter|Fence|Grave robber|Highway raider|Pickpocket|Smuggler|Thief-taker gone rogue");
addJobs("Commoner", "Bath attendant|Cook|Dock labourer|House servant|Lamplighter|Laundry worker|Market porter|Rat catcher|Street vendor|Tavern keeper");
addJobs("Magic", "Apothecary thaumaturge|Gem appraiser|Hedge mage|Relic examiner|Ritual assistant|Warding specialist");
addJobs("Medical", "Apothecary|Battlefield chirurgeon|Bone setter|Herbalist|Midwife|Plague tender|Surgeon's assistant");
addJobs("Military", "Armoury keeper|Camp quartermaster|City watch officer|Field scout|Fortress guard|Legion veteran|Militia captain|Sapper");
addJobs("Outcast", "Beachcomber|Beggar|Hermit|Prison escapee|Relic scavenger|Ruined noble|Wandering exile|Wasteland guide");
addJobs("Religion", "Bell priest|Confessor|Grave tender|Lay preacher|Relic custodian|Shrine keeper|Temple cantor");
addJobs("Scholarly", "Archivist|Cartographer|Historian|Language scholar|Legal clerk|Natural philosopher|Tutor");
addJobs("Trade", "Auction broker|Cloth merchant|Gem dealer|Market factor|Provisioner|Salt trader|Scrap dealer|Wine merchant");
addJobs("Transport", "Barge pilot|Caravan drover|Cartwright|Dockmaster|Ferry keeper|Pack-animal handler|Sailor");
addJobs("Survival", "Forager|Game hunter|Monster tracker|Pathfinder|Ruin scout|Trapper|Wilderness cook");
addJobs("Exploration", "Cave mapper|Expedition outrider|Relic surveyor|Ruin delver|Trail finder|Vanguard scout");
addJobs("Engineering", "Bridgewright|Hoist engineer|Mechanism fitter|Pump keeper|Siege engineer|Ventilation keeper");
addJobs("Mining", "Azurite cutter|Blaster's mate|Mine foreman|Ore grader|Pick miner|Prospector|Shaft shorer|Tunnel surveyor");
addJobs("Black Powder", "Powder measurer|Shot caster|Sulphite-powder maker|Fuse braider|Blast-hole setter|Powder quartermaster");
addJobs("Youth", "Apprentice craftworker|Family helper|Market errand runner|Mine sorter|Shrine helper|Stable hand|Street scavenger");
addJobs("Tribal", "Ancestor singer|Canoe builder|Hunt leader|Ritual tattooist|Spirit caller|Tribal envoy|Warband scout|Weapon carver", "Karui", "Any");
addJobs("Royal Court", "Astronomer-priest|Calendar keeper|Court artificer|Glyph accountant|Palace guard|Royal diviner|Temple engineer", "Vaal", "Any");
addJobs("Templar Service", "Field chaplain|Inquisitorial aide|Legionary|Temple physician|Thaumaturgical researcher|Virtue instructor", "Oriathan", "Templar");
for (const [value, weight] of Object.entries({
  "Ebony Legion (Primis, elite)": 15,
  "Crimson Legion (Secundo, veteran)": 20,
  "Azure Legion (Tertius, first Sarn legion)": 12,
  "Azure Legion (Tertius, second Sarn legion)": 12,
  "Emerald Legion (Quartus, recruit and volunteer)": 26,
  Archivists: 15
})) professions.push(row("Templar Branch", "Oriathan", "Templar", value, weight));
addJobs("The Ring", "Arena bookmaker|Bribe courier|Debt collector|Enforcer|Fence|Information broker|Pit-fight fixer|Safehouse keeper|Smuggler|Street runner", "Oriathan", "The Ring");
addJobs("Mining", "Azurite seam-reader|Deep-shaft shorer|Rune-face surveyor|Sulphite prospector|Vein singer|Ventilation cutter", "Stygian", "Any");
addJobs("Engineering", "Azurite pumpwright|Deep-hoist keeper|Rune-mechanism fitter|Stone-pressure engineer|Tunnel bracewright", "Stygian", "Any");
addJobs("Black Powder", "Sulphite powderwright|Blast-rune cutter|Fuse-knotter|Powder cask keeper|Shot tester|Trade powder measurer", "Stygian", "Any");
addJobs("Craftsman", "Angular armour smith|Azurite lens grinder|Rune chisel maker|Deep-lantern maker|Basalt mason", "Stygian", "Any");
addJobs("Trade", "Kalguur powder factor|Azurite broker|Deep-market interpreter|Sulphite contract keeper", "Stygian", "Emberforged");
addJobs("Exploration", "Lost-gallery mapper|Hollowed pathfinder|Collapsed-shaft delver|Surface route seeker", "Stygian", "Hollowed Vein");
addJobs("Black Powder", "Stygian liaison|Sulphite-powder quartermaster|Field bombard engineer|Powder proof-master", "Kalguur", "Kalguur Expedition");
addJobs("Engineering", "Expedition bridgewright|Spiked bulwark engineer|Powder-lock designer|Mobile forge keeper", "Kalguur", "Kalguur Expedition");

const hooks = [];
const addHooks = (category, parent, subParent, values, weight = 1) => addValues(hooks, category, parent, subParent, split(values), weight);
addHooks("Ideal", "Any", "Any", "I will rebuild what the Cataclysm destroyed.|No one survives alone.|Knowledge is a weapon against the nightmare.|The vulnerable deserve protection.|A promise matters most when keeping it hurts.|Freedom is worth every hardship.|Practical mercy saves more lives than pride.|The dead deserve to be remembered.");
addHooks("Bond", "Any", "Any", "I carry the last token of my household.|A travelling companion once saved my life.|I owe a dangerous debt for safe passage.|I guard a map to a refuge no one else knows.|My missing sibling may still be alive.|I will restore a ruined shrine or home.|A community depends on the supplies I bring.|I promised to return an heirloom to its owner.");
addHooks("Flaw", "Any", "Any", "I hoard supplies long after danger has passed.|I mistake suspicion for wisdom.|I cannot leave forbidden relics untouched.|I answer insults with reckless escalation.|I conceal an illness or wound.|I abandon plans when omens turn against me.|I trust status more than character.|I would betray a stranger to protect my own.");

addHooks("Ideal", "Oriathan", "Templar", "Order must outlive the empire.|The Virtues must be defended from corruption.|Discipline is the first defence against nightmare.|Service can redeem the sins of Oriath.|The law must bind commanders as well as recruits.");
addHooks("Bond", "Oriathan", "Templar", "My legion is the only family I have left.|I protect an Archivist carrying dangerous records.|A fallen superior entrusted me with a sealed order.|I owe my life to an Emerald volunteer from the lower strata.|I must discover who corrupted my command.");
addHooks("Flaw", "Oriathan", "Templar", "I obey rank even when conscience objects.|I see dissent as the first sign of heresy.|I hide how frightened I am of thaumaturgy.|I judge non-Oriathans by imperial custom.|I falsified a report to protect my unit.");
addHooks("Ideal", "Oriathan", "The Ring", "Every bargain has a price and I name it.|The Ring protects those the empire discards.|Information is safer than steel.|I will never be owned by church or crown.|Profit means nothing without loyalty.");
addHooks("Bond", "Oriathan", "The Ring", "My Arena crew expects my cut by dawn.|A broker in Sarn holds proof of my innocence.|I run messages for the handler who kept me alive.|The Ring shelters my family.|I know which official takes which bribe.");
addHooks("Flaw", "Oriathan", "The Ring", "I treat every kindness as leverage.|I gamble with money that is not mine.|I keep a second ledger for blackmail.|I cannot resist humiliating a rival.|I sell secrets before weighing the cost.");

addHooks("Ideal", "Karui", "Hinekora", "The past speaks through every choice we make.|A true warning must be heard even when unwelcome.|The tribe survives by respecting ancestors and consequence.|Courage means facing the future without denying it.");
addHooks("Bond", "Karui", "Hinekora", "I carry a warning meant for my chieftain.|My tattoo records a debt to the Hinekora tribe.|An ancestor's unfinished task has become mine.|I protect the keeper of our tribe's remembered deaths.");
addHooks("Flaw", "Karui", "Hinekora", "I read fate into every accident.|I confuse ancestral custom with infallible law.|I withhold warnings until people prove worthy.|I would sacrifice the present to settle an old debt.");
addHooks("Ideal", "Karui", "Tawhoa", "Life flourishes when strength protects growth.|Land and people must be tended together.|Craft and patience are forms of courage.|What we take from the world must be returned.");
addHooks("Bond", "Karui", "Tawhoa", "I guard seeds from a homeland grove.|My canoe crew is my chosen family.|I must restore a place poisoned by thaumaturgy.|A Tawhoa elder taught me the craft that feeds my tribe.");
addHooks("Flaw", "Karui", "Tawhoa", "I refuse to abandon anything I have nurtured.|I distrust metalwork made outside the tribe.|I mistake patience for permission to delay.|I take every damaged living thing into my care.");

addHooks("Ideal", "Kalguur", "Kalguur Expedition", "Discovery justifies hardship but never waste.|A sound fortification saves more lives than heroics.|Trade is strongest when both sides keep their word.|Innovation must be proved before it is praised.|The expedition succeeds or all of us fail.");
addHooks("Bond", "Kalguur", "Kalguur Expedition", "My crew depends on the design in my fieldbook.|A Stygian powderwright trusted me with a guarded technique.|I must return a fallen explorer's blade to their kin.|I guard the expedition's remaining sulphite powder.|A rival expedition stole my survey marks.");
addHooks("Flaw", "Kalguur", "Kalguur Expedition", "I treat people like parts in a machine.|I test dangerous designs before they are ready.|I underestimate customs I cannot measure.|I would risk a crew to preserve my reputation.|I keep too much powder too close at hand.");

addHooks("Ideal", "Stygian", "Any", "A spoken promise should be cut as deeply as a rune.|The mines remember what surface folk forget.|Useful craft is the surest proof of worth.|Our people must choose how the surface learns of us.|No secret is worth another cave-in.");
addHooks("Bond", "Stygian", "Any", "I carry a rune tablet naming a sealed gallery.|A Kalguur trader once honoured an impossible bargain.|My family maintains a ventilation shaft that saves hundreds.|I seek a missing translation of an Azmeri oath.|My clan's forge mark was stolen by a surface merchant.");
addHooks("Flaw", "Stygian", "Any", "I assume surface speech always hides an insult.|I would rather lose a bargain than explain our customs.|I keep dangerous ore because its runes intrigue me.|I speak too softly to warn others in time.|I measure every relationship as a debt.");
addHooks("Ideal", "Stygian", "Emberforged", "The forge turns isolation into strength.|Sulphite powder belongs only in disciplined hands.|Trade with Kalguur proves trust can be engineered.|Oris's compact must outlast any single leader.|A craft shared carelessly is a weapon surrendered.");
addHooks("Bond", "Stygian", "Emberforged", "My forge crew bears one mark between us.|I must deliver a powder ledger to a Kalguur factor.|A Steelhand decree saved my clan's claim.|I guard the original rune for a sulphite mixture.|My apprentice vanished with a trade caravan.");
addHooks("Flaw", "Stygian", "Emberforged", "I test loyalty with needless secrecy.|I value a perfect tool above the worker using it.|I cannot forgive anyone who wastes sulphite.|I conceal a flaw in an important powder batch.|I treat the Hollowed Vein as a caution rather than people.");
addHooks("Ideal", "Stygian", "Hollowed Vein", "What was lost below must not be erased above.|Survival is proof enough when history calls you broken.|No faction owns the truth of our disappearance.|The abandoned deserve guides, not judgement.|A hidden path is freedom.");
addHooks("Bond", "Stygian", "Hollowed Vein", "I have a map drawn by the last returning scout.|A voice in a sealed gallery knows my childhood name.|I search for the descendants of my lost delve-team.|I carry the broken rune of our final assembly.|An Emberforged miner secretly supplies my people.");
addHooks("Flaw", "Stygian", "Hollowed Vein", "I vanish rather than explain myself.|I hear instructions in ordinary cave sounds.|I sabotage marked routes to keep them secret.|I reject help that carries Emberforged authority.|I would reopen a cursed gallery for proof.");

const presets = {
  schemaVersion: 1,
  presets: [
    { id: "general", label: "All Wraeclast", description: "A broad present-day Wraeclast mix; ancient Vaal are excluded unless selected.", cultures: { Oriathan: 29, Azmeri: 15, Ezomyte: 13, Maraketh: 12, Karui: 13, Kalguur: 10, Stygian: 8 } },
    { id: "sarn_survivor", label: "Sarn survivor", description: "Civilians, refugees, opportunists, and occupiers around ruined Sarn.", cultures: { Oriathan: 48, Azmeri: 17, Ezomyte: 10, Maraketh: 8, Karui: 7, Kalguur: 5, Stygian: 5 }, socialOrigins: { Refugee: 40, Native: 25, Exile: 20, Diaspora: 10, "Mixed heritage": 5 } },
    { id: "oriathan_occupier", label: "Oriathan occupier", description: "Imperial, Templar, and Ring presence in and around Sarn.", cultures: { Oriathan: 100 }, affiliations: { Oriathan: { Templar: 60, "The Ring": 15, Unaffiliated: 25 } } },
    { id: "forest_encampment", label: "Forest Encampment", description: "Azmeri locals, Ezomyte neighbours, exiles, and travellers.", cultures: { Azmeri: 47, Ezomyte: 22, Oriathan: 10, Maraketh: 7, Karui: 6, Kalguur: 4, Stygian: 4 }, socialOrigins: { Native: 48, Refugee: 22, Exile: 18, Diaspora: 8, "Mixed heritage": 4 } },
    { id: "karui_tribe", label: "Karui tribes", description: "Members of the Hinekora and Tawhoa tribes, plus unaffiliated Karui.", cultures: { Karui: 100 }, affiliations: { Karui: { Hinekora: 44, Tawhoa: 44, Unaffiliated: 12 } } },
    { id: "kalguur_expedition", label: "Kalguur expedition", description: "High-elven explorers, engineers, soldiers, and powder specialists.", cultures: { Kalguur: 100 }, affiliations: { Kalguur: { "Kalguur Expedition": 90, Unaffiliated: 10 } } },
    { id: "stygian_mines", label: "Stygian mines", description: "Drow, duergar, and deep gnomes of the Azurite Mines.", cultures: { Stygian: 100 }, affiliations: { Stygian: { Emberforged: 65, "Hollowed Vein": 20, Unaffiliated: 15 } }, socialOrigins: { Native: 65, Diaspora: 10, Refugee: 15, Exile: 7, "Mixed heritage": 3 } },
    { id: "vaal_historical", label: "Ancient Vaal", description: "A historical Vaal gnome from before the civilisation's fall.", cultures: { Vaal: 100 }, affiliations: { Vaal: { Unaffiliated: 100 } }, socialOrigins: { Native: 90, Diaspora: 5, Exile: 5 } }
  ]
};

await Promise.all([
  writeFile(path.join(dataDir, "main_tables.csv"), csv(main), "utf8"),
  writeFile(path.join(dataDir, "names.csv"), csv(names), "utf8"),
  writeFile(path.join(dataDir, "descriptors.csv"), csv(descriptors), "utf8"),
  writeFile(path.join(dataDir, "professions.csv"), csv(professions), "utf8"),
  writeFile(path.join(dataDir, "hooks.csv"), csv(hooks), "utf8"),
  writeFile(path.join(dataDir, "presets.json"), `${JSON.stringify(presets, null, 2)}\n`, "utf8")
]);

console.log(`Wrote ${main.length} main rows, ${names.length} names, ${descriptors.length} descriptors, ${professions.length} professions, and ${hooks.length} hooks.`);

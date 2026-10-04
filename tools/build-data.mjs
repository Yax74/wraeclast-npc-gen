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
const csv = (rows, fields = ["Category", "Parent", "SubParent", "Value", "Weight"]) => {
  const keys = fields.map((field) => field[0].toLowerCase() + field.slice(1));
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return `${fields.join(",")}\n${rows.map((item) => keys.map((key) => item[key]).map(escape).join(",")).join("\n")}\n`;
};

const main = [];
for (const [value, weight] of Object.entries({ Oriathan: 28, Azmeri: 14, Ezomyte: 12, Maraketh: 11, Karui: 12, Vaal: 5, Kalguur: 10, Stygian: 8 })) {
  main.push(row("Culture", "Global", "None", value, weight));
}
const affiliationPools = {
  Oriathan: { Unaffiliated: 40, Templar: 27, "Oriath Militia": 18, "The Ring": 15 },
  Azmeri: { Unaffiliated: 100 },
  Ezomyte: { Unaffiliated: 100 },
  Maraketh: { Unaffiliated: 100 },
  Karui: { Karui: 100 },
  Vaal: { Unaffiliated: 100 },
  Kalguur: { "Kalguur Expedition": 70, Unaffiliated: 30 },
  Stygian: { Stygian: 100 }
};
for (const [culture, values] of Object.entries(affiliationPools)) {
  for (const [value, weight] of Object.entries(values)) main.push(row("Affiliation", culture, "Any", value, weight));
}
// Names and relationships follow the campaign Notion databases. Weights tune generator variety;
// they are not claims about exact population totals.
const branchPools = {
  Karui: {
    affiliation: "Karui",
    values: {
      Tukohama: 12, Ngamahu: 11, Valako: 9, Tasalio: 8, Ramako: 9, Rongokurai: 6,
      Arohongui: 4, Tawhoa: 10, Kitava: 2, Hinekora: 10, Sione: 4, "Lani Lua": 5,
      Unaffiliated: 10
    }
  },
  Stygian: {
    affiliation: "Stygian",
    values: {
      Deepwardens: 25, "Sulphite Syndicate": 22, Shadowborn: 13,
      Emberforged: 18, "Hollowed Vein": 10, Unaffiliated: 12
    }
  }
};
for (const [culture, { affiliation, values }] of Object.entries(branchPools)) {
  for (const [value, weight] of Object.entries(values)) main.push(row("Branch", culture, affiliation, value, weight));
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
for (const [value, weight] of Object.entries({
  Native: 30, Diaspora: 9, Refugee: 13, Exile: 8, "Mixed heritage": 6,
  Settler: 6, Nomad: 5, "Urban poor": 7, "Merchant household": 5,
  "Military household": 4, "Religious household": 3, "Freed captive": 2,
  "Displaced survivor": 6
})) {
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
for (const value of [
  "Lioneye's Watch", "Forest Encampment", "Sarn Slums", "Sarn Arena", "Sarn Upper City",
  "Sarn Docks", "Theopolis", "Oriath port town", "Karui Archipelago", "Highgate and the Vastiri",
  "Kalguur expedition camp", "Azurite Mines", "Ancient Vaal city", "Wraeclast road or wilderness"
]) main.push(row("Location", "Global", "Any", value, 1));
for (const value of ["1599 IC", "Eternal Empire", "Ancient Vaal"]) {
  main.push(row("Era", "Global", "Any", value, 1));
}
for (const value of ["Civilian", "Skilled", "Trained", "Veteran", "Elite"]) {
  main.push(row("CapabilityTier", "Global", "Any", value, 1));
}

const categoryPools = {
  Oriathan: {
    Any: { Commoner: 14, Agriculture: 8, Artist: 5, Communications: 5, Construction: 7, Craftsman: 12, Magic: 6, Medical: 6, Military: 8, Outcast: 5, Religion: 4, Scholarly: 6, Trade: 10, Transport: 4 },
    Templar: { "Templar Service": 45, Religion: 18, Military: 17, Scholarly: 10, Medical: 5, Magic: 5 },
    "Oriath Militia": { "Militia Service": 58, Military: 14, Communications: 8, Medical: 5, Criminal: 5, Commoner: 5, Transport: 5 },
    "The Ring": { "The Ring": 55, Criminal: 25, Trade: 10, Communications: 5, Transport: 5 }
  },
  Azmeri: { Any: { Agriculture: 16, Commoner: 13, Craftsman: 12, Construction: 8, Medical: 8, Military: 8, Outcast: 7, Scholarly: 5, Survival: 15, Trade: 5, Transport: 3 } },
  Ezomyte: { Any: { Mining: 22, Craftsman: 20, Military: 13, Construction: 12, Commoner: 10, Agriculture: 6, Medical: 5, Trade: 7, Transport: 5 } },
  Maraketh: { Any: { Trade: 21, Transport: 16, Survival: 13, Military: 11, Craftsman: 12, Agriculture: 8, Commoner: 7, Medical: 5, Magic: 4, Religion: 3 } },
  Karui: {
    Any: { Tribal: 26, Survival: 22, Military: 16, Craftsman: 13, Agriculture: 7, Medical: 6, Religion: 6, Trade: 4 },
    Tukohama: { Military: 30, Tribal: 24, Survival: 14, Craftsman: 10, Religion: 10, Medical: 5, Agriculture: 4, Trade: 3 },
    Ngamahu: { Craftsman: 30, Tribal: 20, Mining: 14, Military: 10, Religion: 10, Engineering: 6, Trade: 6, Survival: 4 },
    Valako: { Agriculture: 22, Military: 20, Transport: 16, Tribal: 14, Survival: 10, Religion: 8, Craftsman: 6, Trade: 4 },
    Tasalio: { Transport: 24, Survival: 18, Tribal: 17, Military: 14, Religion: 10, Medical: 7, Craftsman: 6, Trade: 4 },
    Ramako: { Scholarly: 20, Agriculture: 18, Military: 16, Communications: 14, Tribal: 12, Religion: 8, Craftsman: 7, Trade: 5 },
    Rongokurai: { Military: 24, Communications: 18, Tribal: 16, Survival: 14, Religion: 12, Medical: 8, Scholarly: 5, Craftsman: 3 },
    Arohongui: { Transport: 24, Magic: 19, Tribal: 17, Religion: 14, Survival: 10, Scholarly: 8, Craftsman: 5, Medical: 3 },
    Hinekora: { Tribal: 32, Religion: 18, Survival: 17, Military: 14, Craftsman: 9, Medical: 6, Trade: 4 },
    Tawhoa: { Tribal: 29, Survival: 20, Craftsman: 16, Agriculture: 12, Military: 10, Medical: 7, Religion: 4, Trade: 2 },
    Kitava: { Outcast: 26, Criminal: 18, Survival: 16, Tribal: 14, Military: 10, Religion: 8, Trade: 5, Commoner: 3 },
    Sione: { Religion: 22, Magic: 20, Tribal: 18, Agriculture: 12, Medical: 10, Military: 8, Craftsman: 6, Scholarly: 4 },
    "Lani Lua": { Magic: 24, Religion: 20, Tribal: 17, Scholarly: 13, Medical: 9, Survival: 8, Craftsman: 5, Communications: 4 }
  },
  Vaal: { Any: { Magic: 24, Scholarly: 20, "Royal Court": 17, Religion: 14, Craftsman: 10, Military: 8, Medical: 4, Commoner: 3 } },
  Kalguur: {
    Any: { Exploration: 18, Engineering: 18, Military: 15, Craftsman: 14, "Black Powder": 10, Trade: 10, Mining: 7, Medical: 5, Scholarly: 3 },
    "Kalguur Expedition": { Exploration: 23, Engineering: 20, Military: 17, "Black Powder": 14, Craftsman: 10, Trade: 7, Mining: 5, Medical: 3, Scholarly: 1 }
  },
  Stygian: {
    Any: { Mining: 25, Engineering: 17, Craftsman: 15, "Black Powder": 12, Survival: 10, Military: 8, Trade: 6, Magic: 4, Religion: 3 },
    Deepwardens: { Construction: 25, Engineering: 22, Military: 17, Mining: 14, Craftsman: 9, Survival: 7, Medical: 4, Scholarly: 2 },
    "Sulphite Syndicate": { "Black Powder": 26, Engineering: 22, Mining: 17, Craftsman: 13, Scholarly: 8, Trade: 7, Medical: 4, Military: 3 },
    Shadowborn: { Scholarly: 24, Exploration: 22, Magic: 18, Military: 12, Survival: 9, Religion: 7, Mining: 5, Outcast: 3 },
    Emberforged: { Trade: 18, Exploration: 17, "Black Powder": 15, Engineering: 13, Communications: 12, Craftsman: 10, Survival: 8, Transport: 4, Military: 3 },
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
    Name: "Aelia|Aemilia|Agrippa|Albinus|Anthea|Aquila|Aurelia|Cassian|Crispin|Decima|Drusus|Fausta|Flavia|Gaius|Helvia|Junia|Laelia|Livia|Livius|Marcellus|Livilla|Quintus|Sabina|Severin|Tertia|Tullia|Valeria|Varro|Vesta|Vitus",
    Surname: "Aquilinus|Calpurnius|Cassidor|Cornelian|Domitian|Fabrian|Falconer|Flavian|Galenus|Horatian|Junian|Laelian|Marcellan|Nerian|Octavian|Praetoran|Quillian|Rufian|Sabinian|Severian|Tertian|Valerian|Varrian|Vespian|Vigilan"
  },
  Azmeri: {
    Name: "Aldren|Anwen|Briallen|Cadoc|Cerys|Deryn|Elowen|Emrys|Enid|Gareth|Gwenna|Ianto|Idris|Kellan|Lowri|Mabon|Mared|Nerys|Owain|Rhiannon|Rhodri|Seren|Tegan|Tudor|Wenna",
    Surname: "Ashdown|Blackbriar|Brambleward|Cairnwell|Dunmere|Elderfield|Ferncross|Glenward|Greyfen|Harthill|Hawthorn|Heatherby|Moorcroft|Oakrest|Redbrook|Rowanfield|Stonecross|Thornmere|Valeheart|Willowfen"
  },
  Ezomyte: {
    Name: "Ailsa|Alasdair|Arran|Beitris|Bhaltair|Blair|Catriona|Coinneach|Dòmhnall|Eilidh|Eòghan|Fergus|Finlay|Fiona|Fraser|Iona|Isla|Lachlan|Màiri|Morag|Muirenn|Niall|Rona|Seumas|Sorcha",
    Surname: "Abernethy|Cairnhewn|Craigward|Dunbrae|Farquhar|Fellhammer|Glenmuir|Granitehand|Heatherforge|Ironbrae|Kilgour|MacCrae|MacRuaridh|Morningsmith|Rannoch|Redcairn|Stonevein|Strathmore|Tarnshield|Thistlebrae"
  },
  Maraketh: {
    Name: "Adila|Arash|Azra|Bahram|Darya|Farid|Golnar|Hadi|Jahan|Kamran|Kaveh|Laleh|Mahin|Mehrdad|Nadia|Nasrin|Parisa|Ramin|Roxana|Samira|Shahin|Soraya|Tahira|Yasmin|Zahir",
    Surname: "Al-Sahir|Ashari|Badiya|Daryan|Farouqi|Haddari|Jaziri|Kharif|Marwani|Nadiri|Qasimi|Rahmani|Safiri|Shafran|Tazir|Vardani|Yazdan|Zahiri|Zareen|Zayani"
  },
  Karui: {
    Name: "Arihi|Hauiti|Hinewai|Kaewa|Kahurangi|Karewa|Kiriata|Korihau|Mairehau|Marama|Matiu|Ngarimu|Paora|Raukiri|Rawiri|Rereahu|Rauheke|Taika|Tamaio|Tamakiri|Mauwera|Waimaru|Wiremu|Whaireka|Whareka",
    Surname: "Arahura|Hauwhenua|Kahumaru|Kaitoa|Kerewai|Koromiko|Mahuta|Manutahi|Mataora|Ngahere|Ngataha|Pounamu|Raukura|Rerewaka|Taharoa|Takiri|Tamure|Te Awa|Te Kahu|Whaitiri"
  },
  Vaal: {
    Name: "Aqama|Azqel|Calqet|Chimal|Eztan|Ixtara|Izqel|Mazatl|Metzli|Nahuac|Nexali|Ocelan|Qalchi|Qetza|Tecuani|Tezma|Tizoc|Xalua|Xical|Ximara|Yaret|Yoltzin|Zaqal|Zeltan|Zyanya",
    Surname: "Acatl|Acolmec|Chalca|Cihuatl|Cozcatl|Cuauhtli|Ehecatl|Itzcali|Mazahua|Mictlan|Mixcoatl|Nahuatl|Ocelotl|Quetzal|Tenochtli|Teotl|Tlalocan|Xochiya|Yaotzin|Yohualli"
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

const expandedNamePools = {
  Oriathan: {
    Name: "Appia|Arrius|Caelia|Caeso|Calista|Camilla|Cotta|Claudia|Corvin|Domitia|Fabia|Felix|Gallus|Honoria|Horatia|Justina|Licinia|Lucilla|Magnus|Marcia|Nerva|Otho|Petronia|Prisca|Rufus|Sergia|Silvanus|Tacita|Titus|Vibia",
    Surname: "Aurelian|Caelian|Catonian|Claudian|Corvian|Decian|Fulvian|Gallian|Helvian|Licinian|Lucillian|Marcian|Petronian|Priscian|Sergian|Silvanian|Tacitian|Vitellian|Volusian|Cassianus"
  },
  Azmeri: {
    Name: "Aderyn|Aeron|Aled|Aneira|Arwel|Beca|Bedwyr|Branwen|Bryn|Cai|Caradog|Catrin|Dafydd|Delwyn|Efa|Eleri|Emyr|Ffion|Geraint|Gethin|Gwilym|Heledd|Iestyn|Llyr|Mair|Meirion|Myrddin|Nesta|Osian|Peredur|Rhian|Sioned|Taliesin|Trefor|Ynyr",
    Surname: "Abervale|Ashgrove|Birchmere|Brynward|Cairnbridge|Cwmfen|Duskmoor|Elderbrook|Fallowmere|Fernhollow|Gorsehill|Greenbarrow|Mistvale|Mossward|Ravencrag|Reedmere|Stonewillow|Tanglewood|Wildmere|Wrenford"
  },
  Ezomyte: {
    Name: "Ailis|Aodh|Aonghas|Brìghde|Cailean|Cairbre|Deirdre|Donnchadh|Ealasaid|Eachann|Effie|Euna|Fionnlagh|Gilleasbuig|Greer|Hamish|Iain|Kenna|Kirsteen|Lileas|Mael|Marsaili|Mhairi|Moira|Murdo|Neacal|Oighrig|Pàdraig|Ruaridh|Sìle|Sorley|Tavish|Torcall|Una|Uisdean",
    Surname: "Balnain|Benbrae|Blackcairn|Cairnloch|Dalrune|Drumhewn|Firthhammer|Glenfallow|Greysporran|Highcrag|Inverstone|Keldbrae|Lochward|Moorhammer|Northcairn|Ochilforge|Peatfire|Rowanbrae|Skyeanvil|Torrvein"
  },
  Maraketh: {
    Name: "Afsaneh|Amira|Anahita|Arman|Banu|Behzad|Delara|Esmail|Faran|Farzana|Firuz|Hamid|Homa|Jaleh|Jamshid|Kian|Leila|Mahan|Marjan|Mina|Navid|Niloofar|Nima|Omid|Parvin|Payam|Rashid|Roya|Sahar|Sepideh|Shirin|Sohrab|Sorush|Taraneh|Zubin",
    Surname: "Al-Hadir|Bahari|Darvazi|Emiri|Ghazali|Hakimi|Isfari|Khamsin|Mazari|Nahrin|Qadiri|Rihani|Sabiri|Tabari|Vaziri|Yashar|Zaffari|Zarandi|Zarrin|Zulfi"
  },
  Karui: {
    Name: "Anahera|Ariki|Aroha|Atarangi|Awhina|Eruera|Hana|Hemi|Hinerangi|Hirini|Hoani|Ihaia|Kahu|Kaia|Kereama|Kiri|Manaia|Manawa|Maru|Miriama|Nikora|Pania|Parekura|Rangi|Ripeka|Rongo|Ropata|Rua|Teina|Tiare|Tipene|Tui|Whaitua|Whetu|Wikitoria",
    Surname: "Awarua|Hautapu|Hinerau|Kaipara|Kōwhai|Makiri|Maruata|Moturua|Ngakoro|Pukara|Rangitahi|Rerewai|Taiaroa|Tamarau|Te Kohu|Te Miro|Te Rangi|Tuhoro|Wairua|Whakaroa"
  },
  Vaal: {
    Name: "Acatzin|Acolmiz|Ameyal|Chalchi|Citlali|Citlalin|Cozamal|Cualli|Eloxoch|Icnoyotl|Izel|Malinal|Matlal|Miztli|Necalli|Nelli|Nenetl|Ohtli|Ocelotl|Quiauh|Tenoch|Tepin|Teyac|Tlalli|Tlanextli|Xihuitl|Xipilli|Xochitl|Yaotl|Yohualli|Yolotli|Zolin|Amoxtli|Ceyac|Itzamar",
    Surname: "Amoxli|Atlahua|Cenzon|Chalchiu|Citlal|Coatec|Huemac|Icnoya|Itzama|Matlali|Necahua|Ohtlan|Tecpatl|Teyolia|Tlacotl|Xihua|Xilotl|Yolcatl|Zacatl|Zolin"
  },
  Kalguur: {
    Name: "Aedrin|Aelwyn|Alfhild|Astrid|Baldren|Branniel|Brynjar|Caelwyn|Dagrin|Eirik|Eydis|Fenrik|Fjorra|Galdor|Gudrun|Haldis|Hroald|Ingrith|Jarlon|Kelvar|Livra|Maerith|Nyrvald|Odrin|Ragnhild|Runa|Sifrael|Skaldi|Thora|Torvald|Ulfren|Vaelrun|Vigdis|Ylva|Yrven",
    Surname: "Ashenspire|Blackquillon|Bronzethorn|Coldlance|Frostquillon|Galespike|Gildedthorn|Icebriar|Ironpetal|Moonspear|Palequillon|Rimebarb|Silverquillon|Skysteel|Snowlance|Starquillon|Stormbriar|Thornlance|Whitebarb|Winterspike"
  },
  Stygian: {
    Name: "Akhessia|Aurekh|Casshra|Dhecima|Fhaustr|Ghaius|Helvhra|Iunekh|Khlavdia|Livhra|Lukhan|Marzellus|Nerhva|Okhthar|Phetronia|Prhiska|Rufhar|Sevherin|Thullia|Vharro",
    Surname: "Akhvilin|Khalphurn|Khassidor|Khornelian|Domithian|Fhabrian|Fhlavian|Ghalenus|Horathian|Iunian|Laelian|Marzellan|Nherian|Okhthavian|Vhalerian"
  }
};
for (const [culture, categories] of Object.entries(expandedNamePools)) {
  for (const [category, values] of Object.entries(categories)) addValues(names, category, culture, "Any", split(values));
}
addValues(names, "OrdainedName", "Oriathan", "Templar", split(
  "Abnegation|Adherence|Ardour|Candour|Chastity|Clemency|Concord|Constancy|Contrition|Devotion|Diligence|Discipline|Duty|Fidelity|Fortitude|Grace|Humility|Judgement|Mercy|Obedience|Patience|Penance|Providence|Purity|Rectitude|Remorse|Resolve|Reverence|Sacrifice|Temperance|Truth|Valour|Verity|Vigilance|Zeal|Charity|Forbearance|Honour|Radiance|Steadfastness"
), 1);

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

const expandedDescriptorPools = {
  Appearance: "Ash-grey complexion|Azurite dust in the hair|Bandaged forearm|Barefoot|Bead-threaded braids|Bent posture|Birthmark across one cheek|Blackened fingernails|Bone-charm necklace|Bronze skin|Broken front tooth|Burned eyebrows|Carefully mended clothing|Chalk ward marks|Chipped tooth|Clean-shaven|Closely trimmed beard|Clouded eye|Copper-toned skin|Cracked spectacles|Crooked fingers|Crooked nose|Dark circles under the eyes|Deep-set eyes|Delicate hands|Dust-caked boots|Elaborate ear cuffs|Faded facial tattoo|Fine-boned features|Flattened nose|Freshly shaved jaw|Frostbitten fingertips|Full braided beard|Gap-toothed grin|Gem-glow beneath the skin|Gold-capped tooth|Grease-stained sleeves|Grey-streaked hair|Hardened knuckles|Heavy brow|Hollow cheeks|Hood shadowing the face|Inked knuckles|Iron-shod boots|Jagged scalp scar|Layered travel scarves|Limping gait|Long braided beard|Long-limbed|Metal finger splint|Milky left eye|Missing ear tip|Missing two fingers|Mud-spattered hem|Narrow face|Needle-thin scar on the lip|Oiled hair|Oil-darkened hands|Old manacle scars|One eyebrow split by a scar|One side of the head shaved|Oversized coat|Pale complexion|Patch over one eye|Patched gloves|Pierced brow|Powder-burned hands|Prominent cheekbones|Ritual paint on the cheeks|Rope-burned palms|Round face|Ruddy complexion|Salt-stiff cloak|Sand-scoured skin|Scarred palms|Sharp nose|Shaved eyebrows|Shoulder-length curls|Silver-streaked hair|Six-fingered left hand|Sleeves rolled to the elbows|Smoke-yellowed nails|Square jaw|Stitched leather coat|Sunken eyes|Tangled hair|Tarnished jewellery|Tattooed scalp|Thick eyebrows|Thick calluses|Travel-worn boots|Uneven haircut|Violet eyes|Wax-sealed braid|Weather-cracked lips|Web of fine scars|White lock of hair|Wind-tossed hair|Worn prayer cords|Carved wooden prosthetic|Ritual brands on both palms",
  Demeanor: "Absent-minded|Abrupt|Amiably cynical|Anxiously polite|Barely contained anger|Bitter|Blunt|Brisk|Calm under pressure|Candid|Careworn|Cautiously optimistic|Commanding|Compassionate|Condescending|Contemplative|Courtly|Defensive|Deliberate|Distrustful|Dutiful|Eager|Easily distracted|Elusive|Fervent|Formal|Gentle|Grimly amused|Haunted|Haughty|Hypervigilant|Inquisitive|Intense|Irreverent|Jaded|Jovial|Kindly|Laconic|Level-headed|Methodical|Morbidly cheerful|Nervously energetic|Obsequious|Overconfident|Perpetually apologetic|Precise|Quietly defiant|Reassuring|Recklessly confident|Reserved|Resigned|Ruthlessly practical|Secretive|Self-effacing|Severe|Shy|Soft-hearted|Stoic|Talkative|Tender|Tense|Thoughtful|Uncertain|Unflappable|Vindictive|Wary|Watchful|World-weary|Wry|Zealous",
  Attitude: "Answers questions with questions|Assumes everyone wants something|Assumes strangers are spies|Becomes friendlier over food|Believes rank must be earned|Bows to visible authority|Bribes before asking favours|Cannot ignore a challenge|Challenges pessimism|Changes the subject around family|Compliments useful equipment|Counts every ration|Defends local custom|Defers to elders|Demands evidence|Distrusts magic|Distrusts soldiers|Eager to trade stories|Expects payment in advance|Expects the worst|Fears organised religion|Finds outsiders entertaining|Flatters the powerful|Forgives honest mistakes|Greets danger with jokes|Hates being pitied|Hides kindness behind insults|Insists on formal introductions|Keeps promises literally|Looks down on city dwellers|Looks down on rural folk|Makes decisions by omen|Mocks formal titles|Never raises their voice|Never refuses hospitality|Offers advice unasked|Offers help before being asked|Only respects proven skill|Openly dislikes criminals|Openly dislikes nobles|Praises courage loudly|Prefers barter to coin|Prioritises clan over law|Prioritises law over friendship|Protects children instinctively|Questions every order|Quick to make wagers|Raises their voice to seize control|Records every debt|Refuses gifts|Rejects praise|Resents interruption|Respects craftsmanship|Seeks approval|Seeks common ground|Sees omens everywhere|Shares supplies freely|Speaks for quieter companions|Tests newcomers with teasing|Treats strangers as potential kin|Treats titles seriously|Treats wounds before questions|Trusts priests|Turns every topic to work|Values education|Views law as a tool|Views mercy as weakness|Welcomes gossip|Will not discuss the past|Worries over every expense|Avoids religious topics",
  Voice: "Abrasive whisper|Barely audible murmur|Breath caught between sentences|Bright clear voice|Broken rasp|Calm contralto|Careful second-language diction|Careful whisper|Commanding parade-ground voice|Cracked tenor|Cultivated formal accent|Deep chest voice|Dry monotone|Even baritone|Faltering speech|Gentle lilt|Habitual stage whisper|Hoarse from dust|Hushed intensity|Laughing cadence|Low alto|Low conspiratorial tone|Musical laugh between phrases|Nasal drawl|Precise enunciation|Quick breathless delivery|Reedy tenor|Resonant storyteller's cadence|Rolling cadence|Rumbling bass|Sharp clipped voice|Singing lilt|Slow deliberate speech|Smoky alto|Sonorous baritone|Staccato delivery|Strained whisper|Thin wavering voice|Thunderous laugh|Tremulous voice|Voice roughened by smoke|Warm bass|Warm contralto|Wheezing rasp|Words run together",
  Mannerism: "Adjusts a bracelet before speaking|Always checks the ceiling|Avoids stepping on cracks|Bites the inside of one cheek|Bows their head at doorways|Breathes out slowly before lying|Brushes dust from their shoulders|Carves notches into scrap wood|Checks their pulse when nervous|Clicks their tongue while counting|Closes one eye to judge distance|Collects loose nails|Combs fingers through their hair|Counts coins twice|Cracks their knuckles before decisions|Draws maps on tabletops|Eats only after others begin|Folds paper into sharp shapes|Glances toward the nearest window|Grips their collar during silence|Hums a three-note refrain|Keeps their boots pointed toward the exit|Keeps both hands hidden in their sleeves|Knocks twice on wood|Licks a thumb before turning a page|Lines up nearby objects|Listens with their head tilted|Marks doorframes with chalk|Mends clothing while talking|Mouths names silently|Never uses a person's name|Nods before disagreeing|Opens and closes a locket|Paces in exact circles|Plucks loose threads|Presses thumb to each fingertip|Quotes old proverbs|Rearranges cups by size|Rolls their shoulders before answering|Rubs their hands for warmth|Scratches notes onto their forearm|Shields every candle flame|Smooths their eyebrows|Sniffs every drink|Spins a ring around one finger|Stares at their shoes while thinking|Straightens crooked objects|Taps a tooth with one fingernail|Tests every chair before sitting|Touches their forehead in greeting|Traces the edge of a tattoo|Turns every cup handle outward|Unlaces and relaces one glove|Whispers numbers under their breath|Wraps their cloak tightly|Writes names in dust|Yawns when nervous|Balances a coin on each knuckle|Chews dried herbs while listening|Cleans beneath their nails with a knife|Counts door hinges|Draws a circle around spilled liquid|Drums a marching cadence on their thigh|Flicks ash from spotless sleeves|Folds their hands behind their back|Holds eye contact a moment too long|Keeps a tally on a cord|Leaves the last mouthful untouched|Measures rooms in paces|Memorises every visible face|Polishes their boots with a sleeve|Rests two fingers against their throat|Rocks gently on their heels|Rolls up maps from the wrong end|Saves bits of string|Scrapes mud from their soles immediately|Signs words unconsciously with one hand|Smiles before delivering bad news|Snaps twigs into equal lengths|Speaks to animals as if they answer|Stacks pebbles while waiting|Taps each pocket in sequence|Touches iron before making a promise|Turns rings inward when worried|Twists a lock of hair around one finger|Watches reflections instead of faces|Wets their lips before every answer|Whistles when the room goes quiet|Wipes fingerprints from handled objects|Counts breaths during arguments|Cups one ear when concentrating|Doodles repeated spirals|Examines every knot|Fidgets with a broken key|Keeps their back against a wall|Murmurs the date at sunrise|Offers a small bow after introductions|Presses flowers between book pages|Rubs an old coin for luck|Salutes absent-mindedly|Sketches faces from memory|Taps twice before opening any box|Touches the ground after stumbling|Uses a different nickname for everyone"
};
for (const [category, values] of Object.entries(expandedDescriptorPools)) {
  addValues(descriptors, category, "Any", "Any", split(values));
}

const culturalVoicePools = {
  Oriathan: "Crisp Theopolis court diction|Clipped legionary cadence|Measured temple oratory|Rapid forum-debater delivery|Patrician vowels polished by tutors|Rough Sarn dockside accent|Formal legalistic phrasing|Low barracks growl|Sing-song market cry|Provincial Oriathan drawl|Whispered confessional cadence|Careful Archivist enunciation",
  Azmeri: "Soft forest-set cadence|Lilting western valleys accent|Quiet speech broken by long pauses|Warm fireside storyteller's rhythm|Breathy woodland whisper|Rough frontier Azmeri|Measured grove-keeper's voice|Quick river-settlement chatter|Low chant-like delivery|Old rural vowels|Gentle consonants and rising questions|Cautious speech shaped by exile camps",
  Ezomyte: "Broad highland burr|Rolling r sounds and clipped endings|Deep clan-hall resonance|Quick Gaelic lilt|Gravelly mining-camp accent|Booming feast-hall cadence|Soft-spoken mountain dialect|Sharp drill-yard bark|Slow cairnside storytelling voice|Musical island inflection|Weathered lowland drawl|Measured oath-speaking tone",
  Maraketh: "Flowing caravan cadence|Clear oasis-court diction|Low desert whisper|Rhythmic market bargaining tone|Warm story-weaver's voice|Crisp outrider commands|Patient road-guide delivery|Musical campfire phrasing|Dry salt-road rasp|Formal Faridun recitation|Swift pack-train calls|Soft speech with elongated vowels",
  Karui: "Open vowels and a steady rhythm|Resonant ancestral chant|Sharp war-host commands|Warm canoe-song cadence|Measured marae oratory|Quiet omen-reader's voice|Rolling ceremonial phrasing|Deep chest-led speech|Rapid clan banter|Soft tide-like intonation|Forceful challenge cadence|Patient elder's storytelling rhythm",
  Vaal: "Precise glyph-priest diction|Measured astronomical recitation|Sibilant temple cadence|Quiet mathematical phrasing|Resonant ziggurat proclamation|Clipped artisan notation spoken aloud|Formal dynastic court accent|Soft serpent-cult whisper|Rhythmic calendar chant|Breathy gem-engine litany|Ancient vowels pronounced with care|Detached scholarly monotone",
  Kalguur: "Cool high-elven precision|Crisp expedition commands|Low northern lilt|Measured engineer's cadence|Sharp consonants softened by long vowels|Formal guildhall diction|Dry shipboard drawl|Quiet winter-camp speech|Rapid technical jargon|Melodic old-country accent|Controlled battlefield projection|Patient surveyor's narration",
  Stygian: "Stone-softened whisper|Deep subterranean resonance|Azurite miner's terse cadence|Formal rune-court diction|Quick deep-market bargaining tone|Breathless vent-runner speech|Measured powderwright terminology|Hollow gallery echo in every word|Guarded surface-trade accent|Slow oath-cutting cadence|Rasping sulphite-lab voice|Low clan-assembly chant"
};
for (const [culture, values] of Object.entries(culturalVoicePools)) {
  addValues(descriptors, "Voice", culture, "Any", split(values), 2);
}

const addStructuredDescriptors = (category, parent, subParent, values, {
  weight = 1, species = "Any", ages = "Any", professionCategories = "Any"
} = {}) => {
  for (const value of split(values)) {
    descriptors.push({ ...row(category, parent, subParent, value, weight), species, ages, professionCategories });
  }
};
addStructuredDescriptors("Build", "Any", "Any", "Compact and wiry|Lean and long-limbed|Broad and heavy-set|Powerfully built|Narrow-shouldered|Solid and square-framed|Lithe and balanced|Short and muscular|Tall and spare|Soft-bodied|Thick-necked|Fine-boned|Stooped but sturdy|Athletic|Frail-looking|Barrel-chested|Quick-footed|Heavy-footed|Bent by labour|Gracefully poised|Restless in stance|Rigidly upright|Relaxed and loose-limbed|Slight and quick|Weathered but strong|Deliberately imposing|Unusually still|Careful with one leg|Strong-backed|Underfed and angular");
addStructuredDescriptors("Features", "Any", "Any", "Deep-set eyes|Round face|Narrow face|Square jaw|Prominent cheekbones|Heavy brow|Thick eyebrows|Shaved eyebrows|Crooked nose|Sharp nose|Flattened nose|Freckled cheeks|Weather-cracked lips|Gap-toothed grin|Gold-capped tooth|Broken front tooth|Close-cropped hair|Shoulder-length curls|Waist-length hair|Carefully braided hair|Bead-threaded braids|Shaven head|One side of the head shaved|Grey-streaked hair|Silver-streaked hair|White lock of hair|Oiled hair|Tangled hair|Wind-tossed hair|Clean-shaven jaw|Closely trimmed beard|Full braided beard|Long braided beard|Dark circles beneath the eyes|Sunken eyes|Clouded eye|Milky left eye|Pierced brow|Elaborate ear cuffs|Crooked smile|Youthful face|Weathered face|Immaculately groomed|Grime-streaked|Soot-blackened|Sun-darkened complexion|Pale complexion|Ruddy complexion|Copper-toned complexion|Bronze complexion|Ash-grey complexion|Violet eyes|Fine web of facial scars|Faded facial tattoo|Ritual paint on the cheeks|Tattooed scalp|Freshly shaved jaw|Burned eyebrows|Chipped tooth|One eyebrow split by a scar");
addStructuredDescriptors("Attire", "Any", "Any", "Battered travel cloak|Carefully mended work clothes|Layered travel scarves|Oversized coat|Patchwork armour|Salt-stiff cloak|Stitched leather coat|Mud-spattered hem|Dust-caked boots|Travel-worn boots|Iron-shod boots|Patched gloves|Sleeves rolled to the elbows|Worn prayer cords|Tarnished jewellery|Plain undyed linen|Faded guild colours|Oilskin cape|Tool-heavy leather belt|Weatherproof hooded mantle|Formal coat past its prime|Borrowed armour that fits poorly|Practical clothes with hidden pockets|Brightly repaired garments|Heavy wool travelling clothes|A clean apron over stained clothes|Ceremonial sash worn with daily clothes|Multiple belts and pouches|A scarf covering the lower face|A long coat fastened to one side|A breastplate polished only at the front|Simple robes reinforced at the elbows|A cloak pinned with a family token|Soft boots wrapped against dust|A broad hat with a repaired brim|A hood lined with stitched charms|A coat marked by old rank insignia|A sleeveless work vest|A carefully folded headcloth|A short cape over fitted armour");
addStructuredDescriptors("Distinguishing", "Any", "Any", "Old blade scars|Burn scar across one arm|Birthmark across one cheek|Missing finger|Missing two fingers|Missing ear tip|Blind in one eye|Jagged scalp scar|Needle-thin scar on the lip|Old manacle scars|Ritual scarification|Ceremonial tattoos|Inked knuckles|Ritual brands on both palms|Powder-burned hands|Oil-darkened hands|Ink-stained fingers|Calloused hands|Hardened knuckles|Rope-burned palms|Scarred palms|Frostbitten fingertips|Blackened fingernails|Smoke-yellowed nails|Metal finger splint|Bandaged forearm|Carved wooden prosthetic|Limping gait|Cracked spectacles|Bone-charm necklace|Chalk ward marks|Gem-glow beneath the skin|Wax-sealed braid|Six-fingered left hand|Pierced ears linked by a fine chain|A branded number at the wrist|A missing tooth replaced with carved bone|A tremor in one hand|A faded unit tattoo|A carefully concealed throat scar|A ritual cord for each dead relative|A chipped lens held in a wire frame|A permanent sulphite stain|A cluster of small alchemical burns|A line of script tattooed along the jaw|A hand that never fully closes|A bright patch sewn over an old heraldic badge|A prayer token tied around the wrist|A tool used as a hairpin|A small bell that never rings");

const culturalAttire = {
  Oriathan: "A severe white-and-red civic tunic|A dark legionary cloak with the badge removed|A finely pleated Theopolis robe|A practical militia coat with a tarnished badge|A temple stole worked with the Descry|A patrician mantle repaired by a cheaper tailor",
  Azmeri: "A wool cloak dyed with forest plants|A mantle fastened with carved antler|Layered homespun suited to woodland travel|A belt hung with herb packets|A weathered tartan-like shoulder wrap|A cloak embroidered with old Azmeri suns",
  Ezomyte: "A heavy clan tartan over mail|A stone-dust leather apron|A broad belt bearing a clan clasp|A thick highland cloak pinned at one shoulder|A mail shirt repaired with mismatched rings|A carved animal-totem brooch",
  Maraketh: "Layered desert robes secured for riding|A bright sash marking caravan duty|A wrapped headcloth against grit|A fitted riding coat with embroidered cuffs|A veil of fine chain and dyed cloth|A weathered cloak decorated with rhoa feathers",
  Karui: "A flax cloak fastened with carved bone|A woven shoulder mantle marked for a god-clan|A practical wrap suited to canoe travel|A wooden breastguard over tattooed skin|A feathered cord showing clan service|A rain cape woven from dark reeds",
  Vaal: "A geometric mantle clasped with jade|A pleated robe traced with calendar glyphs|A gem-set collar over severe linen|A lacquered ceremonial harness|A scholar's robe patterned with serpents|A court sash worked in obsidian beads",
  Kalguur: "Angular plate beneath a rune-cut cloak|A high-collared expedition coat|Spiked pauldrons designed to shed climbing ropes|A fitted surveyor's mantle with metal corners|A rune-stitched coat reinforced with bright scales|A severe elven cuirass with narrow gilded edges",
  Stygian: "A soot-dark coat stitched with rune thread|Layered mine leathers with a lamp harness|A stone-grey mantle weighted at the hem|A powder-resistant apron over dark mail|A hooded cloak designed for low tunnels|A surface-trade coat worn over traditional underlayers"
};
for (const [culture, values] of Object.entries(culturalAttire)) {
  addStructuredDescriptors("Attire", culture, "Any", values, { weight: 3 });
}
addStructuredDescriptors("Attire", "Oriathan", "Templar", "A white Templar tabard over serviceable armour|An ordained robe without family heraldry|A legion coat bearing an orderly row of honours|A chaplain's mantle singed at the hem|A severe Archivist robe with waxed document pockets", { weight: 4 });
addStructuredDescriptors("Attire", "Oriathan", "Oriath Militia", "A weathered leather coat and tarnished badge|A port-watch cloak smelling faintly of salt|A patched uniform bought from a former constable|A clean militia sash over civilian clothes|A reinforced watch coat with Ring stitching hidden inside", { weight: 4 });
addStructuredDescriptors("Attire", "Stygian", "Emberforged", "A surface-cut coat adapted for mine work|A powderproof apron bearing the Emberforged mark|A travel mantle concealing trade ledgers|A reinforced smuggler's coat with hidden sample tubes", { weight: 4 });
addStructuredDescriptors("Distinguishing", "Any", "Any", "Small lower tusks|A broken tusk capped in copper", { species: "Half-Orc|Orc" });
addStructuredDescriptors("Distinguishing", "Any", "Any", "A beard clasped with a stone clan-ring|Pale stone dust caught permanently in the beard", { species: "Dwarf|Duergar" });
addStructuredDescriptors("Distinguishing", "Any", "Any", "Long ears pierced near the tips|One pointed ear bears an old tear", { species: "Elf|Half-Elf|Drow" });
addStructuredDescriptors("Distinguishing", "Any", "Any", "Fine azurite freckles glow beneath the skin|A mining rune branded behind one ear", { species: "Drow|Duergar|Deep Gnome" });
addStructuredDescriptors("Features", "Any", "Any", "Grey hair worn in a severe knot|White brows above clear eyes|Deep age lines around the mouth", { ages: "Elder|Ancient" });
addStructuredDescriptors("Features", "Any", "Any", "A round youthful face|Patchy first beard|Unlined skin and watchful eyes", { ages: "Child|Young Adult" });
addStructuredDescriptors("Attire", "Any", "Any", "A tool harness arranged for immediate use|A protective apron covered in careful repairs|A coat whose pockets contain measuring tools", { professionCategories: "Craftsman|Engineering|Mining|Black Powder|Construction" });
addStructuredDescriptors("Attire", "Any", "Any", "Layered armour with repaired straps|A weapon belt maintained better than the clothing|A service cloak worn over practical armour", { professionCategories: "Military|Templar Service|Militia Service|Tribal" });

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
const expandedGlobalJobs = {
  Agriculture: "Bean grower|Cattle drover|Charcoal coppicer|Fungus cultivator|Irrigation keeper|Mushroom farmer|Olive tender|Root-cellar keeper|Seed keeper|Shepherd|Terrace farmer|Vermin catcher",
  Artist: "Actor|Banner painter|Calligrapher|Choir singer|Dancer|Engraver|Illuminator|Mask maker|Puppeteer|Sculptor|Storyteller|Tattoo artist",
  Communications: "Beacon tender|Dispatch rider|Drum signaller|Flag signaller|Letter writer|Map courier|News crier|Pigeon keeper|Sign painter|Town crier|Trail messenger|Whisper-network contact",
  Construction: "Aqueduct mason|Bridge carpenter|Canal digger|Plasterer|Road paver|Sewer mason|Shipwright|Stair cutter|Tile layer|Timber framer|Tunnel bracer|Wall engineer",
  Craftsman: "Basket weaver|Blacksmith|Candlemaker|Cobbler|Cutler|Feltmaker|Fletcher|Instrument maker|Rope maker|Saddle maker|Soap boiler|Spinner|Tinker|Wheelwright|Woodcarver",
  Criminal: "Blackmailer|Confidence trickster|Contraband runner|Cutpurse|Forger|Kidnapper|Loan shark|Poacher|Protection collector|Safe-breaker|Tunnel smuggler|Vice-den keeper",
  Commoner: "Brewer's drudge|Candle lighter|Chimney sweep|Cistern cleaner|Corpse collector|Fishmonger|Gong farmer|Kitchen scullion|Mine-canteen keeper|Refuse picker|Tannery hand|Washer",
  Magic: "Curse breaker|Divination reader|Glyph inscriber|Ley surveyor|Occult translator|Reagent gatherer|Rune warder|Scrying assistant|Spirit medium|Thaumaturgic mechanic|Ward painter|Witch finder",
  Medical: "Barber-surgeon|Battlefield stretcher-bearer|Bloodletter|Corpse examiner|Dentist|Fever nurse|Leech keeper|Mortuary washer|Poison healer|Prosthetic maker|Quarantine keeper|Wound stitcher",
  Military: "Archer|Battlemage|Cavalry scout|Crossbowman|Gate sergeant|Patrol leader|Shield bearer|Standard bearer|Trench captain|War-beast handler|Watch recruit|Weapons-drill instructor",
  Outcast: "Curse-marked wanderer|Deserter|Dispossessed farmer|Escaped thrall|Failed initiate|Forbidden scholar|Fugitive|Plague exile|Proscribed mage|Shipwreck survivor|Squatter|Unlicensed thaumaturge",
  Religion: "Almoner|Burial priest|Exorcist|Flagellant|Funerary singer|Oracle attendant|Pilgrim guide|Ritual drummer|Sacristan|Temple cook|Votive maker|Wandering monk",
  Scholarly: "Anatomist|Antiquarian|Astronomer|Census keeper|Genealogist|Geographer|Librarian|Mathematician|Monster anatomist|Rune scholar|Theologian|Translator",
  Trade: "Arms dealer|Caravan factor|Fish seller|Grain factor|Horse trader|Lamp-oil merchant|Money changer|Ore broker|Relic dealer|Spice merchant|Timber merchant|Travelling peddler",
  Transport: "Canal boatman|Coach driver|Litter bearer|Muleteer|River pilot|Road warden|Ship's mate|Sled driver|Stablemaster|Teamster|Wagon guard|Wharf hauler",
  Survival: "Cliff guide|Fire keeper|Herbal forager|Ice scout|Marsh guide|Mountain guide|Mushroom gatherer|River tracker|Shelter builder|Snare maker|Water finder|Weather reader",
  Exploration: "Abyss scout|Cavern guide|Expedition chronicler|Frontier surveyor|Relic mapper|Rope specialist|Ruin cartographer|Scout captain|Trail marker|Treasure seeker|Undercity guide|Vault examiner",
  Engineering: "Aqueduct engineer|Blast-shield designer|Crane keeper|Floodgate keeper|Forge mechanic|Lift operator|Lockwright|Millwright|Siege machinist|Trap engineer|Waterwheel keeper|Winchwright",
  Mining: "Assayer|Cart hauler|Crystal picker|Gem miner|Lamp tender|Ore washer|Pit surveyor|Quarryman|Salt miner|Seam tester|Slag sorter|Ventilation watcher",
  "Black Powder": "Bomb maker|Charge setter|Cinder tester|Grenade filler|Powder courier|Powder dryer|Powder miller|Proofing officer|Sulphite chemist|Tunnelling blaster",
  Youth: "Animal minder|Berry gatherer|Candle runner|Charcoal sorter|Fisher's helper|Kitchen page|Lamp carrier|Message runner's apprentice|Net mender|Ore picker|Workshop page|Water carrier"
};
for (const [category, values] of Object.entries(expandedGlobalJobs)) addJobs(category, values);
addJobs("Commoner", "Amphitheatre usher|Bathhouse steward|Canal porter|Forum vendor|Insula caretaker|Public-cistern keeper|Road-station host|Temple-square sweeper", "Oriathan", "Any");
addJobs("Scholarly", "Imperial census clerk|Legion records keeper|Oriathan legal commentator|Patrician tutor|Provincial tax scribe|Temple genealogist|Thaumaturgical copyist|Virtue historian", "Oriathan", "Any");
addJobs("Agriculture", "Forest apiary keeper|Grove tender|Hazel coppicer|Medicinal-moss grower|Orchard grafter|Riverbank gardener|Root-crop keeper|Woodland swineherd", "Azmeri", "Any");
addJobs("Survival", "Blackwood pathfinder|Forest-omen reader|Nightwood scout|River-ford keeper|Ruin-edge forager|Sacred-grove guide|Wild-beast tracker|Wicker-shelter builder", "Azmeri", "Any");
addJobs("Mining", "Clan seam master|Deep-iron prospector|Granite breaker|Highland quarry boss|Ore-song caller|Pit brace inspector|Slate cutter|Vein-right assessor", "Ezomyte", "Any");
addJobs("Craftsman", "Cairn mason|Clan armour smith|Highland cooper|Iron-brooch maker|Stone-ale brewer|Tartan dyer|Tunnel timberer|War-pick smith", "Ezomyte", "Any");
addJobs("Trade", "Caravan auctioneer|Carpet factor|Dried-fruit broker|Oasis factor|Salt-road merchant|Silk appraiser|Spice broker|Water-right trader", "Maraketh", "Any");
addJobs("Transport", "Beast-caravan master|Desert outrider|Dune pathfinder|Oasis courier|Pack-train marshal|Salt-road guide|Silk-road drover|Water-caravan guide", "Maraketh", "Any");
addJobs("Magic", "Blood-geometry assistant|Gem-circuit architect|Glyph-energy calibrator|Sacrifice registrar|Serpent-ward engineer|Sun-engine attendant|Temple-current reader|Vaal gemwright", "Vaal", "Any");
addJobs("Scholarly", "Calendar calculator|Dynastic chronicler|Glyph grammarian|Observatory keeper|Ritual mathematician|Serpent-cult historian|Temple surveyor|Ziggurat archivist", "Vaal", "Any");
addJobs("Exploration", "Expedition surveyor|Frozen-pass scout|Mobile-camp pathfinder|Relic-recovery leader|Shore-party navigator|Spiked-camp outrider|Unknown-coast mapper|Winter-route finder", "Kalguur", "Any");
addJobs("Craftsman", "Angular-armour smith|Quillon blade smith|Rimeglass cutter|Silver-spike jeweller|Spiked-bulwark maker|Stormproof leatherworker|Thorn-plate fitter|Winter-forge keeper", "Kalguur", "Any");
addJobs("Tribal", "Ancestor singer|Canoe builder|Hunt leader|Ritual tattooist|Spirit caller|Tribal envoy|Warband scout|Weapon carver", "Karui", "Any");
addJobs("Military", "War-host champion|Pā guardian|Weapon-drill leader|Conquest scout", "Karui", "Tukohama");
addJobs("Craftsman", "Ngamahu forge-priest|Ancestral metalworker|Volcanic-glass carver|Ritual weapon smith", "Karui", "Ngamahu");
addJobs("Agriculture", "Storm-season farmer|Rain-field keeper|Windbreak builder|Weather crop reader", "Karui", "Valako");
addJobs("Transport", "Tidewalker pilot|Reef navigator|War-canoe steersman|Wave Speaker's courier", "Karui", "Tasalio");
addJobs("Scholarly", "Sun-school tutor|Diplomatic chronicler|Agricultural innovator|Ramako lorekeeper", "Karui", "Ramako");
addJobs("Military", "Night guardian|Cave-refuge warder|Moonless-path scout|Rongokurai peacekeeper", "Karui", "Rongokurai");
addJobs("Transport", "Star navigator|Moon-tide reader|Dream-route pilot|Night canoe guide", "Karui", "Arohongui");
addJobs("Tribal", "Dream-tender|Forest guardian|Sustainable hunter|Sacred-grove keeper", "Karui", "Tawhoa");
addJobs("Outcast", "Hidden hunger-cultist|Forbidden-feast keeper|Secret chaos preacher|Shunned Kitava devotee", "Karui", "Kitava");
addJobs("Tribal", "Hatungo apprentice|Ancestor custodian|Funerary guide|Omen interpreter", "Karui", "Hinekora");
addJobs("Religion", "Dawn chanter|Radiant shrine keeper|Sunfire ritualist|Sione celebrant", "Karui", "Sione");
addJobs("Magic", "Moon seer|Dream interpreter|Serenity keeper|Lani Lua mystic", "Karui", "Lani Lua");
addJobs("Royal Court", "Astronomer-priest|Calendar keeper|Court artificer|Glyph accountant|Palace guard|Royal diviner|Temple engineer", "Vaal", "Any");
addJobs("Templar Service", "Field chaplain|Inquisitorial aide|Legionary|Temple physician|Thaumaturgical researcher|Virtue instructor", "Oriathan", "Templar");
addJobs("Templar Service", "Adjunct archivist|Barracks confessor|Cohort secretary|Doctrinal examiner|Initiate Magus|Initiate Templar|Legion armourer|Legion scout|Magus|Reliquary guard|Temple quartermaster|Templar investigator", "Oriathan", "Templar");
for (const [value, weight] of Object.entries({
  "Ebony Legion (Primis, elite)": 15,
  "Crimson Legion (Secundo, veteran)": 20,
  "Azure Legion (Tertius, first Sarn legion)": 12,
  "Azure Legion (Tertius, second Sarn legion)": 12,
  "Emerald Legion (Quartus, recruit and volunteer)": 26,
  Archivists: 15
})) professions.push(row("Templar Branch", "Oriathan", "Templar", value, weight));
addJobs("Militia Service", "Beat constable|Dock watchman|Gate constable|Harbour patrol guard|Jailer|Market warder|Militia clerk|Militia investigator|Night watchman|Patrol runner|Prison escort|Public-order sergeant|Riot shield bearer|Road checkpoint guard|Tollhouse constable|Warrant officer|Watch captain|Watch sergeant|Witness escort|Wardhouse quartermaster", "Oriathan", "Oriath Militia");
addJobs("The Ring", "Arena bookmaker|Bribe courier|Debt collector|Enforcer|Fence|Information broker|Pit-fight fixer|Safehouse keeper|Smuggler|Street runner", "Oriathan", "The Ring");
addJobs("Mining", "Azurite seam-reader|Deep-shaft shorer|Rune-face surveyor|Sulphite prospector|Vein singer|Ventilation cutter", "Stygian", "Any");
addJobs("Engineering", "Azurite pumpwright|Deep-hoist keeper|Rune-mechanism fitter|Stone-pressure engineer|Tunnel bracewright", "Stygian", "Any");
addJobs("Black Powder", "Sulphite powderwright|Blast-rune cutter|Fuse-knotter|Powder cask keeper|Shot tester|Trade powder measurer", "Stygian", "Any");
addJobs("Craftsman", "Angular armour smith|Azurite lens grinder|Rune chisel maker|Deep-lantern maker|Basalt mason", "Stygian", "Any");
addJobs("Construction", "Tunnel-brace warden|Cave-in assessor|Load-rune cutter|Deep-gate mason", "Stygian", "Deepwardens");
addJobs("Black Powder", "Sulphite refiner|Volatility alchemist|Demolition planner|Blast-safety inspector", "Stygian", "Sulphite Syndicate");
addJobs("Scholarly", "Vaal-ruin decipherer|Abyssal scholar|Forgotten-archive keeper|Void-sign researcher", "Stygian", "Shadowborn");
addJobs("Exploration", "Abyssal pathfinder|Vaal-gallery surveyor|Lightless-depth scout|Forbidden-ruin delver", "Stygian", "Shadowborn");
addJobs("Trade", "Surface smuggler|Oriathan go-between|Hidden-route factor|Surface-goods broker|Kalguur powder factor", "Stygian", "Emberforged");
addJobs("Exploration", "Surface pathfinder|Sun-route scout|Vent climber|Passage mapper", "Stygian", "Emberforged");
addJobs("Communications", "Surface diplomat|Code courier|Trade interpreter|Secret-contact keeper", "Stygian", "Emberforged");
addJobs("Black Powder", "Sulphite powderwright|Kalguur powder liaison|Trade-batch tester|Hidden-cask keeper", "Stygian", "Emberforged");
addJobs("Exploration", "Lost-gallery mapper|Hollowed pathfinder|Collapsed-shaft delver|Surface route seeker", "Stygian", "Hollowed Vein");
addJobs("Black Powder", "Stygian liaison|Sulphite-powder quartermaster|Field bombard engineer|Powder proof-master", "Kalguur", "Kalguur Expedition");
addJobs("Engineering", "Expedition bridgewright|Spiked bulwark engineer|Powder-lock designer|Mobile forge keeper", "Kalguur", "Kalguur Expedition");

const hooks = [];
const addHooks = (category, parent, subParent, values, weight = 1) => addValues(hooks, category, parent, subParent, split(values), weight);
addHooks("Ideal", "Any", "Any", "I will rebuild what the Cataclysm destroyed.|No one survives alone.|Knowledge is a weapon against the nightmare.|The vulnerable deserve protection.|A promise matters most when keeping it hurts.|Freedom is worth every hardship.|Practical mercy saves more lives than pride.|The dead deserve to be remembered.");
addHooks("Bond", "Any", "Any", "I carry the last token of my household.|A travelling companion once saved my life.|I owe a dangerous debt for safe passage.|I guard a map to a refuge no one else knows.|My missing sibling may still be alive.|I will restore a ruined shrine or home.|A community depends on the supplies I bring.|I promised to return an heirloom to its owner.");
addHooks("Flaw", "Any", "Any", "I hoard supplies long after danger has passed.|I mistake suspicion for wisdom.|I cannot leave forbidden relics untouched.|I answer insults with reckless escalation.|I conceal an illness or wound.|I abandon plans when omens turn against me.|I trust status more than character.|I would betray a stranger to protect my own.");

addHooks("Ideal", "Oriathan", "Any", "Civil order is the wall between survival and ruin.|Education should serve the whole city, not only its patricians.|A household's reputation is built by daily conduct.|Law deserves respect only when it protects the weak.|Oriath must answer honestly for what it did in Wraeclast.|Public duty matters more than private comfort.|Trade and civic works can rebuild what conquest destroyed.|No priest or noble stands above consequence.");
addHooks("Bond", "Oriathan", "Any", "My family still occupies one room of our former estate.|A port neighbourhood sheltered me during a purge.|I carry the account book of a ruined household.|A former servant knows the truth about my family.|I send every spare coin to relatives in Theopolis.|A civic mentor taught me to read forbidden records.|I promised to clear an innocent person's name.|My livelihood depends on a fragile licence from the authorities.");
addHooks("Flaw", "Oriathan", "Any", "I treat refinement as evidence of competence.|I conceal my family's loss of status.|I assume bureaucracy can solve a human crisis.|I speak of Wraeclast as though Oriath still owns it.|I avoid offending authority until resistance is too late.|I confuse education with wisdom.|I preserve appearances at ruinous cost.|I instinctively rank people by accent and clothing.");

addHooks("Ideal", "Azmeri", "Any", "A community survives by remembering who cared for it.|The forest is a neighbour rather than a possession.|Old knowledge should be tested, not merely obeyed.|Hospitality is sacred when roads are dangerous.|A leader earns trust by sharing hardship.|Every ruin carries a warning for the living.|Healing the land is more important than claiming it.|Stories keep a scattered people together.");
addHooks("Bond", "Azmeri", "Any", "I tend the grove where my family marks its dead.|A hunter who vanished taught me every safe path I know.|I carry a song known by only three surviving elders.|The Forest Encampment gave me refuge when no one else would.|A child in my care believes I can solve anything.|I owe a life-debt to an outsider the tribe distrusts.|I guard the route to an untouched medicinal spring.|I must recover a relic taken from an old Azmeri shrine.");
addHooks("Flaw", "Azmeri", "Any", "I treat unfamiliar customs as signs of corruption.|I refuse to abandon land that has become unsafe.|I hide bad omens to prevent panic.|I give too much authority to tradition.|I resent descendants of the Empire for forgetting us.|I mistake secrecy for protection.|I take responsibility for problems no one person can mend.|I trust the forest's signs more than clear evidence.");

addHooks("Ideal", "Ezomyte", "Any", "An oath spoken before the clan must survive fear.|Craft and song preserve what conquerors try to erase.|Courage includes admitting when a feud must end.|No ruler has the right to own another person.|The First Ones teach survival, not mindless cruelty.|A guest under one's roof must be defended.|History belongs in living memory rather than imperial archives.|A clan is strongest when its weakest member stands with it.");
addHooks("Bond", "Ezomyte", "Any", "I carry a brooch from a clanhold lost to war.|My teacher's final poem contains a hidden warning.|I swore to return a weapon to the family of its maker.|A sibling joined a rival clan after an old dispute.|I know the true account of a celebrated battle.|A mine community depends on my judgement.|I owe freedom to someone whose name my clan curses.|I seek the burial cairn of an ancestor taken in chains.");
addHooks("Flaw", "Ezomyte", "Any", "I keep feuds alive long after their cause is forgotten.|I would rather suffer than admit an oath was foolish.|I dismiss quiet people as lacking courage.|I drink or boast when grief becomes difficult.|I assume fine speech conceals dishonesty.|I measure worth through endurance alone.|I cannot leave an insult unanswered.|I romanticise a past that was harsher than I admit.");

addHooks("Ideal", "Maraketh", "Any", "The caravan survives when every rider fulfils their duty.|Strength must protect the road, not prey upon it.|Water offered to a traveller is never wasted.|Tradition must remain strong enough to endure honest change.|A promise made before the akhara binds the whole self.|Skill deserves recognition regardless of birth.|The desert punishes waste and rewards preparation.|A leader listens before choosing the road.");
addHooks("Bond", "Maraketh", "Any", "My akhara entrusted me with a route known to few outsiders.|I raise a rhoa descended from my family's finest mount.|A Faridun saved me when custom said they should not.|I carry a message for a Sekhema who may already be dead.|My caravan partner disappeared beyond a dust storm.|I must repay water taken from a rival camp.|A family tattoo records a shame I intend to redeem.|I guard the last trade token of a broken caravan.");
addHooks("Flaw", "Maraketh", "Any", "I treat endurance as proof that a decision was right.|I cannot forgive a public challenge to my competence.|I hide doubt behind formal tradition.|I judge settled people as soft and shortsighted.|I accept dangerous wagers to defend my honour.|I obey an akhara custom I privately know is cruel.|I read every gift as an attempted obligation.|I would abandon an outsider before risking my caravan.");

addHooks("Ideal", "Karui", "Any", "Mana is earned through service rather than claimed by birth.|Ancestors should guide the living without ruling them.|Hospitality and courage are both measures of strength.|The clan survives when each generation adds to its knowledge.|A challenge answered honestly prevents a hidden feud.|Land and sea are inheritances held in trust.|A warrior's first duty is to bring their people home.|No foreign empire will define Karui worth.");
addHooks("Bond", "Karui", "Any", "My family canoe carries repairs from five generations.|I bear a carving that records my line's migrations.|A rival clan fostered me during a season of hunger.|I promised an elder to learn why our ancestors left this shore.|A younger relative copies everything I do.|I carry the name of someone denied proper funerary rites.|A warband companion once chose my life over victory.|I must return a stolen heirloom before the next gathering.");
addHooks("Flaw", "Karui", "Any", "I turn disagreement into a test of courage.|I invoke ancestors to avoid admitting personal fear.|I expect outsiders to misunderstand before they speak.|I protect clan reputation by hiding serious failures.|I treat retreat as shame even when it saves lives.|I carry inherited grudges as though they were my own.|I confuse directness with permission to be cruel.|I will risk too much to avoid appearing dependent.");

addHooks("Ideal", "Vaal", "Any", "Knowledge has value only when its cost is understood.|A civilisation should be judged by what it refuses to sacrifice.|Order is revealed through number, season and celestial motion.|Power must be recorded so later generations can question it.|Beauty and precision are forms of sacred discipline.|Death is a boundary to study, not an excuse for cruelty.|The court exists to preserve civilisation beyond one ruler.|No discovery excuses the erasure of its victims.");
addHooks("Bond", "Vaal", "Any", "My calculations protect a district from a failing gem-engine.|A rival scholar possesses the missing half of my proof.|I owe my position to a courtier I no longer trust.|My family maintains a shrine older than the present dynasty.|I carry testimony from subjects selected for sacrifice.|A construct recognises a command word only I know.|I must warn a city that refuses to hear its own future.|A sealed laboratory contains my mentor's unfinished work.");
addHooks("Flaw", "Vaal", "Any", "I value a complete experiment over the people endangered by it.|I assume mathematical elegance proves moral worth.|I conceal failed predictions to preserve my standing.|I treat servants as invisible parts of a system.|I mistake ritual repetition for safety.|I am fascinated by precisely what should frighten me.|I would sacrifice truth to prevent public disorder.|I believe my education makes me resistant to corruption.");

addHooks("Ideal", "Kalguur", "Any", "A lineage is honoured by adding knowledge to it.|An expedition leader is responsible for every return journey.|Runes should preserve truth rather than decorate authority.|A tested design matters more than a glorious theory.|Trade creates obligations on both sides.|History must be sung accurately even when it shames the victors.|Preparation is a form of respect for danger.|No discovery belongs solely to the person who found it.");
addHooks("Bond", "Kalguur", "Any", "My family expects me to add a verse to its lineage song.|I inherited a rune-tool whose maker is officially forgotten.|A shipmate took the blame for my failed design.|I promised to map the last route of a lost expedition.|A rival house holds the legal claim to my best discovery.|I carry letters for people who may never see Aesclast again.|My crew saved an archive others wanted burned.|I must return proof that an ancestor was wrongly condemned.");
addHooks("Flaw", "Kalguur", "Any", "I dismiss knowledge that cannot be measured.|I protect family prestige by hiding useful discoveries.|I treat every conversation as a negotiation.|I take excessive risks to produce a complete survey.|I confuse emotional restraint with objectivity.|I refuse to abandon equipment even when lives are at risk.|I assume other cultures misuse anything they do not understand.|I would rather repair a plan than admit it should be discarded.");

addHooks("Ideal", "Oriathan", "Templar", "Order must outlive the empire.|The Virtues must be defended from corruption.|Discipline is the first defence against nightmare.|Service can redeem the sins of Oriath.|The law must bind commanders as well as recruits.");
addHooks("Bond", "Oriathan", "Templar", "My legion is the only family I have left.|I protect an Archivist carrying dangerous records.|A fallen superior entrusted me with a sealed order.|I owe my life to an Emerald volunteer from the lower strata.|I must discover who corrupted my command.");
addHooks("Flaw", "Oriathan", "Templar", "I obey rank even when conscience objects.|I see dissent as the first sign of heresy.|I hide how frightened I am of thaumaturgy.|I judge non-Oriathans by imperial custom.|I falsified a report to protect my unit.");
addHooks("Ideal", "Oriathan", "Oriath Militia", "Law should protect the street before it protects the palace.|A badge is a public trust rather than a private privilege.|Local knowledge is worth more than distant orders.|A peaceful arrest is better than a heroic funeral.|The militia must answer to the neighbourhoods it patrols.|No legion understands Oriath's streets as we do.");
addHooks("Bond", "Oriathan", "Oriath Militia", "My patrol partner covered for my worst mistake.|A market district knows me by name.|I keep evidence against a watch captain in a sealed box.|The Ring paid for medicine my family could not afford.|I promised a victim's family that the case would remain open.|My badge belonged to the constable who trained me.");
addHooks("Flaw", "Oriathan", "Oriath Militia", "I accept small bribes and insist they change nothing.|I resent legionaries who treat us as amateurs.|I protect familiar offenders from outside investigators.|I use procedure to avoid difficult judgement.|I assume poverty is evidence of criminal intent.|I let loyalty to my patrol override the truth.");
addHooks("Ideal", "Oriathan", "The Ring", "Every bargain has a price and I name it.|The Ring protects those the empire discards.|Information is safer than steel.|I will never be owned by church or crown.|Profit means nothing without loyalty.");
addHooks("Bond", "Oriathan", "The Ring", "My Arena crew expects my cut by dawn.|A broker in Sarn holds proof of my innocence.|I run messages for the handler who kept me alive.|The Ring shelters my family.|I know which official takes which bribe.");
addHooks("Flaw", "Oriathan", "The Ring", "I treat every kindness as leverage.|I gamble with money that is not mine.|I keep a second ledger for blackmail.|I cannot resist humiliating a rival.|I sell secrets before weighing the cost.");

addHooks("Ideal", "Karui", "Tukohama", "Strength exists to defend the clan.|Conflict reveals the courage words conceal.|A warrior's discipline matters more than fury.|Victory is hollow if the people cannot endure it.");
addHooks("Bond", "Karui", "Tukohama", "My war-host carried me home when I could not walk.|I bear a weapon entrusted to my line.|I swore to defend our pā against the next invasion.|A defeated rival deserves the rematch I promised.");
addHooks("Flaw", "Karui", "Tukohama", "I provoke conflict to test uncertain allies.|I would rather break than retreat.|I mistake mercy for weakness.|I turn every disagreement into a contest of strength.");
addHooks("Ideal", "Karui", "Ngamahu", "Craft gives sacred fire a purpose.|Passion must be tempered into something that endures.|A maker's work should strengthen the whole clan.|Creation and destruction share one flame.");
addHooks("Bond", "Karui", "Ngamahu", "I guard an ember from my clan's ancestral forge.|My finest weapon was promised to a coming champion.|A master smith vanished before teaching me their last secret.|My family depends on the tools I make.");
addHooks("Flaw", "Karui", "Ngamahu", "I judge people by the quality of their craft.|I cannot abandon a project once the fire is lit.|I destroy flawed work rather than let anyone repair it.|My temper burns hotter than my forge.");
addHooks("Ideal", "Karui", "Valako", "Storm and soil together sustain the clan.|Preparation is the only honest answer to wild weather.|Courage means steering through the storm.|Land and sea reward those who read their signs.");
addHooks("Bond", "Karui", "Valako", "My family tends fields reclaimed after a great storm.|I owe my life to the navigator who read an impossible wind.|I carry a weather record kept for generations.|My crew and my harvest both depend on my return.");
addHooks("Flaw", "Karui", "Valako", "I treat every calm as the warning before disaster.|I trust omens of weather more than people.|I take reckless risks when a storm rises.|I refuse to change a plan once I have read the signs.");
addHooks("Ideal", "Karui", "Tasalio", "Like water a people survives by adapting.|The sea provides only when treated with respect.|A steady hand saves more lives than a loud command.|No shore should make strangers of the Karui.");
addHooks("Bond", "Karui", "Tasalio", "My Tidewalker crew is my second family.|I carry a message from a Wave Speaker.|A reef shrine marks where my kin were lost.|I must recover a canoe taken by raiders.");
addHooks("Flaw", "Karui", "Tasalio", "I cannot resist proving myself against dangerous water.|I dismiss inland customs as naïve.|I hold grudges as long as the tide remembers.|I leave before others can ask me to stay.");
addHooks("Ideal", "Karui", "Ramako", "Knowledge should illuminate the path for everyone.|Diplomacy can win what arrows cannot.|Innovation honours tradition when it helps the clan flourish.|Truth should stand in full daylight.");
addHooks("Bond", "Karui", "Ramako", "I teach from a sun-marked tablet entrusted to me.|A rival diplomat once prevented a needless war.|My archery students are counting on my return.|I seek a lost method that could restore our fields.");
addHooks("Flaw", "Karui", "Ramako", "I explain when I should listen.|I assume every problem yields to reason.|I expose truths without considering who they burn.|I cannot tolerate being shown ignorant.");
addHooks("Ideal", "Karui", "Rongokurai", "Protection is strongest when danger never reaches the people.|Night offers refuge as well as fear.|Peacekeepers must understand every side.|Rest and safety are victories worth defending.");
addHooks("Bond", "Karui", "Rongokurai", "I guard a cave refuge known only to my clan.|A night patrol partner disappeared without a trace.|I promised safe passage to a former enemy.|My people entrusted me with the route home through darkness.");
addHooks("Flaw", "Karui", "Rongokurai", "I conceal dangers to keep others calm.|I am suspicious of anyone who prefers the spotlight.|I avoid open conflict until the delay makes matters worse.|I treat protection as permission to control people.");
addHooks("Ideal", "Karui", "Arohongui", "Dreams and stars reveal routes waking eyes overlook.|The moon teaches that change can still be constant.|A navigator is responsible for every soul aboard.|Mystery deserves patience rather than fear.");
addHooks("Bond", "Karui", "Arohongui", "I navigate by a star pattern my teacher alone understood.|A recurring dream points toward someone I lost.|My clan's moon chart was divided among three voyagers.|I promised to guide a stranded crew home.");
addHooks("Flaw", "Karui", "Arohongui", "A vivid dream can overturn all my plans.|I speak in riddles when plain warning is needed.|I follow uncertain signs farther than good sense allows.|I keep discoveries secret until I understand them completely.");
addHooks("Ideal", "Karui", "Hinekora", "The past speaks through every choice we make.|A true warning must be heard even when unwelcome.|The tribe survives by respecting ancestors and consequence.|Courage means facing the future without denying it.");
addHooks("Bond", "Karui", "Hinekora", "I carry a warning meant for my chieftain.|My tattoo records a debt to the Hinekora tribe.|An ancestor's unfinished task has become mine.|I protect the keeper of our tribe's remembered deaths.");
addHooks("Flaw", "Karui", "Hinekora", "I read fate into every accident.|I confuse ancestral custom with infallible law.|I withhold warnings until people prove worthy.|I would sacrifice the present to settle an old debt.");
addHooks("Ideal", "Karui", "Tawhoa", "Life flourishes when strength protects growth.|Land and people must be tended together.|Craft and patience are forms of courage.|What we take from the world must be returned.");
addHooks("Bond", "Karui", "Tawhoa", "I guard seeds from a homeland grove.|My canoe crew is my chosen family.|I must restore a place poisoned by thaumaturgy.|A Tawhoa elder taught me the craft that feeds my tribe.");
addHooks("Flaw", "Karui", "Tawhoa", "I refuse to abandon anything I have nurtured.|I distrust metalwork made outside the tribe.|I mistake patience for permission to delay.|I take every damaged living thing into my care.");
addHooks("Ideal", "Karui", "Kitava", "Need strips away the lies of civilisation.|No law deserves obedience merely because it is old.|Hunger is proof that desire rules every living thing.|Chaos creates openings that order would seal forever.");
addHooks("Bond", "Karui", "Kitava", "A secret congregation hid me when my clan cast me out.|I feed someone whose hunger mirrors my own.|I carry a forbidden carving that cannot be seen in daylight.|Another devotee knows the name I abandoned.");
addHooks("Flaw", "Karui", "Kitava", "No amount of food or power ever feels sufficient.|I interpret restraint as cowardice.|I endanger others to keep my worship secret.|I consume or destroy what I cannot possess.");
addHooks("Ideal", "Karui", "Sione", "Radiance should expose injustice and nourish hope.|Warmth shared freely makes a people strong.|Every dawn offers a chance to begin cleanly.|Power is worthy only when it gives life.");
addHooks("Bond", "Karui", "Sione", "I tend a dawn shrine built by my ancestors.|A radiant vision sent me beyond my homeland.|My clan waits for the sacred flame I carry.|I owe my recovery to a healer of Sione.");
addHooks("Flaw", "Karui", "Sione", "I mistake certainty for illumination.|I cannot leave a hidden wrong unexposed.|I burn myself out trying to sustain everyone.|I dismiss caution as fear of the light.");
addHooks("Ideal", "Karui", "Lani Lua", "Serenity makes space for truths that noise conceals.|Mystery should be approached with humility.|The moon binds distant people beneath one sky.|Dreams deserve interpretation but never blind obedience.");
addHooks("Bond", "Karui", "Lani Lua", "I keep a moonlit vigil for someone who never returned.|My teacher entrusted me with an unfinished dream-ritual.|A quiet sanctuary depends on my protection.|I carry a message revealed during the dark moon.");
addHooks("Flaw", "Karui", "Lani Lua", "I retreat into silence when action is required.|I treat ordinary coincidence as hidden design.|I conceal my feelings behind ritual calm.|I pursue mysteries that should remain undisturbed.");

addHooks("Ideal", "Kalguur", "Kalguur Expedition", "Discovery justifies hardship but never waste.|A sound fortification saves more lives than heroics.|Trade is strongest when both sides keep their word.|Innovation must be proved before it is praised.|The expedition succeeds or all of us fail.");
addHooks("Bond", "Kalguur", "Kalguur Expedition", "My crew depends on the design in my fieldbook.|A Stygian powderwright trusted me with a guarded technique.|I must return a fallen explorer's blade to their kin.|I guard the expedition's remaining sulphite powder.|A rival expedition stole my survey marks.");
addHooks("Flaw", "Kalguur", "Kalguur Expedition", "I treat people like parts in a machine.|I test dangerous designs before they are ready.|I underestimate customs I cannot measure.|I would risk a crew to preserve my reputation.|I keep too much powder too close at hand.");

addHooks("Ideal", "Stygian", "Any", "A spoken promise should be cut as deeply as a rune.|The mines remember what surface folk forget.|Useful craft is the surest proof of worth.|Our people must choose how the surface learns of us.|No secret is worth another cave-in.");
addHooks("Bond", "Stygian", "Any", "I carry a rune tablet naming a sealed gallery.|A Kalguur trader once honoured an impossible bargain.|My family maintains a ventilation shaft that saves hundreds.|I seek a missing translation of an Azmeri oath.|My clan's forge mark was stolen by a surface merchant.");
addHooks("Flaw", "Stygian", "Any", "I assume surface speech always hides an insult.|I would rather lose a bargain than explain our customs.|I keep dangerous ore because its runes intrigue me.|I speak too softly to warn others in time.|I measure every relationship as a debt.");
addHooks("Ideal", "Stygian", "Deepwardens", "Order below ground is a form of mercy.|No discovery is worth an avoidable cave-in.|A guarded tunnel protects every faction alike.|Reckless delving endangers generations not yet born.");
addHooks("Bond", "Stygian", "Deepwardens", "My watch maintains the only safe road between two enclaves.|I carry the names of workers lost when a warning was ignored.|A rival engineer helped me stop a catastrophic collapse.|I swore to seal a depth that still calls to explorers.");
addHooks("Flaw", "Stygian", "Deepwardens", "I treat every unsanctioned journey as a threat.|I enforce procedure when improvisation could save lives.|I would bury a discovery rather than risk disorder.|I mistake authority for expertise.");
addHooks("Ideal", "Stygian", "Sulphite Syndicate", "Knowledge becomes power only when it can be engineered.|Sulphite must be mastered rather than feared.|A controlled blast can save a hundred picks.|Trade is useful when Stygian secrets remain Stygian.");
addHooks("Bond", "Stygian", "Sulphite Syndicate", "My formula book contains the work of three generations.|A Kalguur engineer and I share an unfinished design.|I must prove who sabotaged a sulphite refinery.|My laboratory crew survived an explosion that should have killed us.");
addHooks("Flaw", "Stygian", "Sulphite Syndicate", "I test volatile ideas before they are ready.|I measure people by what they can build for me.|I conceal safety failures to protect the Syndicate.|I believe every problem has a technical solution.");
addHooks("Ideal", "Stygian", "Shadowborn", "The Abyss must be understood before it can consume us.|Lost Vaal knowledge belongs to those brave enough to recover it.|Darkness conceals evidence rather than evil.|No authority should forbid a question merely because it is dangerous.");
addHooks("Bond", "Stygian", "Shadowborn", "A Vaal inscription names a ruin I have seen only in dreams.|My expedition partner vanished beyond an Abyssal threshold.|I guard a fragment that changes under azurite light.|A forbidden archive contains proof my mentor was right.");
addHooks("Flaw", "Stygian", "Shadowborn", "I approach horrors as research opportunities.|I withhold discoveries from anyone I consider incurious.|I cross sealed thresholds to prove they should not be sealed.|I assume knowledge will justify whatever it cost.");
addHooks("Ideal", "Stygian", "Emberforged", "The surface is a future worth risking the climb toward.|Sulphite craft belongs only in disciplined hands.|Trade with Kalguur proves trust can be engineered.|Oris's compact must outlast any single leader.|A guarded route can connect worlds without surrendering either.");
addHooks("Bond", "Stygian", "Emberforged", "My crew shares the mark of our first surface expedition.|I must deliver a powder ledger to a Kalguur factor.|A Steelhand decree saved my family's claim.|I maintain an illicit contact in Oriath.|My apprentice vanished along a surface trade route.");
addHooks("Flaw", "Stygian", "Emberforged", "I test loyalty with needless secrecy.|I idealise a surface I barely understand.|I cannot forgive anyone who wastes sulphite.|I conceal a flaw in an important trade batch.|I risk others to keep a smuggling route open.");
addHooks("Ideal", "Stygian", "Hollowed Vein", "What was lost below must not be erased above.|Survival is proof enough when history calls you broken.|No faction owns the truth of our disappearance.|The abandoned deserve guides, not judgement.|A hidden path is freedom.");
addHooks("Bond", "Stygian", "Hollowed Vein", "I have a map drawn by the last returning scout.|A voice in a sealed gallery knows my childhood name.|I search for the descendants of my lost delve-team.|I carry the broken rune of our final assembly.|An Emberforged miner secretly supplies my people.");
addHooks("Flaw", "Stygian", "Hollowed Vein", "I vanish rather than explain myself.|I hear instructions in ordinary cave sounds.|I sabotage marked routes to keep them secret.|I reject help that carries Emberforged authority.|I would reopen a cursed gallery for proof.");

const drives = [];
const addDrives = (category, parent, subParent, values, weight = 1) => addValues(drives, category, parent, subParent, split(values), weight);
addDrives("Goal", "Any", "Any", "Find a missing relative before the trail goes cold.|Secure safe passage for a vulnerable traveller.|Earn enough coin to clear a dangerous debt.|Recover a stolen keepsake with no obvious monetary value.|Expose the person sabotaging their work.|Reach a settlement before worsening weather closes the route.|Obtain medicine that cannot be bought locally.|Convince someone powerful to hear an unwelcome truth.|Repair a damaged refuge before nightfall.|Leave their current employer without retaliation.|Return a body or token to its community.|Learn whether a recurring rumour is true.");
addDrives("Problem", "Any", "Any", "Someone is following them but has not yet acted.|Their travel papers or credentials are false.|A dependent has vanished after an argument.|They promised the same valuable object to two people.|An untreated wound is becoming dangerous.|Their supplies were stolen during the previous night.|A witness has mistaken them for someone else.|They are carrying an item that attracts corrupted creatures.|Their employer has stopped answering messages.|A route they guaranteed safe is now blocked.|They have discovered evidence they cannot safely keep.|A former ally is demanding repayment at the worst possible time.");
addDrives("Secret", "Any", "Any", "They know the official account of a recent death is false.|They once served the faction they now condemn.|They possess a map copied from a forbidden source.|Their apparent family name is borrowed.|They caused an accident blamed on someone else.|They have been feeding information to protect a captive.|They recognised a supposedly unknown relic immediately.|Their injury came from an ally rather than an enemy.|They are planning to disappear after completing one final duty.|They have hidden symptoms of corruption.|They stole the resources used to help their community.|They have already met the person everyone is searching for.");
addDrives("Knowledge", "Any", "Any", "A safe route that avoids the main road.|Which local official accepts bribes and which does not.|Where supplies were cached before the last evacuation.|The identifying mark used by a nearby smuggling network.|Why a recently abandoned camp was left intact.|Which ruin is occupied despite appearing empty.|A password that was valid within the last week.|The real source of a shortage blamed on outsiders.|A creature's predictable hunting pattern.|The location of an unrecorded shrine or memorial.|Which two local leaders secretly communicate.|The warning sign that appears before a nearby hazard.");
addDrives("Offer", "Any", "Any", "A defensible place to rest for one night.|An introduction to a cautious local contact.|A hand-drawn route map with one uncertain section.|Basic treatment and clean bandages.|A small cache of food and lamp oil.|A convincing disguise suited to local labour.|Translation of a short inscription or coded message.|A rumour they can partially verify.|Repair of ordinary weapons, armour or tools.|A temporary escort through familiar territory.|A favour owed by a minor official.|First choice from goods they are not supposed to possess.");
addDrives("Disposition", "Any", "Any", "Wary but willing to listen.|Friendly until authority is mentioned.|Hurried and initially dismissive.|Polite while carefully assessing every answer.|Openly relieved to see capable outsiders.|Suspicious of the party's motives.|Eager to trade information rather than coin.|Defensive because they expect an accusation.|Calmly professional and difficult to impress.|Warm toward anyone who helps first.|Afraid but attempting to appear composed.|Amused by the party and willing to indulge them.");

const culturalDrives = {
  Oriathan: {
    Goal: "Restore their household's legal standing.|Obtain a sealed civic record before it is altered.|Move relatives out of a district marked for Templar action.|Prove that a public official is working for the Ring.",
    Problem: "Their family is divided between Templar and civic loyalties.|A magistrate has frozen their property without charge.|Their accent reveals a background they are concealing.|A militia patrol keeps returning to search their rooms.",
    Secret: "Their household once profited from Karui slavery.|They forged a priest's authorisation seal.|They know which patrician finances a Ring crew.|Their family archives contradict an accepted Templar history.",
    Knowledge: "The service passages beneath an Oriathan civic building.|Which militia ward is controlled by the Ring.|How legion supply orders are authenticated.|The identity of a Templar using their discarded birth-name.",
    Offer: "A temporary civic permit bearing a genuine seal.|Lodging in a discreet Oriathan household.|An introduction to a militia sergeant or junior clerk.|Clothing and manners suitable for passing as household staff.",
    Disposition: "Formally courteous but conscious of status.|Relieved the party is not another official delegation.|Testing whether the party respects Oriathan law.|Cautiously sympathetic to anyone harmed by the Templars."
  },
  Azmeri: {
    Goal: "Protect a grove threatened by careless scavengers.|Carry an oral history to another scattered settlement.|Recover medicinal plants before corruption reaches them.|Reconcile two families before a seasonal gathering.",
    Problem: "A trusted forest sign now points in two directions.|Their community blames an outsider they believe innocent.|An old shrine has begun answering prayers incorrectly.|Their best hunter has not returned from a familiar path.",
    Secret: "They guided bandits through a route used by refugees.|They removed an artefact from a place declared sacred.|They can read more Eternal script than their elders know.|They believe an honoured local story deliberately hides a betrayal.",
    Knowledge: "Which plants remain safe near corrupted ground.|A concealed ford usable after heavy rain.|The call used by a nearby Azmeri watch.|Which forest ruin predates the Eternal Empire.",
    Offer: "A hidden woodland shelter stocked for winter.|A herbal treatment for fatigue or fever.|Guidance through paths absent from imperial maps.|A trusted introduction at the Forest Encampment.",
    Disposition: "Quietly hospitable after customary greetings.|Protective of local knowledge around outsiders.|Curious whether the party listens more than it speaks.|Initially cold toward anyone displaying imperial symbols."
  },
  Ezomyte: {
    Goal: "Settle an old clan debt without renewing the feud.|Recover a song-tablet taken from a ruined hold.|Prove the safety of a mine others have abandoned.|Deliver the last work of a dead clan poet.",
    Problem: "Two oaths demand incompatible actions.|Their clan rejects a warning from a traditional enemy.|A tunnel collapse exposed something deliberately buried.|Their tools bear a maker's mark associated with treason.",
    Secret: "They broke a clan oath to save a captive.|They know a celebrated ancestor surrendered willingly.|They have sold ore from a forbidden seam.|Their version of a famous ballad names a different killer.",
    Knowledge: "How to identify unsafe stone by sound.|A clan challenge that can delay formal violence.|Where a rebel cache survived the Purity Rebellion.|The verse that proves ownership of a disputed heirloom.",
    Offer: "Repair by a skilled clan craftsperson.|Shelter within a guarded mine community.|A formal oath of safe conduct.|A song carrying news faster than written messages.",
    Disposition: "Bluntly welcoming once names are exchanged.|Sceptical until the party demonstrates practical skill.|Ready to argue but slow to take genuine offence.|Respectful toward anyone who keeps an inconvenient promise."
  },
  Maraketh: {
    Goal: "Bring a delayed caravan safely to water.|Win permission to change an akhara custom.|Locate a rider lost beyond the marked route.|Repay hospitality received from a rival caravan.",
    Problem: "Their water tally does not match the remaining stores.|A rhoa refuses to approach the next camp.|They carry orders disputed by two senior riders.|A dust storm erased the route markers they placed.",
    Secret: "They have sheltered a Faridun against orders.|They falsified a caravan pedigree to gain rank.|They know a Sekhema's public challenge was staged.|Their tattoos conceal an older mark of shame.",
    Knowledge: "A water source omitted from common route maps.|The greeting required by a suspicious akhara.|How to tell a true sandstorm from thaumaturgic weather.|Which caravan secretly trades with Oriathan smugglers.",
    Offer: "A place within a guarded caravan.|Fresh mounts and an experienced outrider.|A water-right recognised by nearby akharas.|An introduction to a caravan factor or healer.",
    Disposition: "Reserved until hospitality has been formally exchanged.|Directly assessing the party's supplies and readiness.|Warm toward competent travellers.|Alert for disrespect toward Maraketh custom."
  },
  Karui: {
    Goal: "Return a funerary token to its god-clan.|Prevent a challenge from becoming a blood feud.|Find a safe harbour for an approaching canoe fleet.|Recover a carving that records a disputed lineage.",
    Problem: "An omen has been interpreted differently by two elders.|Their warband refuses a necessary retreat.|A clan guest vanished while under their protection.|Their inherited grievance targets someone who saved them.",
    Secret: "They changed clans without completing the expected rites.|They know an ancestral victory was actually negotiated.|They have spoken with a devotee of Kitava in secret.|They broke a tapu to save an outsider.",
    Knowledge: "A challenge formula that allows both sides to withdraw with honour.|The landing place used by a hidden war canoe.|Which clan elder privately favours negotiation.|A funerary custom that identifies a false Karui claimant.",
    Offer: "Formal guest-right under their clan's protection.|A skilled navigator for coastal travel.|A carved token recognised by another god-clan.|Instruction in a Karui challenge or greeting ritual.",
    Disposition: "Direct and attentive to signs of courage.|Warm after the party observes basic hospitality.|Guarded around anyone wearing Oriathan insignia.|Curious whether outsiders understand clan responsibility."
  },
  Vaal: {
    Goal: "Complete a celestial calculation before the next conjunction.|Prevent a court sacrifice selected through false records.|Recover a stolen component from a gem-engine.|Present evidence that a revered experiment is failing.",
    Problem: "Their calculations predict an impossible result.|A construct obeys an unknown second authority.|Their patron demands a successful demonstration too soon.|A rival has inserted false glyphs into their work.",
    Secret: "They removed a name from a sacrificial register.|They have corresponded with an enemy court faction.|Their discovery depends on proscribed work by Zerphi's contemporaries.|They know a temple miracle is engineered.",
    Knowledge: "The shutdown sequence for a common Vaal mechanism.|Which calendar glyph marks deliberately omitted days.|A court sign indicating someone is under observation.|The safe interval between pulses of a gem circuit.",
    Offer: "A charged but limited Vaal ward.|Accurate translation of a glyph sequence.|Access to a minor archive or observatory.|A court token granting temporary passage.",
    Disposition: "Intellectually curious but socially remote.|Concerned chiefly with whether the party will disrupt the work.|Formal and conscious of court protocol.|Fascinated by people from outside the expected historical record."
  },
  Kalguur: {
    Goal: "Finish a survey before a rival expedition claims it.|Return a recovered rune-stone to the correct lineage.|Prove a Stygian powder design can be transported safely.|Locate a crew missing from an abandoned dig.",
    Problem: "Their measurements disagree with every known map.|A critical rune-tool was replaced with a convincing copy.|The expedition leader is concealing its true losses.|Their family expects a discovery worthy of a lineage song.",
    Secret: "They privately trade findings with the Stygians.|They erased evidence that an ancestor failed an expedition.|Their most successful design copies a Vaal mechanism.|They intend to defect rather than return to Aesclast.",
    Knowledge: "How to identify a genuine Kalguuran expedition marker.|The location of a sealed Stygian trade cache.|Which runes indicate structural stress rather than ownership.|A northern sailing method unknown to local pilots.",
    Offer: "Precise surveying of a route or structure.|Repair of runed or mechanical equipment.|A place with a Kalguuran expedition crew.|Controlled access to a small quantity of black powder.",
    Disposition: "Coolly professional and attentive to competence.|Friendly but unwilling to discuss expedition objectives.|Impatient with claims unsupported by evidence.|More interested in the party's equipment than its reputation."
  },
  Stygian: {
    Goal: "Open a safe route to the surface without exposing the enclave.|Recover a rune record from a collapsed gallery.|Stop an unsafe sulphite process before it spreads.|Find a missing traveller from the Hollowed Vein.",
    Problem: "Their lamp supply has been deliberately contaminated.|A surface word they mistranslated caused a serious offence.|Their faction has sealed the route they need.|A familiar tunnel now carries an impossible echo.",
    Secret: "They have visited the surface without permission.|They sold a powder sample to someone other than the Kalguur.|Their family descends from a proscribed Eternal official.|They can understand a voice heard only near the Lightless depths.",
    Knowledge: "The rune sequence marking a structurally safe gallery.|A ventilation path that bypasses a faction checkpoint.|Which Kalguur factor can be trusted with powder trade.|The accented-Azmeri phrase used to invoke an old mine compact.",
    Offer: "A safe lamp and instructions for keeping it lit.|A guide through mapped sections of the Azurite Mines.|Repair of stonework, runes or powder equipment.|A guarded introduction to a Stygian trade contact.",
    Disposition: "Carefully formal with surface strangers.|Interested but alert for mockery of their accent.|More trusting underground than beneath open sky.|Relieved to meet outsiders who respect negotiated boundaries."
  }
};
for (const [culture, categories] of Object.entries(culturalDrives)) {
  for (const [category, values] of Object.entries(categories)) addDrives(category, culture, "Any", values, 2);
}

const militiaDrives = {
  Goal: "Identify the Ring paymaster inside their wardhouse.|Bring a violent constable to trial without the evidence disappearing.|Keep a street festival peaceful despite Templar provocation.|Find a missing patrol before the watch captain writes them off.|Earn enough trust to command a permanent neighbourhood post.|Move civilians out of a district before a legion sweep begins.",
  Problem: "Their patrol roster was altered after they signed it.|The only witness is protected by the Ring.|A Templar officer has ordered an arrest without a charge.|Their partner has started accepting increasingly serious bribes.|The wardhouse armoury is missing weapons before a riot.|Residents know the badge but no longer trust the person wearing it.",
  Secret: "They accepted Ring money once to pay for medicine.|They destroyed evidence to prevent a wrongful Templar execution.|Their captain falsifies crime figures for Theopolis officials.|They are sheltering a wanted former constable.|They warned a neighbourhood before an authorised raid.|Their promotion came through a patrician favour they did not request.",
  Knowledge: "Which alleys a full legion patrol cannot enter in formation.|The watchword used at Oriath's civic lockups this week.|Which militia officers are loyal to the Ring.|Where confiscated weapons are stored before auction.|The patrol timing around a restricted harbour gate.|Which magistrate still reviews militia misconduct honestly.",
  Offer: "A temporary militia escort through a tense district.|A genuine copy of a patrol warrant.|Access to a wardhouse holding cell or evidence room.|A badge-backed introduction to a local shopkeeper network.|A warning before the next Templar street sweep.|The location of an unregistered civic safehouse.",
  Disposition: "Professionally helpful while watching for signs of bribery.|Defensive about the militia's poor reputation.|Relieved to meet outsiders with no wardhouse loyalties.|Suspicious that the party is working for the Templars.|Friendly in public but guarded when colleagues can hear.|Quietly testing whether the party protects ordinary residents."
};
for (const [category, values] of Object.entries(militiaDrives)) {
  addDrives(category, "Oriathan", "Oriath Militia", values, 3);
}

const presets = {
  schemaVersion: 3,
  presets: [
    { id: "general", label: "All Wraeclast", description: "A broad 1599 IC Wraeclast mix; ancient Vaal are excluded unless selected.", cultures: { Oriathan: 29, Azmeri: 15, Ezomyte: 13, Maraketh: 12, Karui: 13, Kalguur: 10, Stygian: 8 }, eras: { "1599 IC": 100 }, locations: { "Wraeclast road or wilderness": 25, "Lioneye's Watch": 10, "Forest Encampment": 13, "Sarn Slums": 12, "Sarn Arena": 8, "Sarn Docks": 8, "Sarn Upper City": 5, "Highgate and the Vastiri": 7, "Kalguur expedition camp": 5, "Azurite Mines": 7 } },
    { id: "sarn_survivor", label: "Sarn survivor", description: "Civilians, refugees, opportunists, militia and occupiers around ruined Sarn.", cultures: { Oriathan: 48, Azmeri: 17, Ezomyte: 10, Maraketh: 8, Karui: 7, Kalguur: 5, Stygian: 5 }, socialOrigins: { Refugee: 30, Native: 20, Exile: 15, Diaspora: 8, "Mixed heritage": 5, "Urban poor": 12, "Displaced survivor": 10 }, eras: { "1599 IC": 100 }, locations: { "Sarn Slums": 35, "Sarn Arena": 25, "Sarn Docks": 20, "Sarn Upper City": 10, "Wraeclast road or wilderness": 10 } },
    { id: "oriathan_occupier", label: "Oriathan occupier", description: "Templar, legion, militia and Ring presence in and around Sarn.", cultures: { Oriathan: 100 }, affiliations: { Oriathan: { Templar: 55, "Oriath Militia": 20, "The Ring": 10, Unaffiliated: 15 } }, eras: { "1599 IC": 100 }, locations: { "Sarn Upper City": 45, "Sarn Docks": 20, "Sarn Slums": 15, "Sarn Arena": 10, "Wraeclast road or wilderness": 10 } },
    { id: "theopolis", label: "Theopolis and Oriath", description: "Residents, militia, Templars and criminal interests across Oriath.", cultures: { Oriathan: 90, Karui: 3, Ezomyte: 2, Maraketh: 2, Azmeri: 1, Kalguur: 1, Stygian: 1 }, affiliations: { Oriathan: { Unaffiliated: 40, "Oriath Militia": 28, Templar: 22, "The Ring": 10 } }, eras: { "1599 IC": 100 }, locations: { Theopolis: 75, "Oriath port town": 25 } },
    { id: "forest_encampment", label: "Forest Encampment", description: "Azmeri locals, Ezomyte neighbours, exiles, and travellers.", cultures: { Azmeri: 47, Ezomyte: 22, Oriathan: 10, Maraketh: 7, Karui: 6, Kalguur: 4, Stygian: 4 }, socialOrigins: { Native: 38, Refugee: 18, Exile: 14, Diaspora: 8, "Mixed heritage": 4, "Displaced survivor": 10, Nomad: 8 }, eras: { "1599 IC": 100 }, locations: { "Forest Encampment": 85, "Wraeclast road or wilderness": 15 } },
    {
      id: "karui_tribe",
      label: "Karui clans",
      description: "Karui drawn from every god-clan in the campaign pantheon.",
      cultures: { Karui: 100 },
      affiliations: { Karui: { Karui: 100 } },
      eras: { "1599 IC": 100 },
      locations: { "Karui Archipelago": 85, "Wraeclast road or wilderness": 15 },
      branches: {
        Karui: {
          Tukohama: 12, Ngamahu: 11, Valako: 9, Tasalio: 8, Ramako: 9, Rongokurai: 6,
          Arohongui: 4, Tawhoa: 10, Kitava: 2, Hinekora: 10, Sione: 4, "Lani Lua": 5,
          Unaffiliated: 10
        }
      }
    },
    { id: "kalguur_expedition", label: "Kalguur expedition", description: "High-elven explorers, engineers, soldiers, and powder specialists.", cultures: { Kalguur: 100 }, affiliations: { Kalguur: { "Kalguur Expedition": 90, Unaffiliated: 10 } }, eras: { "1599 IC": 100 }, locations: { "Kalguur expedition camp": 90, "Wraeclast road or wilderness": 10 } },
    {
      id: "stygian_mines",
      label: "Stygian mines",
      description: "Drow, duergar, and deep gnomes across all five internal Stygian factions.",
      cultures: { Stygian: 100 },
      affiliations: { Stygian: { Stygian: 100 } },
      eras: { "1599 IC": 100 },
      locations: { "Azurite Mines": 100 },
      branches: {
        Stygian: {
          Deepwardens: 25, "Sulphite Syndicate": 22, Shadowborn: 13,
          Emberforged: 18, "Hollowed Vein": 10, Unaffiliated: 12
        }
      },
      socialOrigins: { Native: 65, Diaspora: 10, Refugee: 15, Exile: 7, "Mixed heritage": 3 }
    },
    { id: "vaal_historical", label: "Ancient Vaal", description: "A historical Vaal gnome from before the civilisation's fall.", cultures: { Vaal: 100 }, affiliations: { Vaal: { Unaffiliated: 100 } }, socialOrigins: { Native: 75, Diaspora: 5, Exile: 5, "Religious household": 5, "Merchant household": 5, "Military household": 5 }, eras: { "Ancient Vaal": 100 }, locations: { "Ancient Vaal city": 100 } }
  ]
};

const factions = {
  schemaVersion: 1,
  checkedAgainstNotion: "2026-10-04",
  sourceDatabase: "Campaign Factions database",
  factions: [
    { id: "oriath.templar", label: "Templar", type: "affiliation", culture: "Oriathan", sourceEntry: "Order Templar" },
    { id: "oriath.militia", label: "Oriath Militia", type: "affiliation", culture: "Oriathan", sourceEntry: "Militia" },
    { id: "oriath.ring", label: "The Ring", type: "affiliation", culture: "Oriathan", sourceEntry: "The Ring" },
    { id: "kalguur.expedition", label: "Kalguur Expedition", type: "affiliation", culture: "Kalguur", sourceEntry: "Wraeclast Cultures" },
    { id: "karui", label: "Karui", type: "affiliation", culture: "Karui", sourceEntry: "Wraeclast Cultures" },
    ...Object.keys(branchPools.Karui.values).filter((label) => label !== "Unaffiliated").map((label) => ({
      id: `karui.${label.toLowerCase().replaceAll(" ", "-")}`,
      label,
      type: "branch",
      culture: "Karui",
      parentId: "karui",
      sourceEntry: ["Hinekora", "Tawhoa"].includes(label) ? label : "Wraeclast Cultures"
    })),
    { id: "stygian", label: "Stygian", type: "affiliation", culture: "Stygian", sourceEntry: "Stygian / Azurite Miners" },
    ...Object.keys(branchPools.Stygian.values).filter((label) => label !== "Unaffiliated").map((label) => ({
      id: `stygian.${label.toLowerCase().replaceAll(" ", "-")}`,
      label,
      type: "branch",
      culture: "Stygian",
      parentId: "stygian",
      sourceEntry: "Stygian / Azurite Miners"
    }))
  ]
};

await Promise.all([
  writeFile(path.join(dataDir, "main_tables.csv"), csv(main), "utf8"),
  writeFile(path.join(dataDir, "names.csv"), csv(names), "utf8"),
  writeFile(path.join(dataDir, "descriptors.csv"), csv(descriptors, ["Category", "Parent", "SubParent", "Value", "Weight", "Species", "Ages", "ProfessionCategories"]), "utf8"),
  writeFile(path.join(dataDir, "professions.csv"), csv(professions), "utf8"),
  writeFile(path.join(dataDir, "hooks.csv"), csv(hooks), "utf8"),
  writeFile(path.join(dataDir, "drives.csv"), csv(drives), "utf8"),
  writeFile(path.join(dataDir, "presets.json"), `${JSON.stringify(presets, null, 2)}\n`, "utf8"),
  writeFile(path.join(dataDir, "factions.json"), `${JSON.stringify(factions, null, 2)}\n`, "utf8")
]);

console.log(`Wrote ${main.length} main rows, ${names.length} names, ${descriptors.length} descriptors, ${professions.length} professions, ${hooks.length} hooks, and ${drives.length} narrative drives.`);

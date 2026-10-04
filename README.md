# Wraeclast NPC Generator

A Foundry VTT 13 module for generating lore-aware NPCs for a Wraeclast D&D campaign. Version 2.3 adds ordained Templar naming, the Oriath Militia, structured descriptions, immediately playable motives, era/location context, editing history, local data overrides, and capability-based Actor templates.

## Install in Foundry

In Foundry's **Add-on Modules** screen, choose **Install Module**, paste this manifest URL, and select **Install**:

```text
https://github.com/Yax74/wraeclast-npc-gen/releases/latest/download/module.json
```

Foundry will use the same manifest URL to discover future releases. Enable the module from **Manage Modules** inside the world after installation.

## Use

1. Enable **Wraeclast NPC Generator** in a Foundry VTT 13 world.
2. Open the **Journal** sidebar and click **NPC Generator**, or run `game.wraeclastGen.open()` in the console.
3. Choose a campaign preset or lock individual fields.
4. Generate one NPC preview.
5. Reroll its name, profession, appearance, personality, hooks, or immediate-use details independently.
6. Edit any generated text in place; undo and redo preserve the preview's change history.
7. Explicitly send the result to chat, save it as a Journal Entry, create a D&D 5e NPC Actor, or copy it as text.

The module never posts or creates documents merely because **Generate preview** was clicked.

## Campaign model

- **Oriathan:** Human-majority. Templar, Oriath Militia, and The Ring are separate affiliations, not cultures. Templar results include the Ebony/Primis, Crimson/Secundo, both Sarn Azure/Tertius legions, Emerald/Quartus, and Archivists. Ordained Templars renounce their birth names and use a bestowed virtue-name such as `Templar Vigilance`; lay legion personnel retain ordinary Roman/Greek-style Oriathan names. Unlocked Emerald results use an approximately even human/non-human recruitment mix.
- **Azmeri:** Human-majority survivors and forest communities.
- **Ezomyte:** Dwarf-majority, with Scottish/Gaelic-inspired names.
- **Maraketh:** Halfling-majority, with Arabic/Persian-inspired names.
- **Karui:** Half-orc-majority, Māori-inspired culture. The Karui parent faction branches into a clan for each campaign god: Tukohama, Ngamahu, Valako, Tasalio, Ramako, Rongokurai, Arohongui, Tawhoa, Kitava, Hinekora, Sione, and Lani Lua.
- **Vaal:** Gnome-majority and available through the historical Ancient Vaal preset or a direct culture selection.
- **Kalguur:** High-elf-majority explorers in angular, spiked equipment. Their black-powder specialists reflect guarded trade with the Stygians.
- **Stygian:** Drow, duergar, and deep gnomes of the Azurite Mines. The Stygian parent faction branches into the Deepwardens, Sulphite Syndicate, Shadowborn, Emberforged, and Hollowed Vein. Their content includes sulphite black-powder trades, rune lore, Kalguur links, surface ambitions, and accented-Azmeri voice descriptors.

Named GGG and campaign figures are excluded from random name pools. The cultural and source-material review is recorded in [docs/name-audit.md](docs/name-audit.md).
Branch weights are generation tuning informed by the campaign notes, not asserted population counts.

## Content depth

- **870 name entries:** 490 first names, 340 surnames, and 40 ordained Templar virtue-names; every culture has at least 60 first names and 40 surnames.
- **691 professions:** broad common occupations plus culture-, faction-, expedition-, legion-, militia-, and clan-specific work.
- **860 descriptors:** the earlier freeform library plus dedicated build, facial/features, attire, and distinguishing-mark pools. Structured entries can be restricted by species, age, and profession.
- **480 cultural hooks:** ideals, bonds, and flaws for every culture and named faction branch.
- **300 immediate-use prompts:** goals, problems, secrets, knowledge, offers, and starting dispositions.
- Every culture has its own weighted voice pool while retaining access to broadly applicable voices.
- Cultural professions supplement the general profession library rather than replacing it, keeping results distinctive without becoming repetitive.

## Presets

- All Wraeclast
- Sarn survivor
- Oriathan occupier
- Theopolis and Oriath
- Forest Encampment
- Karui clans
- Kalguur expedition
- Stygian mines
- Ancient Vaal

Preset weights apply only where a field has not been explicitly locked.

## Settings

Module settings control the Journal and Actor folder names, the Journal sidebar launcher, the default preset, and default chat visibility.

`Actor templates by capability` accepts a JSON object mapping `Civilian`, `Skilled`, `Trained`, `Veteran`, or `Elite` to an Actor UUID. When a mapping exists, **Create Actor** duplicates that Actor and replaces its name, biography, folder, and generator flags. Without a mapping it creates the same blank D&D 5e NPC Actor as before.

`Custom generator data` accepts JSON additions/replacements without editing module files. Rows with the same category, parent, sub-parent, and value replace bundled rows; new identities are appended. For example:

```json
{
  "add": {
    "names": [
      { "category": "Name", "parent": "Oriathan", "subParent": "The Ring", "value": "LocalName", "weight": 2 }
    ]
  }
}
```

Supported override tables are `main`, `names`, `descriptors`, `professions`, `hooks`, and `drives`; `presets` may also be added or replaced by ID. Use `game.wraeclastGen.reload()` after changing overrides if the generator is already open.

Actor creation is shown only in a D&D 5e world. All other generator features are system-neutral.

## Macro API

```js
// Open the application
game.wraeclastGen.open();

// Generate without opening the UI
const npc = await game.wraeclastGen.generateNPC({
  preset: "stygian_mines",
  affiliation: "Stygian",
  branch: "Emberforged"
});

// Batch generation remains available to existing macros, but is not part of the normal UI
const group = await game.wraeclastGen.generateBatch(5, {
  preset: "forest_encampment"
});

// Reload after changing world-local overrides, then validate all data files
await game.wraeclastGen.reload();
await game.wraeclastGen.validate();
```

Supported constraint keys are `preset`, `culture`, `affiliation`, `branch`, `species`, `socialOrigin`, `age`, `alignment`, `professionCategory`, `location`, `era`, and `capabilityTier`. For compatibility, the old flattened `affiliation` values `Hinekora`, `Tawhoa`, `Emberforged`, and `Hollowed Vein` are automatically migrated to their correct parent faction and branch.

For compatibility with the original module, `game.wraeclastGen.generate()` with no argument also opens the generator. Passing a constraint object returns one generated NPC.

## Data and validation

Generator content lives in `data/*.csv`; preset weights live in `data/presets.json`, and stable public faction IDs live in `data/factions.json`. CSV parsing supports quoted commas and escaped quotes, and HTTP/data failures are reported rather than silently replaced with generic results.

For development:

```bash
npm test
npm run check
npm run build:data
```

The test suite validates compatibility rules, pool depth, reserved names, contradictory descriptors, and cultural variety, then simulates tens of thousands of NPCs across every preset.

## Publishing an update

1. Update the version in `module.json` and `package.json`.
2. Update `module.json`'s versioned `download` URL and add release notes to `CHANGELOG.md`.
3. Commit the changes and create a GitHub release whose tag is `v` followed by that version, such as `v2.3.0`.
4. The release workflow validates the tag, runs the test suite, and attaches `module.json`, `wraeclast-npc-gen.zip`, and a SHA-256 checksum to the release.

If a release job needs to be rerun, start **Build release assets** from the Actions tab and supply the existing release tag.

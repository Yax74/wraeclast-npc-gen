# Wraeclast NPC Generator

A Foundry VTT 13 module for generating lore-aware NPCs for a Wraeclast D&D campaign. Version 2.2 models culture, parent faction, and clan/subfaction as separate levels, provides substantially expanded identity and description pools, prevents incompatible selections, and previews results before publishing them.

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
4. Generate one to ten previews.
5. Reroll any preview's name, profession, appearance, personality, or hooks.
6. Explicitly send a result to chat, save it as a Journal Entry, create a D&D 5e NPC Actor, or copy it as text.

The module never posts or creates documents merely because **Generate preview** was clicked.

## Campaign model

- **Oriathan:** Human-majority. Templar and The Ring are affiliations, not separate cultures. Templar results include the Ebony/Primis, Crimson/Secundo, both Sarn Azure/Tertius legions, Emerald/Quartus, and Archivist branches. Unlocked Emerald results use an approximately even human/non-human recruitment mix.
- **Azmeri:** Human-majority survivors and forest communities.
- **Ezomyte:** Dwarf-majority, with Scottish/Gaelic-inspired names.
- **Maraketh:** Halfling-majority, with Arabic/Persian-inspired names.
- **Karui:** Half-orc-majority, Māori-inspired culture. The Karui parent faction branches into a clan for each campaign god: Tukohama, Ngamahu, Valako, Tasalio, Ramako, Rongokurai, Arohongui, Tawhoa, Kitava, Hinekora, Sione, and Lani Lua.
- **Vaal:** Gnome-majority and available through the historical Ancient Vaal preset or a direct culture selection.
- **Kalguur:** High-elf-majority explorers in angular, spiked equipment. Their black-powder specialists reflect guarded trade with the Stygians.
- **Stygian:** Drow, duergar, and deep gnomes of the Azurite Mines. The Stygian parent faction branches into the Deepwardens, Sulphite Syndicate, Shadowborn, Emberforged, and Hollowed Vein. Their content includes sulphite black-powder trades, rune lore, Kalguur links, surface ambitions, and accented-Azmeri voice descriptors.

Named campaign figures and titles are excluded from random name pools.
Branch weights are generation tuning informed by the campaign notes, not asserted population counts.

## Content depth

- **830 names:** every culture has at least 60 first names and 40 surnames.
- **659 professions:** broad common occupations plus culture-, faction-, expedition-, legion-, and clan-specific work.
- **598 descriptors:** 137 appearance traits, 92 demeanors, 89 attitudes, 162 voices, and 118 mannerisms.
- Every culture has its own weighted voice pool while retaining access to broadly applicable voices.
- Cultural professions supplement the general profession library rather than replacing it, keeping results distinctive without becoming repetitive.

## Presets

- All Wraeclast
- Sarn survivor
- Oriathan occupier
- Forest Encampment
- Karui clans
- Kalguur expedition
- Stygian mines
- Ancient Vaal

Preset weights apply only where a field has not been explicitly locked.

## Settings

Module settings control the Journal and Actor folder names, the Journal sidebar launcher, the default preset, and default chat visibility.

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

// Generate up to ten NPCs
const group = await game.wraeclastGen.generateBatch(5, {
  preset: "forest_encampment"
});

// Reload and validate all data files
await game.wraeclastGen.validate();
```

Supported constraint keys are `preset`, `culture`, `affiliation`, `branch`, `species`, `socialOrigin`, `age`, `alignment`, and `professionCategory`. For compatibility, the old flattened `affiliation` values `Hinekora`, `Tawhoa`, `Emberforged`, and `Hollowed Vein` are automatically migrated to their correct parent faction and branch.

For compatibility with the original module, `game.wraeclastGen.generate()` with no argument also opens the generator. Passing a constraint object returns one generated NPC.

## Data and validation

Generator content lives in `data/*.csv`; preset weights live in `data/presets.json`. CSV parsing supports quoted commas and escaped quotes, and HTTP/data failures are reported rather than silently replaced with generic results.

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
3. Commit the changes and create a GitHub release whose tag is `v` followed by that version, such as `v2.1.0`.
4. The release workflow validates the tag, runs the test suite, and attaches `module.json`, `wraeclast-npc-gen.zip`, and a SHA-256 checksum to the release.

If a release job needs to be rerun, start **Build release assets** from the Actions tab and supply the existing release tag.

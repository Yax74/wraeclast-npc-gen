# Wraeclast NPC Generator

A Foundry VTT 13 module for generating lore-aware NPCs for a Wraeclast D&D campaign. Version 2.0 separates culture from affiliation, prevents incompatible selections, previews results before publishing them, and adds full Stygian support.

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
- **Karui:** Half-orc-majority, Māori-inspired culture, with Hinekora and Tawhoa tribal affiliations.
- **Vaal:** Gnome-majority and available through the historical Ancient Vaal preset or a direct culture selection.
- **Kalguur:** High-elf-majority explorers in angular, spiked equipment. Their black-powder specialists reflect guarded trade with the Stygians.
- **Stygian:** Drow, duergar, and deep gnomes of the Azurite Mines. Includes the Emberforged and lost Hollowed Vein factions, sulphite black-powder trades, rune lore, Kalguur trade hooks, and accented-Azmeri voice descriptors.

Named campaign figures and titles are excluded from random name pools.

## Presets

- All Wraeclast
- Sarn survivor
- Oriathan occupier
- Forest Encampment
- Karui tribes
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
  affiliation: "Emberforged"
});

// Generate up to ten NPCs
const group = await game.wraeclastGen.generateBatch(5, {
  preset: "forest_encampment"
});

// Reload and validate all data files
await game.wraeclastGen.validate();
```

Supported constraint keys are `preset`, `culture`, `affiliation`, `species`, `socialOrigin`, `age`, `alignment`, and `professionCategory`.

For compatibility with the original module, `game.wraeclastGen.generate()` with no argument also opens the generator. Passing a constraint object returns one generated NPC.

## Data and validation

Generator content lives in `data/*.csv`; preset weights live in `data/presets.json`. CSV parsing supports quoted commas and escaped quotes, and HTTP/data failures are reported rather than silently replaced with generic results.

For development:

```bash
npm test
npm run check
npm run build:data
```

The test suite validates compatibility rules and reserved names, then simulates tens of thousands of NPCs across every preset.

## Publishing an update

1. Update the version in `module.json` and `package.json`.
2. Update `module.json`'s versioned `download` URL and add release notes to `CHANGELOG.md`.
3. Commit the changes and create a GitHub release whose tag is `v` followed by that version, such as `v2.1.0`.
4. The release workflow validates the tag, runs the test suite, and attaches `module.json`, `wraeclast-npc-gen.zip`, and a SHA-256 checksum to the release.

If a release job needs to be rerun, start **Build release assets** from the Actions tab and supply the existing release tag.

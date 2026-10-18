# Wraeclast NPC Generator

A Foundry VTT 13 module for generating lore-aware NPCs for a Wraeclast D&D campaign. Version 2.5 adds culture-specific fragment-built names, section pins, recent-result repetition control, compact table output, and an optional Monster Forge handoff on top of version 2.4's Maraketh expansion.

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
4. Choose **Curated names**, **Mixed (50/50)**, or **Fragment-built names**. Fragment-built names may use Auto, 2, 3, or 4 fragments.
5. Choose **Full dossier** or **Table card** output, then generate one NPC preview.
6. Reroll its name, profession, appearance, personality, hooks, or immediate-use details independently. The generator favours values not used in the previous 20 results.
7. Pin any preview section, then regenerate to preserve the current identity and pinned sections while replacing everything else.
8. Edit any generated text in place; undo and redo preserve the preview's change history.
9. Explicitly send the result to chat, save it as a Journal Entry, create a D&D 5e NPC Actor, or copy it as text. If Monster Forge is active, **Actor + Forge** creates the Actor and opens it there immediately.

The module never posts or creates documents merely because **Generate preview** was clicked.

## Campaign model

- **Oriathan:** Human-majority. Templar, Oriath Militia, and The Ring are separate affiliations, not cultures. Templar results include the Ebony/Primis, Crimson/Secundo, both Sarn Azure/Tertius legions, Emerald/Quartus, and Archivists. Ordained Templars renounce their birth names and use a bestowed virtue-name such as `Templar Vigilance`; lay legion personnel retain ordinary Roman/Greek-style Oriathan names. Unlocked Emerald results use an approximately even human/non-human recruitment mix.
- **Azmeri:** Human-majority survivors and forest communities.
- **Ezomyte:** Dwarf-majority, with Scottish/Gaelic-inspired names.
- **Maraketh:** Halfling-majority, with Arabic/Persian-inspired names and GGG-style preference for mononyms. The Maraketh parent faction branches into the Highgate-based Kiyato Akhara and PoE 2's Ardura Akhara. The Faridun and Order of the Djinn are distinct Maraketh-culture affiliations; the Afarud branch from the Faridun, while the Sel Khari branch from the Order.
- **Karui:** Half-orc-majority, Māori-inspired culture. The Karui parent faction branches into a clan for each campaign god: Tukohama, Ngamahu, Valako, Tasalio, Ramako, Rongokurai, Arohongui, Tawhoa, Kitava, Hinekora, Sione, and Lani Lua.
- **Vaal:** Gnome-majority and available through the historical Ancient Vaal preset or a direct culture selection.
- **Kalguur:** High-elf-majority explorers in angular, spiked equipment. Their black-powder specialists reflect guarded trade with the Stygians.
- **Stygian:** Drow, duergar, and deep gnomes of the Azurite Mines. The Stygian parent faction branches into the Deepwardens, Sulphite Syndicate, Shadowborn, Emberforged, and Hollowed Vein. Their content includes sulphite black-powder trades, rune lore, Kalguur links, surface ambitions, and accented-Azmeri voice descriptors.

Named GGG and campaign figures are excluded from random name pools. The cultural and source-material review is recorded in [docs/name-audit.md](docs/name-audit.md), with the detailed Maraketh hierarchy decisions in [docs/maraketh-audit.md](docs/maraketh-audit.md).
Branch weights are generation tuning informed by the campaign notes, not asserted population counts.

Curated names remain the default. Fragment mode constructs only the given name from culture-specific, position-specific phonetic families; it never mixes fragments between cultures. Auto length uses 2 fragments 45% of the time, 3 fragments 40%, and 4 fragments 15%. Existing surname probabilities remain unchanged, including the Maraketh preference for mononyms. Ordained Templars always receive a bestowed virtue-name instead.

## Content depth

- **900 name entries:** 510 first names, 350 surnames, and 40 ordained Templar virtue-names; every culture has at least 60 first names and 40 surnames.
- **720 name fragments:** two compatible phonetic families for each 2-, 3-, and 4-fragment pattern in every culture, producing substantial extra given-name variety without cross-cultural mixing.
- **834 professions:** broad common occupations plus culture-, faction-, expedition-, legion-, militia-, akhara-, outcast-, and secret-order work.
- **968 descriptors:** the earlier freeform library plus dedicated build, facial/features, attire, distinguishing-mark, Maraketh faction, and faction-voice pools. Structured entries can be restricted by species, age, and profession.
- **594 cultural hooks:** ideals, bonds, and flaws for every culture and named faction branch.
- **444 immediate-use prompts:** goals, problems, secrets, knowledge, offers, and starting dispositions.
- Every culture has its own weighted voice pool while retaining access to broadly applicable voices.
- Cultural professions supplement the general profession library rather than replacing it, keeping results distinctive without becoming repetitive.

## Presets

- All Wraeclast
- Sarn survivor
- Oriathan occupier
- Theopolis and Oriath
- Forest Encampment
- Maraketh — Highgate and Vastiri
- Karui clans
- Kalguur expedition
- Stygian mines
- Ancient Vaal

Preset weights apply only where a field has not been explicitly locked.

## Settings

Module settings control the Journal and Actor folder names, the Journal sidebar launcher, default preset, default chat visibility, default output detail, default name source, and default fragment count.

`Actor templates by capability` accepts a JSON object mapping `Civilian`, `Skilled`, `Trained`, `Veteran`, or `Elite` to an Actor UUID. When a mapping exists, **Create Actor** duplicates that Actor and replaces its name, biography, folder, and generator flags. Without a mapping it creates the same blank D&D 5e NPC Actor as before.

`Custom generator data` accepts JSON additions/replacements without editing module files. Rows with the same category, parent, sub-parent, and value replace bundled rows; new identities are appended. For example:

```json
{
  "add": {
    "names": [
      { "category": "Name", "parent": "Oriathan", "subParent": "The Ring", "value": "LocalName", "weight": 2 }
    ],
    "nameFragments": [
      { "category": "Given2Start", "parent": "Oriathan", "subParent": "2-a", "value": "aurel", "weight": 1 }
    ]
  }
}
```

Supported override tables are `main`, `names`, `nameFragments`, `descriptors`, `professions`, `hooks`, and `drives`; `presets` may also be added or replaced by ID. A new fragment family must supply every position required by its count. Use `game.wraeclastGen.reload()` after changing overrides if the generator is already open.

Actor creation is shown only in a D&D 5e world. All other generator features are system-neutral.

Generated Actors and Journals store the complete NPC under the `wraeclast-npc-gen` flag together with `schemaVersion`, `generatorVersion`, and the selected output mode. Existing version 2.4 documents remain readable because the nested `npc` data path is unchanged.

## Monster Forge integration

When the separate **Monster Forge** module is active in a D&D 5e world, the preview includes **Actor + Forge**. This creates the same Actor as the normal Actor action and passes that Actor directly to Monster Forge. Monster Forge reads the generator's species flag when it has a matching species profile; capability tier remains campaign guidance and is not silently converted into a challenge rating.

## Macro API

```js
// Open the application
game.wraeclastGen.open();

// Generate without opening the UI
const npc = await game.wraeclastGen.generateNPC({
  preset: "stygian_mines",
  affiliation: "Stygian",
  branch: "Emberforged",
  nameMode: "fragments",
  nameFragmentCount: 3
});

// Batch generation remains available to existing macros, but is not part of the normal UI
const group = await game.wraeclastGen.generateBatch(5, {
  preset: "forest_encampment"
});

// Reload after changing world-local overrides, then validate all data files
await game.wraeclastGen.reload();
await game.wraeclastGen.validate();
```

Supported constraint keys are `preset`, `culture`, `affiliation`, `branch`, `species`, `socialOrigin`, `age`, `alignment`, `professionCategory`, `location`, `era`, `capabilityTier`, `nameMode`, and `nameFragmentCount`. `nameMode` accepts `curated`, `mixed`, or `fragments`; `nameFragmentCount` accepts `auto`, `2`, `3`, or `4`. For compatibility and macro convenience, flattened `affiliation` values such as `Hinekora`, `Tawhoa`, `Emberforged`, `Hollowed Vein`, `Kiyato Akhara`, `Ardura Akhara`, `Afarud`, and `Sel Khari` are automatically migrated to their correct parent faction and branch.

For compatibility with the original module, `game.wraeclastGen.generate()` with no argument also opens the generator. Passing a constraint object returns one generated NPC.

## Data and validation

Generator content lives in `data/*.csv`, including the separate `data/name_fragments.csv` grammar table; preset weights live in `data/presets.json`, and stable public faction IDs live in `data/factions.json`. CSV parsing supports quoted commas and escaped quotes, and HTTP/data failures are reported rather than silently replaced with generic results.

For development:

```bash
npm test
npm run check
npm run build:data
```

The test suite validates compatibility rules, pool depth, reserved names, contradictory descriptors, cultural variety, name-fragment grammar, and recent-result memory, then simulates tens of thousands of NPCs across every preset.

## Publishing an update

1. Update the version in `module.json` and `package.json`.
2. Update `module.json`'s versioned `download` URL and add release notes to `CHANGELOG.md`.
3. Commit the changes and create a GitHub release whose tag is `v` followed by that version, such as `v2.4.0`.
4. The release workflow validates the tag, runs the test suite, and attaches `module.json`, `wraeclast-npc-gen.zip`, and a SHA-256 checksum to the release.

If a release job needs to be rerun, start **Build release assets** from the Actions tab and supply the existing release tag.

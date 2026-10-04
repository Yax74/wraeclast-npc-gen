# Changelog

## 2.3.0

### Lore and naming

- Added the Oriath Militia as a distinct Oriathan affiliation with its own weighted occupations, ranks, uniform details, ideals, bonds, flaws, motives, secrets, contacts, and complications.
- Modelled the Templar Rite of Abnegation: ordained Templars now renounce their birth name and receive a single virtue-name, while non-ordained legion personnel retain ordinary Oriathan birth names.
- Added separate rank tables for ordained legion officers, lay legion personnel, Archivists, and Oriath Militia.
- Audited all cultural name pools against the campaign culture mapping and established GGG naming patterns.
- Replaced generic English compound surnames in the Maraketh, Karui, and Vaal pools; rebuilt Stygian names around their Eternal Empire ancestry.
- Removed additional GGG collisions, including Cato, Tane, and Lucan, and expanded the reserved-character validator.
- Added stable faction and branch IDs checked against the campaign Factions database without publishing private Notion URLs.

### Content expansion

- Expanded the module to 870 name entries, 691 professions, 860 descriptors, 480 faction/cultural hooks, and 300 immediate-use narrative prompts.
- Added structured build, features, attire, and distinguishing-mark fields with species, age, and profession compatibility rules.
- Added goals, immediate problems, secrets, useful knowledge, concrete offers, and initial dispositions.
- Added location, era, social-background, and capability-tier generation plus a Theopolis and Oriath preset.

### Quality of life

- Refocused the normal interface on one detailed NPC instead of batch generation; the old batch macro API remains compatible.
- Added inline editing and undo/redo history for generated NPCs.
- Added independent rerolling for immediate-use narrative details.
- Added optional D&D 5e Actor templates mapped to Civilian, Skilled, Trained, Veteran, and Elite capability tiers.
- Added validated world-local JSON overrides for names, descriptors, professions, hooks, narrative prompts, main tables, and presets.
- Added location, era, capability, rank, ordination, and faction IDs to previews and exported results.
- Expanded deterministic validation to 19 tests, including Templar naming, Militia separation, structured descriptor compatibility, custom overrides, and faction registry coverage.

## 2.2.0

### Content expansion

- Expanded the name library from 415 to 830 entries.
- Every culture now has at least 60 first names and 40 surnames; Stygian pools contain 70 first names and 55 surnames.
- Expanded the profession library from 310 to 659 entries.
- Added more than 250 broadly applicable setting occupations and new cultural roles for Oriathans, Azmeri, Ezomytes, Maraketh, Vaal, and Kalguur.
- Expanded the descriptor library from 111 to 598 entries: 137 appearance traits, 92 demeanors, 89 attitudes, 162 voices, and 118 mannerisms.
- Added dedicated weighted voice pools for all eight cultures.

### Quality and performance

- Cultural and branch-specific professions now enrich the general occupation pool with stronger weights instead of replacing its variety.
- Added compatibility rules for the expanded appearance, demeanor, and attitude pools.
- Strengthened age filtering for grey- and silver-haired descriptors.
- Added indexed table lookups, cached specificity selections, cached profession pools, and constant-time contradiction checks.
- Expanded validation to enforce minimum name, profession, and descriptor pool sizes.
- Added deterministic diversity simulations across every culture; all 15 tests pass.

## 2.1.0

### Faction hierarchy and lore

- Added a dedicated clan/subfaction level beneath culture and parent affiliation.
- Reclassified Emberforged and Hollowed Vein as Stygian internal factions.
- Added the Deepwardens, Sulphite Syndicate, and Shadowborn to complete the five Stygian factions recorded in the campaign database.
- Reclassified Hinekora and Tawhoa as Karui god-clans.
- Added clans for all twelve Karui gods: Tukohama, Ngamahu, Valako, Tasalio, Ramako, Rongokurai, Arohongui, Tawhoa, Kitava, Hinekora, Sione, and Lani Lua.
- Added branch-weighted professions and campaign hooks for the new Stygian factions and Karui clans.

### Quality of life

- Added a dependent Clan/Internal faction filter with locking and section-reroll support.
- Included the selected branch in previews, chat cards, Journals, Actors, clipboard output, and generated-NPC flags.
- Kept legacy macros using the former flattened affiliation values working through automatic migration.
- Added structural validation and regression tests for parent/branch relationships, all recorded factions, and legacy calls.

## 2.0.0

### Lore and data

- Corrected Ezomyte, Maraketh, Karui, Vaal, and Kalguur species weights to match the campaign.
- Separated culture from affiliation throughout the generator.
- Added Hinekora and Tawhoa tribal affiliations.
- Added every established Templar branch and culture-specific Templar occupations.
- Curated culture-specific name pools and removed reserved campaign figures, duplicates, typos, and title-as-name entries.
- Replaced anachronistic or unclear jobs with setting-appropriate professions.
- Added age-aware youth professions and long-lived-species rules for Ancient results.
- Added descriptor contradiction and age filtering.
- Added full Stygian species, names, surnames, professions, voice traits, faction hooks, sulphite black-powder lore, and Kalguur trade links.

### Quality of life

- Migrated the interface to Foundry VTT 13's ApplicationV2 framework.
- Added preview-first generation with no automatic chat or document creation.
- Added dependent, data-driven filters that reject impossible combinations.
- Fixed locking: selections are authoritative, random results can be captured, and unlock returns to random.
- Added section rerolls for names, professions, appearance, personality, and hooks.
- Added one-to-ten NPC batch generation and batch output actions.
- Added explicit chat, Journal, D&D 5e Actor, and clipboard output actions.
- Added campaign presets and a Journal-sidebar launcher.
- Added configurable folders, chat visibility, default preset, and launcher visibility.
- Cached and concurrently loaded data files with explicit response validation.
- Replaced naive comma splitting with quote-aware CSV parsing.
- Added validation and deterministic simulation tests.

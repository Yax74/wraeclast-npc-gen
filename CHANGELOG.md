# Changelog

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

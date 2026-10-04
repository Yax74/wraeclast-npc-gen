# Name-pool audit

Audited 4 October 2026 against the campaign culture mapping, the campaign Factions database, and established Path of Exile naming patterns. These pools create culturally consistent incidental NPCs; they do not claim that every generated name is canonical GGG vocabulary.

| Generator culture | Naming basis | Source-material check |
| --- | --- | --- |
| Oriathan | Roman and Greek, with a strongly Latinate civic register | Consistent with names and titles such as Dominus, Avarius, Venarius, and Gravicius. Ordinary NPCs use birth names. Ordained Templars instead use a single bestowed virtue-name after the campaign's Rite of Abnegation. |
| Azmeri | Welsh and Brythonic | The GGG examples are eclectic (including Yeena, Greust, Silk, and Oshabi), so the pool follows the campaign's shamanistic-Britain brief rather than treating one GGG character as a complete language sample. |
| Ezomyte | Scottish Gaelic and Highland forms | Supports the campaign's dwarven/Scottish conversion while remaining compatible with the broad northern and Celtic feel of Grigor, Rigwald, Einhar, and related source names. |
| Maraketh | Persian and Arabic forms | Matches the campaign's Arabic/Faridun aesthetic and the broad register established by Oyun, Kira, Tasuni, and Irasha. English compound surnames were removed. |
| Karui | Māori and wider Polynesian forms | GGG explicitly bases the Karui language on Māori. Exact source characters are excluded from random generation; surnames now use Māori-style forms rather than English compounds. |
| Vaal | Nahuatl-influenced forms with some constructed q/z spellings | Follows the campaign's Aztec/gnome conversion while retaining a sharper fantasy register compatible with Atziri, Doryani, and Zerphi. English compound surnames were removed. |
| Kalguur | Northern Germanic forms adapted to a high-elven register | Tracks the name family implied by Dannig, Gwennen, Tujen, Rog, Uhtred, Vorana, and Olroth, while reflecting the campaign's high-elf conversion. |
| Stygian | Altered Latinate birth names plus subterranean bynames | Campaign-specific: Stygians descend from the Eternal Empire, so the pool mutates Oriathan/Eternal forms through the established Stygian sound changes. |

## Collision policy

The validator rejects exact names reserved for established GGG or campaign characters. The audit additionally removed `Cato`, `Tane`, and `Lucan`, which overlapped GGG source characters or named lore figures, and retained the earlier exclusions for figures such as Atziri, Doryani, Kaom, Hyrri, Lani, Utula, Oyun, Kira, Dannig, Gwennen, Rog, and Tujen.

The check is deliberately exact-name based. Ordinary real-world names can occur independently in a population, but distinctive established character names should not appear as random NPC identities.

## Public references

- [Karui](https://www.poewiki.net/wiki/Karui)
- [Tane Octavius](https://www.poewiki.net/wiki/Tane_Octavius)
- [Kalguur](https://www.poewiki.net/wiki/Kalguur)
- [Ezomytes](https://www.poewiki.net/wiki/Ezomytes)
- [Maraketh](https://www.poewiki.net/wiki/Maraketh)
- [Azmeri](https://www.poewiki.net/wiki/Azmeri)
- [Vaal](https://www.poewiki.net/wiki/Vaal)
- [Order of the Templar](https://www.poewiki.net/wiki/Order_of_the_Templar)

Private campaign pages are intentionally identified only by database entry label in `data/factions.json`; their Notion URLs are not published in the module.

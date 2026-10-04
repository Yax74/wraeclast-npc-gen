# Maraketh implementation audit

Audited 4 October 2026. Campaign Notion pages are authoritative for the D&D conversion; Path of Exile 1 and 2 are used to check terminology, relationships, and naming patterns or to fill gaps.

## Campaign baseline

- The Maraketh are a halfling-founded, now multiracial, matriarchal civilisation with an Arabic cultural basis.
- The **akhara** is the central clan or tribal unit and is led by a **Sekhema**.
- The Kiyato Akhara guards Highgate and the Deshret Seal. Oyun, Kira, and Tasuni anchor its Act 4 material.
- The Faridun are outcasts and rescued foundlings abandoned under harsh Maraketh custom. Their settlements also accept criminal exiles; visible tattoos may be worn in defiance of Maraketh shame-marking.
- The campaign's Order of the Djinn is a secretive, Maraketh-origin organisation concerned with containing dangerous artefacts and existential threats.

## GGG cross-check

- PoE 1 establishes the Kiyato Akhara at Highgate, the roles of Sekhema and Dekhara, the Faridun, the Order of the Djinn, and the commandment “Honour the Mother, Honour the Life.”
- PoE 2 establishes the mobile Ardura Akhara, the practical status of a **jingakh** as an admitted outsider serving an akhara, the importance of tale-women and oral history, and further Faridun history.
- Current PoE 1 Mirage material identifies the **Afarud** as an extreme offshoot of the Faridun and expands the ancient Djinn material around Varashta, barya, and the **Sel Khari**.

## Generator hierarchy

| Culture | Affiliation | Branch |
| --- | --- | --- |
| Maraketh | Maraketh | Kiyato Akhara |
| Maraketh | Maraketh | Ardura Akhara |
| Maraketh | Faridun | Afarud |
| Maraketh | Order of the Djinn | Sel Khari |

`Unaffiliated` remains available beneath each parent for unnamed akharas, ordinary Faridun, independent Order agents, and people outside these organisations. The Afarud are not presented as representative Faridun, and the Sel Khari do not replace the campaign-specific Order of the Djinn.

## Naming decision

The random pool uses real Persian and Arabic given names to satisfy the campaign's stated cultural source. GGG's Maraketh names are more eclectic and constructed, so they are used as a phonetic breadth check rather than copied into the random table. Known names from both games are reserved against accidental generation.

Most named Maraketh in GGG material use one personal name followed, when needed, by a title or epithet. The generator therefore gives a Maraketh NPC a surname only 25% of the time. Akhara membership is reported separately and is never fabricated as a surname.

## Public sources

- [The Maraketh](https://www.poewiki.net/wiki/The_Maraketh)
- [Faridun](https://www.poewiki.net/wiki/Faridun)
- [The Ardura Caravan](https://www.poe2wiki.net/wiki/The_Ardura_Caravan)
- [Sekhema Asala](https://www.poe2wiki.net/wiki/Sekhema_Asala)
- [Earning Passage](https://www.poe2wiki.net/wiki/Earning_Passage)
- [Path of Exile: Mirage 3.28.0 patch notes](https://www.pathofexile.com/forum/view-thread/3913392)

Private campaign source URLs are intentionally omitted. Their page/database labels are recorded in `data/factions.json`.

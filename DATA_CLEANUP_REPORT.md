# AniPins Data Cleanup Report

Date: 2026-09-22  
Source: read-only production response from `https://anipins.com/api/meta`

No production data was changed by this audit.

## Inventory

- Artwork records represented: 639
- Distinct character labels returned: 509
- Distinct anime labels returned: 67

## Confirmed same-slug duplicates

These variants already resolve to the same slug and are safe candidates for label normalization after review:

| Type | Canonical value | Variant | Records |
| --- | --- | --- | ---: |
| Anime | Black Clover | Black clover | 1 |
| Anime | Chainsaw Man | Chainsaw man | 1 |
| Anime | Demon Slayer | Demon slayer | 1 |
| Anime | My Dress Up Darling | My Dress Up darling | 1 |
| Anime | Random | random | 1 |
| Anime | That Time I Got Reincarnated as a Slime | That time i got reincarnated as a slime | 5 |
| Character | Haruka Sakura | haruka Sakura | 1 |
| Character | Julius Novachrono | Julius  Novachrono | 1 |
| Character | Kisuke Urahara | kisuke Urahara | 1 |
| Character | Light Yagami | Light yagami | 1 |
| Character | Zora Ideale | Zora ideale | 1 |

## Likely spelling or classification errors requiring confirmation

| Current value | Proposed value | Reason |
| --- | --- | --- |
| Bleacch | Bleach | Obvious spelling error |
| Overloand | Overlord | Obvious spelling error; existing `Overload` may also intend `Overlord` |
| Overload | Overlord | Official series title appears to be *Overlord*; confirm before changing all 7 records |
| Jujutsu Ka | Jujutsu Kaisen | Truncated title |
| Fairy Tale | Fairy Tail | Likely spelling variant |
| Kakeguri | Kakegurui | Likely spelling error |
| Tokyo Revenger | Tokyo Revengers | Likely singular/plural error |
| Alya sometimes hides her feeling | Alya Sometimes Hides Her Feelings in Russian | Likely abbreviated/incorrect title; verify that both groups are the same series |
| Daichi Sawamura (anime label) | Haikyu | A character name appears in the anime field |
| Random / random | Unknown or a reviewed collection label | Not a series name |
| Wifey (character) | Review manually | Generic label rather than an identifiable character |

## Safe cleanup procedure

1. Export/back up the `artworks` table.
2. Approve each mapping above, especially `Overload`, Alya and generic labels.
3. Update `anime_name`, `anime_slug`, `character_name` and `character_slug` in one database transaction.
4. Re-run the production inventory and ensure the artwork count remains 639.
5. Add redirects for any changed public slug that differs from the canonical slug.
6. Change the admin upload form to select/reuse canonical anime and character values instead of accepting uncontrolled variants.

## Not recommended

- Do not delete artwork merely because its label is duplicated.
- Do not automatically fuzzy-merge different character names.
- Do not change published URLs without redirects.

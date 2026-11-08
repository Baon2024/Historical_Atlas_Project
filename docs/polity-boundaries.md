# Historical boundary refinements

The six static snapshots now use more detailed geography for 17 territories. The user-supplied Mongol feature for 1206 is preserved, including its coordinates and metadata. All territory IDs, colours, summaries, and other properties are preserved.

These remain **approximate historical extents**, not surveyed borders or a scholarly GIS reconstruction. The additional coastline detail should not be interpreted as equivalent historical precision for inland frontiers. Modern shorelines are used as geographic context; ancient coastlines can differ.

## Method

Broad territorial envelopes were revised against the historical references below and intersected with the project's existing Natural Earth 1:50m land geometry, distributed in `world-atlas` 2.0.2. This replaces straight lines through seas with actual coastline shapes, separates islands, and preserves water holes such as the Caspian Sea. Very small coastal fragments below 0.001 square degrees were omitted. Coordinates are stored to five decimal places to keep the file sizes manageable, not to claim metre-level historical accuracy.

The files remain hardcoded JSON, imported at startup. No generator, fetch layer, additional runtime dependency, or external historical-data service was added to the application. The 218 BCE registry key was corrected to match its existing renamed file, `mediterranean-218.json`.

## Snapshot coverage

| Snapshot | Main refinements | Updated coordinate pairs |
| --- | --- | ---: |
| Mediterranean, 264 BCE | Roman peninsula south of the northern expansion; Carthaginian Africa, Sardinia and western Sicily; Macedonian mainland and small garrison areas. | Rome 181; Carthage 304; Macedon 136 |
| Mediterranean, 218 BCE | Roman mainland/islands and Adriatic protectorate; Carthaginian Iberian and African extents; detailed Aegean coastline. | Rome 565; Carthage 325; Macedon 137 |
| Mediterranean, 201 BCE | Roman Iberian coastal possessions, reduced Carthaginian African territory, and a broader eastern Macedonian outline. | Rome 699; Carthage 65; Macedon 168 |
| Eurasia, 1206 | Song coastline, Hainan and Sichuan; Delhi's northern Indian corridor. The Mongol feature is untouched. | Song 684; Delhi 28 |
| Eurasia, 1227 | Mongol Central Asian/northern Chinese outline; Song coastal detail; Delhi's approximate post-Bengal-campaign reach. | Mongols 188; Song 684; Delhi 41 |
| Eurasia, 1260 | Mongol western/northern expansion and Yunnan, retained Song territory in southern China, and Delhi's northern core. | Mongols 1,181; Song 682; Delhi 26 |

The 1260 Mongol shape groups the wider Mongol political realm at the onset of fragmentation, including dependent Rus' territories; it should not be read as a uniform administration. It excludes temporary campaigns into Poland and the spring 1260 occupation of Damascus. Delhi's control of frontier provinces and Bengal fluctuated during the thirteenth century; these shapes distinguish the northern core and the 1227 Bengal campaign rather than asserting continuous control over every intermediate district. Detailed enclaves and tributary relationships remain incomplete.

## Sources and attribution

- **Coastline geometry:** [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), public domain, as packaged in [world-atlas 2.0.2](https://github.com/topojson/world-atlas). The included `public/data/geography/LICENSE.txt` records the world-atlas ISC notice. No modern country-border geometry was used as a historical border.
- **Mediterranean reference:** James Henry Breasted, *Ancient Times* (1916), [Roman Power at the Beginning of the Wars with Carthage, 264 BCE](https://etc.usf.edu/maps/pages/8400/8428/8428.htm), University of South Florida Maps ETC. The later masks are approximate adjustments for the intervening Punic conquests, not a download of exact-year ancient polygons.
- **Song reference:** [Jin and Southern Song Dynasties, 1200](https://www.nationsonline.org/oneworld/map/Chinese_dynasties/Jin_S-Song_Dynasty_Map.htm), Thomas A. Lessman / Nations Online, and [Map of Southern Song & Jin States](https://www.worldhistory.org/image/7326/map-of-southern-song--jin-states/), Yu Ninjie / World History Encyclopedia. Used as historical extent references, not as imported GIS data.
- **Delhi and Mongol frontier chronology:** Peter Jackson, *The Delhi Sultanate: A Political and Military History* (Cambridge University Press, 1999), especially chapters 2, 4–6 and map 1. An [institution-hosted copy](https://tehattagovtcollege.ac.in/Pdf/Resources/History/Online-learning/PDF-Book/INDIAN%20HISTORY%20MEDEIVAL%20PERIOD/Peter%20Jackson.pdf) was consulted for the Ghurid succession, the 1227 Bengal campaign, and the later Mongol/Delhi frontier.
- **Mongol geographical context:** [The Mongol Invasion, 1250–1260](https://www.sciencespo.fr/cartographie/en/cartotheque/linvasion-mongole-1250-1260-13), Atelier de cartographie / Louvre et Sciences Po (2012), was consulted for broad historical context. Its graphic is not redistributed or digitized here.

Cliopatria was investigated as a possible source, but its bulk download was unavailable in this execution environment. These coordinates are **not** presented as extracted Cliopatria polygons.

## Checks

- Closed rings, finite longitude/latitude ranges, and self-crossing checks across every territory.
- 53 inclusion/exclusion checks using places such as Rome, Pella, Carthage, Palermo, Cartagena, Delhi, Hangzhou, Hainan, Taipei, Baghdad, Moscow, and Warsaw.
- Exact comparison of the preserved 1206 Mongol feature and every feature's non-geometry properties against the starting files.
- Visual review of all six snapshots over Natural Earth land, including separate Mediterranean islands and the later Mongol/Song boundary.

Permanent regression coverage is in `tests/boundaries.test.ts`. The existing helper tests were aligned with the already renamed 218 BCE file and current ungrouped year labels.

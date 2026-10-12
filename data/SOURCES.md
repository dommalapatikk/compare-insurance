# Data sources

Retrieved on **2026-10-12**. All files are first-party publications of the Swiss Federal Office of Public Health (Bundesamt für Gesundheit, BAG/FOPH) or are linked from the official Swiss open-data catalogue.

## Current premium year

The latest published premium year at retrieval time is **2027**. The opendata.swiss record was modified on 2026-09-29 and declares coverage from 2027-01-01 through 2027-12-31:

- Catalogue record: <https://opendata.swiss/de/dataset/health-insurance-premiums>
- Record identifier: `prim@bundesamt-fur-gesundheit-bag`
- Publisher: Bundesamt für Gesundheit, Sektion Prämien und finanzielle Risiken
- Official Priminfo landing page: <https://www.priminfo.admin.ch/de/praemien>

The current files are live resources whose contents are replaced during the annual release. The year is therefore included in each local filename, and the checksums below pin the exact retrieved snapshots.

## Downloaded files

| Local file | Official resource | Format | Size (bytes) | SHA-256 |
|---|---|---:|---:|---|
| `raw/praemien_ch_2027.csv` | [`Prämien_CH.csv`](https://opendata.swiss/de/dataset/health-insurance-premiums/resource/0b9f074d-d457-4ec0-807d-bcf5596ac60a) | UTF-8 CSV with BOM, comma-delimited | 25,832,930 | `957fef82f47eb8d8243e01be17699d864b98a741c466f5d07015c6e91fecfdaa` |
| `raw/tarife_2027.csv` | [`Tarife.csv`](https://opendata.swiss/de/dataset/health-insurance-premiums/resource/47dbfd7b-985c-4526-9b3e-0dee47c0aef5) | UTF-8 CSV with BOM, comma-delimited | 32,464 | `7a1eb22bd9ac96fea83b6d0a383c4779c8a5a6ac681d5f30c0991a26e64160a7` |
| `raw/praemiendaten_field_notes_2027.xlsx` | [`Erläuterungen zu den Prämiendaten.xlsx`](https://opendata.swiss/de/dataset/health-insurance-premiums/resource/e2d5b3fc-07a1-447e-8ee1-c813bb81f0cc) | XLSX | 21,815 | `cffea26d28a735e6cc624beec1618dae95f88891ff81a90d87590148cfa03727` |
| `raw/praemienregionen_2027.xlsx` | [Prämienregionen, valid from 2027-01-01](https://www.bag.admin.ch/de/krankenversicherung-praemienregionen) | XLSX | 68,119 | `9ca00b8e2a05ccbd85e27341eafadcb31b9573adc638114b56f6631bd2bdbceb` |
| `raw/zugelassene_krankenversicherer_2026-10-01.xlsx` | [Register of authorised health insurers, 2026-10-01](https://www.bag.admin.ch/de/verzeichnisse-der-zugelassenen-kranken-und-rueckversicherer) | XLSX | 49,233 | `b5c2e33a27453c744c4f2d949660f111f59d471707390b6a3184d6b9250adc69` |

Exact download URLs used:

- `Prämien_CH.csv`: <https://opendata.bagnet.ch/?r=/download&path=L1ByYWVtaWVuL1Byw6RtaWVuX0NILmNzdg%3D%3D>
- `Tarife.csv`: <https://opendata.bagnet.ch/?r=/download&path=L1ByYWVtaWVuL1RhcmlmZS5jc3Y%3D>
- Field notes: <https://opendata.bagnet.ch/?r=/download&path=L1ByYWVtaWVuL0VybMOkdXRlcnVuZ2VuIHp1IGRlbiBQcsOkbWllbmRhdGVuLnhsc3g%3D>
- 2027 premium regions: <https://www.bag.admin.ch/dam/de/sd-web/Xm8w51dMKXLP/Pr%C3%A4mienregionen%20(g%C3%BCltig%20ab%201.1.2027).xlsx>
- Insurer register: <https://www.bag.admin.ch/dam/de/sd-web/pigYvqGTcJOi/Zugelassene%20Krankenversicherer_1.10.2026.xlsx>

`opendata.bagnet.ch` is the download host supplied by the opendata.swiss BAG resource records.

## What the files contain

### `praemien_ch_2027.csv`

The comparison fact table contains **219,916 rows** and these 17 fields:

| Field | Meaning/use |
|---|---|
| `Versicherer` | BAG insurer number; join to the insurer register. |
| `Kanton` | Canton or BAG special territorial code. Filter normal Swiss location searches to the 26 official canton codes. |
| `Hoheitsgebiet` | Territory; all rows in this snapshot are `P_OKPCH`. |
| `Geschäftsjahr` | Premium year; all rows are `2027`. |
| `Erhebungsjahr` | Collection/submission year; all rows are `2026`. |
| `Region` | `PR_REG_0` where the canton has no regional subdivision, otherwise `PR_REG_1`, `PR_REG_2`, or `PR_REG_3`. |
| `Altersklasse` | `AKA_01_KIN` child, `AKA_02_JUG` young adult, `AKA_03_ERW` adult. |
| `Unfalleinschluss` | `MIT_UNF` includes accident cover; `OHN_UNF` excludes it. |
| `Tarif` | Insurer-specific plan/tariff ID. |
| `Tariftyp` | Broad model family. Values present are `BASE`, `PRAXIS`, `FLEX`, and `TEL_DIG`. The field guide also allows `PHARM`, but no `PHARM` row occurs in this snapshot. |
| `Altersuntergruppe` | Insurer-specific age subgroup code (`E1`, `J1`, and child subgroups such as `K1`, `K3`, `K4`, `K5` in this snapshot). |
| `Franchisestufe` | Deductible tier, `FRASTU_01` through `FRASTU_07`. |
| `Franchise` | Encoded annual deductible. Adults and young adults have CHF 300, 500, 1,000, 1,500, 2,000 and 2,500; children have CHF 0 through 600 in CHF 100 steps when offered. |
| `Prämie` | Approved premium in CHF. Priminfo presents these as monthly premiums. |
| `isBaseP` | `1` for the base/standard tariff, otherwise `0`. |
| `isBaseF` | `1` for the ordinary deductible, otherwise `0`. |
| `Tarifbezeichnung` | Insurer-provided German plan name. |

The table covers 32 BAG insurer numbers and all rows are complete (no empty CSV fields). To rank the top 10 offers for a person, filter by canton, premium region, age class/subgroup, accident setting, deductible and desired model family, then sort numeric `Prämie` ascending. Do not rank across unfiltered age, accident, deductible or region dimensions.

### `tarife_2027.csv`

This 271-row lookup contains multilingual labels (`Name_DE`, `Name_FR`, `Name_IT`, `Name_EN`) for:

- `ALT`: age subgroup codes (118 insurer-specific rows)
- `MOD`: insurance plans/models (153 insurer-specific rows)

All tariff and age-subgroup keys used by `praemien_ch_2027.csv` resolve in this lookup. Join on `Versicherer`, `Geschäftsjahr`, `Erhebungsjahr`, and the appropriate code; also filter `Kategorie` to `MOD` or `ALT` so the two code namespaces are not mixed.

### `praemienregionen_2027.xlsx`

The `Anhang EDI Ver. über die PR` sheet maps **1,495 municipalities** in the 11 multi-region cantons to a unique BFS municipality number and premium region 1, 2 or 3. The other 15 cantons use `PR_REG_0` and are intentionally absent from this table. The `Mutationen` sheet lists municipality mergers and new municipalities for the 2027 revision.

The workbook itself warns that it is a machine-readable aid and that the EDI ordinance prevails if the workbook and ordinance conflict. It contains municipality names and BFS numbers, but no postal-code column; a separate authoritative postcode-to-municipality source will be needed for postcode search.

### `zugelassene_krankenversicherer_2026-10-01.xlsx`

The `Index` and `Zugelassene Krankenversicherer` sheets map BAG insurer numbers to insurer names, contact data and authorised activity territory. All 32 insurer numbers used by the 2027 premium CSV are present in this register. Use the BAG number as the stable join key; insurer names and branding may change.

### `praemiendaten_field_notes_2027.xlsx`

BAG's German/French field dictionary for the 2027 CH and EU premium exports. It is retained as supplied so future transformations can be checked against the publisher's definitions.

## Validation performed

- Both CSV files were parsed with a standards-compliant CSV reader using `utf-8-sig`; their headers and every row parsed successfully.
- `praemien_ch_2027.csv` contains 219,916 data rows, exclusively premium year 2027, and has no empty fields.
- `tarife_2027.csv` contains 271 data rows, exclusively premium year 2027; it covers every model and age-subgroup key referenced by the premium table.
- Every premium-table insurer number exists in the BAG insurer register.
- All three XLSX files identify as Office Open XML spreadsheets, pass ZIP integrity checks, and their worksheets/XML were parsed. They are not HTML error responses.
- File sizes and SHA-256 hashes were recorded after validation.

## Important limitations

- These are **approved compulsory basic-insurance (OKP/AOS) premiums**, not supplementary insurance offers. Benefits under basic insurance are legally standardised, but service/access rules differ by model.
- Premiums depend on age **category**, not a continuous age curve. The three categories are child, young adult and adult. Application code must derive the category for the premium year from the birth year/date.
- There is no sex/gender field. BAG explains that, for a person aged 26 or older, the same insurer, premium region and model has the same premium regardless of age, sex or health status. Gender should therefore not alter the price query.
- `ZE` and `ZR` are BAG special/pseudo-territorial codes, not Swiss cantons and not represented by Swiss municipalities in the premium-region workbook. Exclude them from ordinary Swiss-resident location search unless their special population is explicitly supported.
- The premium-region workbook covers only municipalities in cantons subdivided into regions. Treat all municipalities in the other Swiss cantons as region 0.
- The region workbook has no postcode data, and postal codes do not always map one-to-one to municipalities. Do not guess a premium region from a postal code alone.
- BAG/Priminfo notes that an insurer can restrict its activity area to particular regions or municipalities. Premium rows and the register are necessary inputs, but a production eligibility check may also require BAG's current catchment/activity-area data and confirmation from the insurer.
- `Prämie` is the gross approved monthly premium. It does not subtract cantonal premium reductions/subsidies, and it does not estimate annual out-of-pocket medical costs. "Savings" must state the chosen comparison baseline and whether it is monthly (`difference`) or annual (`difference × 12`).
- The raw resources are annual snapshots and can be corrected by BAG. On refresh, record a new retrieval date and checksum rather than silently replacing a pinned file.

## Reuse terms and attribution

At retrieval time the premium dataset's opendata.swiss record displayed no dataset-specific usage-condition label, and its catalogue metadata contained no licence ID/title (`license_id: null`, `license_title: null`, `isopen: false`). Do not infer a Creative Commons licence.

The portal's general [usage-conditions page](https://opendata.swiss/de/terms-of-use) states that reuse is governed by applicable law and recommends source attribution even where it is not mandatory. Any public or commercial product should, at minimum, credit **Bundesamt für Gesundheit (BAG), Krankenversicherungsprämien 2027** and link to the catalogue record. Confirm any unresolved commercial-reuse question with the record contact, `aufsicht@bag.admin.ch`, before launch.


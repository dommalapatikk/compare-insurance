# Data directory

This directory separates immutable source snapshots from application-ready data.

## `raw/`

Files downloaded directly from BAG/Priminfo and opendata.swiss live here. Keep them byte-for-byte unchanged after download so checksums, provenance and later results remain reproducible.

Git stores the pinned source snapshot. GitHub Actions verifies every raw file
against [`SHA256SUMS`](./SHA256SUMS) on pushes and pull requests; it does not
silently refresh or replace official data.

The current snapshot is the **2027** Swiss compulsory health-insurance premium release. See [`SOURCES.md`](./SOURCES.md) for exact URLs, checksums, field notes, validation and reuse constraints.

Do not put credentials, API keys, user uploads or personally identifying data in this directory.

## `processed/`

Generated, application-ready outputs belong here. Expected processing work includes:

- normalising encoded deductible and age-category values;
- joining insurer numbers to display names;
- joining insurer-specific plan labels and model families;
- mapping BFS municipality numbers to premium regions;
- excluding BAG special territorial codes from ordinary Swiss-resident searches;
- deriving monthly and annual savings from an explicitly defined baseline.

Processed files must be reproducible from `raw/` and should never be edited by hand. Processing code should fail loudly on an unknown year, insurer, model, age code, deductible or premium region rather than silently dropping the row.

No processed dataset has been generated yet.

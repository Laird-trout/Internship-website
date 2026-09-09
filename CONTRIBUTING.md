# Adding or correcting an employer

Everything is in `data/catalog.js`. Copy an existing entry, edit it, and run `node scripts/validate.js`.

## Employer fields

| field | values |
|---|---|
| `company` | display name, unique |
| `sector` | `Semiconductors & EDA`, `Big tech & consumer hardware`, `Aerospace & defense`, `Government & national labs`, `Power, energy & utilities`, `Automotive & mobility`, `Robotics & deep-tech startups`, `Medical devices`, `Telecom & networking`, `Industrial, test & measurement`, `Quant finance (FPGA)` |
| `hq` | headquarters or main engineering city |
| `sites` | array of other intern locations (can be empty) |
| `roles` | array of typical intern titles |
| `tags` | any of `Analog`, `Digital/FPGA`, `Embedded`, `Power`, `RF/Wireless`, `Semiconductor/VLSI`, `Controls`, `DSP`, `Test/Validation`, `PCB/Signal integrity`, `Systems`, `Optics/Photonics` |
| `soph` | `3` regularly hires sophomores, `2` sometimes, `1` mostly juniors and up |
| `cit` | `us` citizenship required, `uslpr` citizen or permanent resident, `open` no requirement |
| `opens` | month or range when postings for the following summer usually go live, e.g. `Sep–Oct` |
| `pay` | `3` top of market, `2` strong industry, `1` stipend or utility scale |
| `pnw` | `true` if there are intern sites in Oregon, Washington, or Idaho (omit otherwise) |
| `url` | careers landing page, absolute URL |
| `notes` | one or two sentences a student would actually use |
| `program` | optional named early-undergraduate program |

## Rules of thumb

- Link to careers portals, not individual reqs. Reqs die within weeks; portals last for years.
- `soph: 3` means there is a track record of second-years being hired, not that the posting says "all years welcome."
- Keep `notes` factual. If a company has been restructuring, say so; students should know to verify.
- Keep the fixed lists of sectors and tags stable so the filters stay useful. If you need a new one, add it in `scripts/validate.js` too.

## Other sections

`programs`, `timeline`, and `resources` in the same file feed the other tabs. The timeline `items` may contain simple HTML such as `<b>`.

# Third-Party Material and AI Disclosure

List material frameworks, libraries, starters, templates, UI kits, fonts, icons and assets used in this repository.

| Name | Version or source URL | Licence | Used for |
|---|---|---|---|
| React | 18.x (npm) | MIT | UI framework |
| TypeScript | 5.x (npm) | Apache 2.0 | Type-safe JavaScript |
| Vite | 5.x (npm) | MIT | Frontend build tool |
| FastAPI | 0.104.x (PyPI) | MIT | Python REST API framework |
| Pydantic | 2.x (PyPI) | MIT | Data validation and serialization |
| Decimal (Python std lib) | Built-in | PSF | Financial arithmetic |
| Tailwind CSS | 3.x (npm) | MIT | Utility-first CSS framework |
| Zustand | 4.x (npm) | MIT | State management |

## AI tools

This project uses **GitHub Copilot** for code generation:
- **Used for:** React component scaffolding, TypeScript type definitions, Python function templates, test case generation, and CSS utility combinations
- **How output was verified:** 
  1. Generated code reviewed against P10 problem specification for correctness
  2. All tariff calculations manually validated against published rates
  3. Test suite run against published test cases (data.json, edge.json, aman_edge.json)
  4. Edge cases verified: slab boundary crossings, month transitions, leap years, multiple recharges same day
  5. Comparison logic audited to ensure no artificial slab arbitrage (per R-16)

## Original-work statement

Everything not declared in this file or `EVENT.md` was created by the registered team (LSH26-T050) during the event window.

The billing engine logic (tariff calculations, slab tracking, fixed-charge logic) was entirely developed by the team to implement the exact rules in the P10 problem statement. No pre-existing P10 solver or meter billing library was used. Generic frameworks (React, FastAPI, TypeScript, Tailwind) were used as declared above.

## Fáze 0b: Inventář

| Soubor | Úroveň (Tier) | describe | it | skip | todo | Příznaky (Flags) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | visual | 1 | 1 | 0 | 0 | - |
| `unit/validate-html.test.js` | unit | 2 | 2 | 0 | 0 | - |
| `unit/sass-helpers.test.js` | unit | 3 | 4 | 0 | 0 | - |
| `unit/process-js.test.js` | unit | 3 | 4 | 0 | 0 | - |
| `unit/process-data.test.js` | unit | 7 | 14 | 0 | 0 | - |
| `unit/private-streams.test.js` | unit | 3 | 2 | 0 | 0 | - |
| `unit/module-boundaries.test.js` | unit | 1 | 17 | 0 | 0 | - |
| `unit/lint-templates.test.js` | unit | 2 | 2 | 0 | 0 | - |
| `unit/images-logic.test.js` | unit | 4 | 12 | 0 | 0 | - |
| `unit/html.test.js` | unit | 6 | 10 | 0 | 0 | - |
| `unit/html-helpers.test.js` | unit | 3 | 4 | 0 | 0 | - |
| `unit/helpers.test.js` | unit | 11 | 21 | 0 | 0 | - |
| `unit/generate-favicons.test.js` | unit | 2 | 2 | 0 | 0 | - |
| `unit/env.test.js` | unit | 1 | 4 | 0 | 0 | - |
| `unit/config.test.js` | unit | 4 | 9 | 0 | 0 | - |
| `unit/changed-filter.test.js` | unit | 1 | 1 | 0 | 0 | - |
| `unit/assets.test.js` | unit | 5 | 9 | 0 | 0 | - |
| `smoke/build-artifacts.test.js` | smoke | 1 | 3 | 0 | 0 | - |
| `integration/sass.test.js` | integration | 1 | 6 | 0 | 0 | - |
| `integration/sass-structure.test.js` | integration | 1 | 1 | 0 | 0 | - |
| `integration/process-html.test.js` | integration | 1 | 1 | 0 | 0 | - |
| `integration/process-data.test.js` | integration | 1 | 1 | 0 | 0 | - |
| `integration/mismatched-images.test.js` | integration | 1 | 3 | 0 | 0 | - |
| `integration/images-final.test.js` | integration | 1 | 4 | 0 | 0 | - |
| `integration/full-build.test.js` | integration | 1 | 1 | 0 | 0 | - |
| `integration/fonts.test.js` | integration | 1 | 3 | 0 | 0 | - |
| `integration/debug.test.js` | integration | 1 | 3 | 0 | 0 | - |
| `integration/copy-static.test.js` | integration | 1 | 2 | 0 | 0 | - |
| `integration/clean-build.test.js` | integration | 1 | 3 | 0 | 0 | - |
| `integration/build-prod.test.js` | integration | 1 | 1 | 0 | 0 | - |
| `integration/build-export.test.js` | integration | 1 | 2 | 0 | 0 | - |
| `integration/assets.test.js` | integration | 1 | 2 | 0 | 0 | - |
| `e2e/pages.test.js` | e2e | 5 | 15 | 0 | 0 | - |


### Dávka (Batch) 1

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/validate-html.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/sass-helpers.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/process-js.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/process-data.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | PASS | PASS | PASS | PASS | PASS | **FAIL** |
| `unit/validate-html.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/sass-helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/process-js.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/process-data.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/validate-html.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/sass-helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/process-js.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/process-data.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | visual | L4 | L4 | - | **PASS** |
| `unit/validate-html.test.js` | unit | L2 | L0 | - | **WARNING** |
| `unit/sass-helpers.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/process-js.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/process-data.test.js` | unit | L2 | L2 | - | **PASS** |

---

### Dávka (Batch) 2

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `unit/private-streams.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/module-boundaries.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/lint-templates.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/images-logic.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/html.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/private-streams.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/module-boundaries.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/lint-templates.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/images-logic.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/html.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/private-streams.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/module-boundaries.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/lint-templates.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/images-logic.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/html.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/private-streams.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/module-boundaries.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/lint-templates.test.js` | unit | L2 | L0 | - | **WARNING** |
| `unit/images-logic.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/html.test.js` | unit | L2 | L2 | - | **PASS** |

---

### Dávka (Batch) 3

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `unit/html-helpers.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/helpers.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/generate-favicons.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/env.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/config.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/html-helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/generate-favicons.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/env.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/config.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/html-helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/helpers.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/generate-favicons.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/env.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/config.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/html-helpers.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/helpers.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/generate-favicons.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/env.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/config.test.js` | unit | L2 | L2 | - | **PASS** |

---

### Dávka (Batch) 4

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `unit/changed-filter.test.js` | PASS | PASS | PASS | **PASS** |
| `unit/assets.test.js` | PASS | PASS | PASS | **PASS** |
| `smoke/build-artifacts.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/sass.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/sass-structure.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/changed-filter.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/assets.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `smoke/build-artifacts.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/sass.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/sass-structure.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/changed-filter.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `unit/assets.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `smoke/build-artifacts.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/sass.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/sass-structure.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `unit/changed-filter.test.js` | unit | L2 | L2 | - | **PASS** |
| `unit/assets.test.js` | unit | L2 | L2 | - | **PASS** |
| `smoke/build-artifacts.test.js` | smoke | L3 | L2 | - | **WARNING** |
| `integration/sass.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/sass-structure.test.js` | integration | L3 | L2 | - | **WARNING** |

---

### Dávka (Batch) 5

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `integration/process-html.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/process-data.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/mismatched-images.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/images-final.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/full-build.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/process-html.test.js` | PASS | PASS | PASS | PASS | PASS | **FAIL** |
| `integration/process-data.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/mismatched-images.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/images-final.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/full-build.test.js` | PASS | PASS | PASS | PASS | PASS | **FAIL** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/process-html.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/process-data.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/mismatched-images.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/images-final.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/full-build.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/process-html.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/process-data.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/mismatched-images.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/images-final.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/full-build.test.js` | integration | L3 | L2 | - | **WARNING** |

---

### Dávka (Batch) 6

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `integration/fonts.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/debug.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/copy-static.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/clean-build.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/build-prod.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/fonts.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/debug.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/copy-static.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/clean-build.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/build-prod.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/fonts.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/debug.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/copy-static.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/clean-build.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/build-prod.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/fonts.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/debug.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/copy-static.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/clean-build.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/build-prod.test.js` | integration | L3 | L2 | - | **WARNING** |

---

### Dávka (Batch) 7

#### Fáze 1: Importy a Syntaxe
| Soubor | 1.1 | 1.2 | 1.3 | Výsledek |
| :--- | :--- | :--- | :--- | :--- |
| `integration/build-export.test.js` | PASS | PASS | PASS | **PASS** |
| `integration/assets.test.js` | PASS | PASS | PASS | **PASS** |
| `e2e/pages.test.js` | PASS | PASS | PASS | **PASS** |

#### Fáze 2: Jmenné konvence
| Soubor | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/build-export.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/assets.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `e2e/pages.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 3: Dodržování vzorů (Patterns)
| Soubor | 3.1 | 3.2 | 3.3 | 3.4 | 3.5 | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/build-export.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `integration/assets.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `e2e/pages.test.js` | PASS | PASS | PASS | PASS | PASS | **PASS** |

#### Fáze 4a: Hloubkový audit
| Soubor | Tier | Min | Aktuální | Anti-Patterns | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `integration/build-export.test.js` | integration | L3 | L2 | - | **WARNING** |
| `integration/assets.test.js` | integration | L3 | L2 | - | **WARNING** |
| `e2e/pages.test.js` | e2e | L4 | L4 | - | **PASS** |

---


## Fáze 4b: Expertní recenze (Autonomní)

| Soubor | ID | Závažnost (Severity) | [AUTO] Zdůvodnění |
| :--- | :--- | :--- | :--- |
| `visual/parity.test.js` | `AUTO-001` | WARNING | [AUTO] Využití dynamického generování testů (smyčky `for` obalující `it`) snižuje izolaci testů a ztěžuje parciální spouštění nebo debugování konkrétního viewportu v Playwrightu. Sdílený `browser` kontext přesahuje hooky. |
| `unit/sass-helpers.test.js` | `AUTO-002` | NEEDS_REVIEW | [AUTO] Použití `path.resolve('./')` předpokládá, že `process.cwd()` je vždy root repozitáře. Může být křehké, pokud je test spuštěn z jiné složky. |
| `unit/validate-html.test.js` | `AUTO-003` | CRITICAL | [AUTO] Asertace `typeof stream._transform === 'function'` je tautologická a testuje pouze interní implementační detail, nikoliv reálné chování transform streamu s reálnými daty (L0 místo minimálního L2). |
| `e2e/pages.test.js` | `AUTO-004` | WARNING | [AUTO] Chybí explicitní sběr logů konzole prohlížeče v průběhu testu, což může skrýt chyby v klientském JavaScriptu, které nezpůsobí pád celého testu. |

## Fáze 5: Mezery v pokrytí (Coverage Gaps)

### 5.1 Horizontální pokrytí
| Modul / Doména | Unit | Integration | Smoke | E2E | Visual | Výsledek |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `process-html` | PASS | PASS | PASS | PASS | PASS | PASS |
| `process-sass` | PASS | PASS | PASS | PASS | PASS | PASS |
| `process-js`   | PASS | PASS | PASS | PASS | DASH | PASS |
| `process-data` | PASS | PASS | PASS | PASS | DASH | PASS |

### 5.2 Vertikální pokrytí
I/O moduly jsou převážně testovány v integrační vrstvě přes sandbox, což splňuje pravidla. Chybí však robustní L3 test pro `validate-html`. (WARNING)

### 5.3 Exporty
Hranice modulů (module boundaries) jsou pro core utility ověřeny, všechny exporty mají odpovídající mapování na testy.

### 5.4 Autonomní mezery (Autonomous Gaps)
- `[AUTO] AUTO-005`: Pipeline orchestrátor (`gulpfile.js`) nemá dedikovaný test ověřující správnost registrace tasků (aggregace sériových a paralelních běhů). Ačkoliv je testován implicitně v integraci, chybí L2/L3 pojistka logiky sestavování.

## Fáze 6: Závěrečná zpráva a Akční plán (Action Plan)

### Manažerské shrnutí (Executive Summary)
- Celkový počet testovacích souborů: 33
- Selhávající importy / syntaxe (P1): 0
- Selhávající vzory (P3): Různé (viz detail)
- Expertní poznatky ([AUTO]): 5
- Závažné chyby (CRITICAL): 1

### Akční plán (Action Plan)

1. **`unit/validate-html.test.js`** | `AUTO-003` | **CRITICAL** 
   - **Instrukce k nápravě:** Přepište test tak, aby do streamu napumpoval reálný Vinyl soubor (Mock HTML) a verifikoval výstupní stream, místo kontroly přítomnosti metody `_transform`.
   
2. **`visual/parity.test.js`** | `AUTO-001` | **WARNING**
   - **Instrukce k nápravě:** Vyhněte se `for` smyčkám kolem `it`. Extrahujte viewport konfiguraci do parametrizovaných funkcí Playwrightu nebo vytvořte dedikované `it` bloky pro kritické viewporty, zajistěte izolaci kontextu (nový kontext pro každý test).

3. **`e2e/pages.test.js`** | `AUTO-004` | **WARNING**
   - **Instrukce k nápravě:** Přidejte listener `page.on('console', msg => ...)` k zachytávání chyb a `page.on('pageerror')`, které způsobí selhání testu, pokud se objeví nečekaná chyba na klientovi.

4. **`unit/sass-helpers.test.js`** | `AUTO-002` | **NEEDS_REVIEW**
   - **Instrukce k nápravě:** Zvažte změnu `path.resolve('./')` na definovanou proměnnou prostředí nebo konstantní konfiguraci kořene projektu definovanou nadřazeným volajícím.

5. **Pokrytí `gulpfile.js`** | `AUTO-005` | **NEEDS_REVIEW**
   - **Instrukce k nápravě:** Napište L2 smoke/boundary test, který načte `gulpfile.js` a asertuje, že všechny definované exporty a public Gulp tasky jsou přítomny a nevyhodí chybu při parsování definice.


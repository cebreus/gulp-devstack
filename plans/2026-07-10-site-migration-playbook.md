# Plán: Přepis opus-organum.eu a hudebnipodyji.eu na gulp-devstack základ

Datum: 2026-07-10 · Stav: schválený návrh
Předpoklad: dokončený plán `2026-07-10-core-collections-i18n.md` (body 1–7).
Model: **fork-šablona** — každý web = kopie devstacku, dál žije samostatně.

Pořadí: **opus-organum.eu první** (menší, cs/en), hudebnipodyji.eu druhé
(cs/de). Každá fáze = samostatná session.

---

## Výchozí stav migrovaných webů (k 2026-07-10)

Oba weby jsou legacy gulp4 stack (starší generace devstacku) s architekturou
`content/` + `src/templates/` + per-web gulp tasky. Dnešními commity
(hudebnipodyji `8921bf5`, opus `f966d4a`) na nich platí:

- URL koncertu = název souboru `RRRR-MM-DD-<lokalita>.md`; `seo.slug`
  odstraněn z obsahu i CMS, `uid` se injektuje z basename při buildu.
- Jazykové párování heuristikou: shodné jméno → datum+PSČ → jednoznačné
  datum (`gulp-tasks/gulp-check-canonical.js` → `lang_pair_slug`).
- `scripts/normalize-content.js` + GitHub Action vynucují jméno souboru
  z dat (startDate + addressLocality), generují 301 do `static/_redirects`.
- Netlify buildy spouští hodinová Action (`trigger-netlify.yml`), produkce
  `pnpm build`, kvalitu hlídá `netlify-plugin-checklinks` (411 testů).
- Decap CMS jen na hudebnipodyji (`static/admin/config.yml`); opus CMS nemá
  (jen admin/index.html bez configu). PSČ v CMS povinné (párování).

Jazyky: oba weby CS default; podyjí `/de/konzerte/…`, opus `/en/concerts/…`.
Známé anomálie: opus má 2 koncerty jen v CS (2025-01-11-slavkov,
2026-01-10-mikulov) — lang switcher tam vede na výpis (tolerováno).

## Fáze 0 — Fork a nulté commity

1. Kopie devstacku z větve `gulp5` (bez `.git` historie devstacku, nebo
   `git clone` + orphan branch — rozhodnout při realizaci).
2. Commit `chore: fork gulp-devstack@<sha>` — **čistý výchozí stav před
   jakoukoli úpravou**, aby diff webu vůči šabloně byl navždy čitelný.
3. `.env` / `src/config/site.js`: baseUrl, název, jazyky webu.

## Fáze 1 — Jazyková struktura rout

- Default jazyk **cs bez prefixu** (zachovává dnešní URL!):
  - opus: `src/routes/koncerty/…` + `src/routes/en/concerts/…`
  - podyjí: `src/routes/koncerty/…` + `src/routes/de/konzerte/…`
- Lokalizované názvy adresářů = lokalizované URL, nativní vlastnost
  routingu (URL = cesta). Kolekce v `src/config/collections.js`:
  `koncerty` s `itemsDir` per jazyk, `sortBy: startDate`, groupBy rok.
- Statické stránky (festival, kontakt, fotogalerie…) — mapping starých
  `content/pages/*` na routes; pozor: DE/EN stránky mají dnes vlastní
  slugy (`fotogallerie-…`) — **URL parita je požadavek**, adresář se
  pojmenuje podle dnešní veřejné URL, ne podle CS názvu.

## Fáze 2 — Migrace obsahu (jednorázový skript)

Skript `scripts/migrate-from-legacy.js` (spouští se nad starým repem):

1. `content/koncerty/*.md` → `src/routes/koncerty/<basename>.md`;
   DE/EN mutace do prefixovaného adresáře. **Basename se nemění**
   (URL parita).
2. Transformace frontmatter: před zápisem validovat každý klíč proti
   explicitnímu target-schema allowlistu. Allowlist samostatně uvádí root
   fields `entity_status`, `canonical_cs`, `canonical_de`, `canonical_en` a
   SEO fields `canonical`, `canonical_self`, `alternate`; jejich zachování
   nebo odstranění je pro každý field zapsáno ve schématu, nikdy odvozeno z
   prefixu nebo výjimky. Každý neznámý neprázdný klíč migraci zastaví s cestou
   a hodnotou k ručnímu rozhodnutí. Až potom se provedou jen odstranění
   explicitně označená ve schématu (např. potvrzený překlep
   `iclude_to_sitemap`), doplnění `language` z cílové cesty a canonical-order
   řazení.
3. **Vygenerovat `i18nKey` — heuristika se použije naposledy:** shodné
   jméno → datum+PSČ → jednoznačné datum (referenční implementace
   `gulp-tasks/gulp-check-canonical.js` v podyjí). Výstup = explicitní
   klíč v obou souborech (návrh: `koncert-<RRRR-MM-DD>-<cs-lokalita>`).
   Nespárované záznamy vypsat k ručnímu rozhodnutí (opus: slavkov,
   mikulov). Od této chvíle heuristika mizí ze všech pipeline.
4. Report: tabulka co→kam, nespárované položky, allowlistem odstraněné
   klíče a blokující neznámé neprázdné klíče.

## Fáze 3 — Šablony

- `layout-koncert.njk` (detail: program, účinkující, vstupenky, mapa,
  JSON-LD Event — dnes v `koncerty-post.html`).
- Listing partial (dnešní `c-blog__item.njk`) nad kolekcí
  `postsByLanguage` — šablona nefiltruje jazyk, dostává hotový výsek.
- Přepínač jazyků z `page.translations` (bod 1 core plánu) — **nahrazuje
  `lang_pair_slug`**; chybí-li překlad, odkaz na výpis druhého jazyka
  (dnešní tolerované chování).
- hreflang: jen HTML `<link rel="alternate">` (rozhodnutí: žádný
  hreflang v sitemap).

## Fáze 4 — Integrita a automatizace

- Přenést `static/_redirects` **včetně auto-sekce** (obsahuje mj.
  eggenburg→heidenreichstein, ranciřov→rancirov z 2026-07-10 a
  historické přesuny).
- `netlify.toml`: checklinks plugin, headers, build command; hodinový
  `trigger-netlify.yml`; content-check Action (core bod 4) — režim
  auto-fix (dnešní preference uživatele pro tyto weby).
- Interní link-checker (core bod 5) běží i lokálně.

## Fáze 5 — Decap, parita, cutover

1. `public/admin/config.yml` z definice kolekcí (core bod 7); `i18nKey`
   povinné; otestovat v CMS UI vytvoření+editaci záznamu.
2. **Parity check před cutoverem (tvrdá brána):**
   - vytvořit normalizované manifesty starých a nových URL z renderovaných
     artefaktů, ne pouze ze sitemap nebo `find build`; parser zahrne pravidla
     z `_redirects`, trailing slash, percent-encoding a deklarované aliasy;
   - každá legacy URL musí mít právě jeden platný výsledek: buď jednu
     emitovanou cílovou URL, nebo otestovanou HTTP 301 na jednu emitovanou
     URL. Duplicitní, cyklické a neexistující cíle parity check failují;
   - checklinks 0 chyb; hreflang páry kompletní pro spárovaný obsah;
   - vizuální kontrola klíčových stránek (home, výpis, detail, DE/EN).
3. Cutover: přepnout Netlify site na nový repo/větev; starý repo
   archivovat read-only.

## Rizika a rozhodnutí k potvrzení při realizaci

- **URL parita** je nadřazená hezkosti — žádné přejmenovávání při
  migraci; narovnávání jmen až poté content-checkem (s redirecty).
- Cloudinary média zůstávají (jen URL v obsahu, žádná migrace).
- Fotogalerie/media stránky podyjí mají netriviální šablony — vyhradit
  vlastní session.
- Výkon buildů: podyjí \~130 koncertů × 2 jazyky + galerie; ověřit časy
  dev pipeline na reálném obsahu co nejdřív (fáze 1, ne až 5).
- opus běží na větvi `html` — nový repo/větev pojmenovat standardně
  (`main`) a upravit Netlify + Actions odkazy.

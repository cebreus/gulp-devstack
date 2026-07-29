# Plán: Kolekce a i18n vrstva pro gulp-devstack core

Datum: 2026-07-10 · Stav: schválený návrh, čeká na implementaci
Autor analýzy: Claude (session v hudebnipodyji.eu, kompletní architektonický audit)

Každý bod je samostatně spustitelný v novém kontextu (kvůli limitům tokenů).
Do core se implementuje po jednotlivých bodech, ne najednou.

---

## Kontext a motivace (nezbytné pro pochopení „proč“)

**Incident 2026-07 na hudebnipodyji.eu:** Koncert měl v frontmatter `seo.slug`
nezávislý na názvu souboru. Editace v Decap CMS (commit `a23e44a`) slug
rozesynchronizovala → výpisy odkazovaly na neexistující adresář → plugin
checklinks 2 dny shazoval všechny Netlify buildy. Kořenová příčina: **jedna
identita (URL) existovala ve dvou nezávislých reprezentacích** (slug vs.
název souboru). Stejný bug se stal už 2026-06 (commit `b76884b`) — třída
chyb, ne jednorázovost. Transitivní záplata (normalizační bot) je v
hudebnipodyji commit `8921bf5` a opus-organum commit `f966d4a`.

**cebre.us-v3** (založený na devstacku) tentýž problém řeší architektonicky:
URL = fyzická cesta v `src/routes/`, žádné slug pole neexistuje, překlady
páruje explicitní `i18nKey`. Viz `cebre.us-v3/memories/architectural-gotchas.md`
→ „CMS-Friendly i18n Routing“ (2026-07-09).

**Devstack core (větev `gulp5`) dnes neobsahuje nic z toho** — žádný
`language`, `i18nKey`, žádné kolekce. Vše žije jen v cebre.us-v3
(`gulp/utils/blog-collections.js`, commit `1c3b7e3` pro hreflang).

**Cíl:** devstack = základ, na který se přepíší opus-organum.eu (cs/en)
a hudebnipodyji.eu (cs/de). Viz sesterský plán
`2026-07-10-site-migration-playbook.md`.

## Schválená architektonická rozhodnutí (uživatel, 2026-07-10)

1. **Jedna reprezentace identity:** URL = fyzická cesta v `src/routes/`.
   Žádné `seo.slug`, žádné ruční `uid`. Odvozené hodnoty se počítají při
   buildu, nikdy neskladují ve frontmatter.
2. **Výchozí jazyk je explicitní konfigurace:** `site.defaultLanguage` je
   povinný BCP 47 kód. Root route `/` vždy znamená právě tento jazyk; ostatní
   jazyky mají prefix adresáře (`/cs/`, `/de/`, `/en/`). Root se tak používá
   pro párování `i18nKey`, `x-default` i výchozí Decap folder. Lokalizované
   slugy jsou důsledek (klaster-geras vs. stift-geras).
3. **Párování překladů = explicitní `i18nKey`** ve frontmatter, build-time
   validovaný. Žádné heuristiky (datum+PSČ z přechodné záplaty se
   NEPŘENÁŠÍ do core — použije se jen jednorázově při migraci k
   vygenerování klíčů).
4. **hreflang POUZE v HTML** (`<link rel="alternate" hreflang>`). Sitemap
   zůstává bez `xhtml:link` alternates — Google doporučuje zvolit jednu
   metodu; duplikace zvyšuje riziko nekonzistentních signálů a údržbu.
5. **Decap CMS zůstává** a jeho limity jsou vstupní podmínka: neumí
   přejmenovat soubor, commituje přímo do větve. Kompenzace = bod 4.
6. **Model fork-šablona:** každý web = kopie devstacku, žije vlastním
   životem. Core musí být kompletní v okamžiku forku.

---

## Bod 1 — Upstream i18n vrstvy z cebre.us-v3

**Co:** Přenést `language`, `i18nKey`, `translations` + hreflang rendering.
Zdroj: `cebre.us-v3/gulp/utils/html-rendering.js` (funkce
`buildTemplateContext`, commit `1c3b7e3`) a
`src/lib/components/meta-rich-snippets/seo.njk` (hreflang blok + x-default).

**Proč:** Základ všeho ostatního; bez `language`/`i18nKey` nejde párovat.

**Jak (nad rámec prostého kopírování):**

- Lookup překladů v v3 prochází jen `menu.menu` + `blogPostCollections.posts`.
  Zobecnit na **registr všech stránek** (process-data už generuje JSON
  artefakt pro každou stránku — agregovat `{ i18nKey, language, path }`
  do `.temp/pages-registry.json`).
- `language` odvodit výhradně z cesty: `/` je `site.defaultLanguage` a
  prefix je jeho explicitní alternativa. Frontmatter `language` musí přesně
  souhlasit s odvozenou hodnotou; chybějící nebo odlišná hodnota je build
  error, nikdy fallback. Stejné pravidlo platí při tvorbě registru,
  párování, `x-default` a pro Decap folder.

**DoD:** unit testy v `tests/unit` (párování, root = `defaultLanguage`,
x-default jen když existuje default-jazyková verze, mismatch cesty a
frontmatter failuje), hreflang v HTML výstupu integračního testu.

## Bod 2 — Konfigurovatelné kolekce

**Co:** Zobecnit `cebre.us-v3/gulp/utils/blog-collections.js` na kolekce
definované v `src/config/collections.js`:

```js
// návrh API — jediná definice kolekce pro build i (později) CMS
export const collections = [{
  name: 'blog',
  itemsDir: 'blog/posts',      // per jazyk: cs/blog/posts, de/blog/posts…
  layout: 'layout-post.njk',
  sortBy: 'date', sortOrder: 'desc',
  groupBy: (item) => new Date(item.date).getUTCFullYear(),
}]
```

**Proč:** koncerty = kolekce s `startDate`/`location` a groupBy rok;
blog = kolekce s `date`. Stejný mechanismus, konfigurace místo kopií kódu.

**Jak:**

- `resolveBlogPostRoutePath` (strip segmentu `posts/`) zobecnit: poslední
  segment `itemsDir` se z URL stripuje.
- Render detailů podle vzoru `renderBlogPostPages` v
  `cebre.us-v3/gulp/tasks/process-html.js` (iterace `routedPosts` →
  `env.render(layout, context)`).
- Kolekce partition podle jazyka centrálně (vzor `groupByLanguage`) —
  šablony nikdy nefiltrují jazyk samy.

**DoD:** blog v devstack showcase běží přes novou konfiguraci; testy na
řazení/groupBy/drafty; dokumentace (bod 8).

## Bod 3 — Build-time validace i18nKey

**Co:** Nový krok v process-data: (a) duplicitní `i18nKey` v témže jazyce
\= **fail build** s výpisem souborů; (b) `i18nKey` bez protějšku v jiném
jazyce = **warn** + souhrnná tabulka (legitimní stav pro nepřeložený obsah).

**Proč:** v3 dnes překlep v klíči tiše zahodí hreflang — nulová
diagnostika. Zero-trust přístup devstacku vyžaduje validaci.

**DoD:** testy: duplicita failuje, sirotek warnuje, čistý stav mlčí.

## Bod 4 — content-check: invarianty obsahu (kompenzace Decapu)

**Co:** `scripts/content-check.js` s per-kolekce pravidly:

1. **Šablona názvu souboru z frontmatter polí**, např. pro koncerty
   `{startDate|date}-{location.addressLocality|slug}`. Default režim:
   **fail s návrhem správného jména**. Volitelný `--fix`: přejmenuje,
   zapíše 301 do auto-sekce `static/_redirects`, přepíše odkazy v MD.
2. Validace i18nKey (sdílí kód s bodem 3).
3. GitHub Action šablona (běh po pushi, commit narovnání zpět).

**Proč:** Decap neumí přejmenovat soubor. Editor změní město/datum v CMS
a jméno souboru (=URL) zamrzne — přesně mechanismus incidentu 2026-07.

**Jeden canonical naming contract:** `src/config/content-naming.js` je jediný
zdroj pravidel pro `content-check`, normalizaci i generovaný Decap config.
Exportuje builder filename a Decap filename template; CMS config se z něj
generuje, nesmí kopírovat vlastní slug pravidla. Builder normalizuje Unicode
na NFD, odstraní diakritiku, převádí `ß` na `ss`, odstraní závorky, zachová
čárky v názvu místa, normalizuje oddělovače na `-` a formátuje datum v
`Europe/Prague` jako `YYYY-MM-DD`. Kolize se nejdřív seskupí podle base
canonical názvu a v každé skupině se seřadí stabilně podle normalizované
route-relative cesty (Unicode code-point order); první položka získá base
název, další `-2`, `-3`… v tomto pořadí. Pořadí z adresáře ani pořadí
zpracování nesmí ovlivnit již přidělené jméno. Redirecty kolabují `a→b→c`
na `a→c` a self-redirecty se odstraní. Před jakýmkoli zápisem se graf
redirectů projde; cyklus o dvou či více uzlech je hard error s úplným
řetězcem a operace nezapíše žádné soubory ani `_redirects`. Default scope
jsou jen budoucí záznamy (`--all` je plný sweep). Action chrání smyčku přes
`github.actor`.

**DoD:** golden testy společného builderu pokrývají akcenty, `ß`, závorky,
čárky a další interpunkci, datum na hraně časového pásma, stabilní pořadí
kolizí a cyklus redirectů o více uzlech. Stejné vstupy musí vytvořit shodný
Decap filename i validační návrh; druhý běh nad už canonical souborem nesmí
navrhnout další přejmenování. Test cyklu ověří selhání před zápisem bez změny
souborů a `_redirects`.

**Pozn. k defaultu:** v podyjí běží auto-fix (rozhodnutí uživatele pro
starou architekturu). Pro core je default **fail-s-návrhem** a `--fix`
si zapne projekt — fork si zvolí režim v konfiguraci.

**DoD:** testy na slugifikaci, kolize, redirect kolaps a golden contract;
dry-run výstup čitelný; dokumentace režimů.

## Bod 5 — Interní link-checker (zero-trust dotažení)

**Co:** Nativní task: po renderu zkontrolovat interní `href`/`src` proti
množině vygenerovaných cest. `build`/`export` = fail, `dev` = warn.

**Proč:** `validate-html.js` kontroluje strukturu/a11y, ne cíle odkazů.
Incident 2026-07 odhalil až `netlify-plugin-checklinks` — tedy pozdě
(v deploy pipeline) a jen na Netlify. Devstack hlásá „zero-trust
validation“; odkazová integrita do ní patří lokálně.

**DoD:** test s úmyslně rozbitým odkazem failuje build; respektuje
`_redirects` (odkaz na redirectovanou URL = warn, ne fail).

## Bod 6 — Drafty kompatibilní s CMS

**Co:** `isDraft: true` ve frontmatter = jediná draft cesta pro CMS
obsah. Prefix `_` v názvu (stávající `isPrivateFile`) zůstává jako
IDE-only konvence a do CMS kolekcí se nesmí používat.

**Proč:** Decap neumí přejmenovat soubor → draft přes `_` prefix nejde
z CMS nikdy publikovat. (v3 už `isDraft` filtruje v `isPublicPost`.)

**DoD:** dokumentace + test, že `isDraft` položka nevzniká v routingu,
sitemapě ani kolekcích.

## Bod 7 — Decap šablona odvozená z definice kolekcí

**Co:** Generovaný `public/admin/config.yml`: folder kolekce míří pro
`defaultLanguage` do `src/routes/<itemsDir>` a pro ostatní jazyky do
`src/routes/<lang>/<itemsDir>`. Filename template se generuje z téhož
canonical naming contractu jako bod 4, `i18nKey` je povinné pole
s hintem, `slug: encoding: ascii, clean_accents: true` globálně.
`language` je generované/omezené na jazyk folderu. Config vzniká z
`collections.js` a `content-naming.js`; ruční 1:1 kopie není přípustná.

**Proč:** dnes se definice kolekce duplikuje mezi buildem a CMS ručně
(podyjí config.yml \~800 řádků) a rozchází se.

**DoD:** funkční admin pro showcase blog kolekci; ověřit v CMS UI
(vytvoření záznamu, editace) — buildem to ověřit nejde.

## Bod 8 — Dokumentace

**Co:** Nový `docs/COLLECTIONS-I18N.md` (kolekce, jazyky, i18nKey,
content-check, drafty); rozšířit `ROUTING.md` (jazykové prefixy) a
`TEMPLATE-DATA.md` (`language`, `i18nKey`, `translations`); zápis do
memories ve stylu „architectural-gotchas“.

---

## Pořadí a závislosti

- 1 → 2 → 3 sekvenčně (každý bod = samostatná session/PR).
- 4, 5, 6 nezávislé na sobě, vyžadují 1+2.
- 7 po 2 (potřebuje definici kolekcí). 8 průběžně, finálně po 7.

## Co se do core vědomě NEPŘENÁŠÍ

- Heuristické párování jazyků datum+PSČ/datum (přechodná záplata ve
  starých webech; nahrazeno i18nKey).
- `lang_pair_slug` mechanismus (gulp-check-canonical) — nahrazen
  `translations` z bodu 1.
- `seo.slug` v jakékoli podobě.
- hreflang v sitemap.xml (rozhodnutí 4 výše).

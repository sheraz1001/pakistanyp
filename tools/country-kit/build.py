#!/usr/bin/env python3
"""
Country kit: generate a country site (SaudiYP, IndiaYP, ...) from this repository (the template).

    python3 tools/country-kit/build.py <pack-dir> <out-dir> [--seed <postgres-url>]

<pack-dir> is a country pack (see tools/country-kit/COUNTRY-KIT.md):
    pack.json            names, codes, colours, extra text replacements
    country-config.ts    the `const SITE: CountryConfig = {...};` block for shared/country.ts
    places.ts            REGIONS / TERRITORIES          -> shared/countries/places.ts
    categories.ts        CATEGORY_TREE                  -> shared/countries/categories.ts
    locale.ts            phone format, legal forms, ... -> shared/countries/locale.ts
    content/             places/{provinces,cities}, news, blog markdown -> content/
    brand/               logo.png, logo-104.png, mark.png, icon-512.png [, logo-white.png]
    root/                optional files copied over the repository root (README.md, DEPLOY.md, BRAND.md)

<out-dir> is usually a clone of the country's repository: everything except .git and
node_modules is replaced. With --seed, server/sql/init.sql gets the country's reference data
(regions, cities, localities, categories) so a new database starts complete.
"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parents[2]
KIT = Path(__file__).resolve().parent

TEXT_EXT = {".ts", ".tsx", ".js", ".cjs", ".mjs", ".json", ".html", ".css", ".md", ".sql", ".sh", ".txt", ".xml", ".svg", ".yml", ".yaml", ".toml", ""}
# Template files that every pack replaces (never copied)
SKIP = [
    r"^content/", r"^tools/", r"^BRAND\.md$",
    r"^shared/countries/(places|categories|locale)\.ts$",
    r"^(client/)?public/(logo/|icons/|content/)", r"^(client/)?public/assets/pakistanyp-",
    r"^(client/)?public/(favicon\.(ico|png)|logo\.png|og-homepage\.jpg|apple-touch-icon\.png|android-chrome-.*\.png)$",
]
# Pakistan-specific words that must not survive outside data and content
LEAKS = r"\b(Pakistan\w*|Karachi|Lahore|Islamabad|Rawalpindi|Peshawar|Quetta|Multan|Faisalabad|Punjab|Sindh|Balochistan|Khyber|Gilgit|Clifton|Gulberg|DHA|PECHS|F-7|G-9|G-11|Blue Area|NTN|FBR|SECP|STRN|PMDC|PEC|CNIC|NADRA|Urdu|Nastaliq|PKR|0300|darzi)\b|\+92\b"


def sh(cmd, **kw):
    print("  $", cmd if isinstance(cmd, str) else " ".join(map(str, cmd)))
    return subprocess.run(cmd, shell=isinstance(cmd, str), check=True, **kw)


def replacements(p):
    lower_brand = p["slug"]
    cap = lower_brand[0].upper() + lower_brand[1:]
    pairs = [
        ("Pakistan Yellow Pages", p["directoryName"]),
        ("Noto Nastaliq Urdu", p["font"]),
        ("Noto+Nastaliq+Urdu", p["font"].replace(" ", "+")),
        ("PAKISTANYP", p["brand"].upper()),
        ("PakistanYP", p["brand"]),
        ("Pakistanyp", cap),
        ("pakistanyp", lower_brand),
        ("PAKISTAN", p["country"].upper()),
        ("Pakistan's", p["countryPossessive"]),
        ("Pakistani", p["adjective"]),
        ("Pakistan", p["country"]),
        ("'pakistan'", f"'{p['country'].lower()}'"),
        ("Asia/Karachi", p["timezone"]),
        ("en-PK", p["locale"]),
        ("en_PK", p["locale"].replace("-", "_")),
        ("PKR", p["currency"]),
        ("+92", p["phonePrefix"]),
        ("Urdu", p["language"]),
    ]
    pairs += [tuple(x) for x in p.get("replace", [])]
    return pairs


def transform(text, pairs, colors, place_map={}):
    for a, b in pairs:
        text = text.replace(a, b)
    if place_map:
        # one pass, so a mapped name is never mapped again (e.g. Rawalpindi -> Hyderabad -> ...)
        table = {**place_map, **{a.lower(): b.lower().replace(" ", "-").replace(".", "") for a, b in place_map.items()}}
        names = sorted(table, key=len, reverse=True)
        text = re.sub(r"(?<![\w-])(%s)(?![\w-])" % "|".join(map(re.escape, names)), lambda m: table[m.group(1)], text)
    for a, b in colors.items():
        text = re.sub(re.escape(a), b, text, flags=re.I)
    return text


def fill_tokens(text, counts):
    for k, v in counts.items():
        text = text.replace("{{%s}}" % k, f"{v:,}")
    return text


def pack_counts(out):
    """Counts of regions/cities/localities/categories, read with tsx from the pack's data files."""
    script = f"""
import {{ REGIONS }} from "{out}/shared/countries/places.ts";
import {{ parseCategoryTree }} from "{out}/shared/countries/categories.ts";
const cities = REGIONS.flatMap((r: any) => r.cities || []);
const rows = parseCategoryTree();
console.log(JSON.stringify({{ REGIONS: REGIONS.length, CITIES: cities.filter((c: any) => !c.locality).length,
  LOCALITIES: cities.filter((c: any) => c.locality).length, CATEGORIES: rows.length, SECTORS: rows.filter((r: any) => r.level === 1).length }}));
"""
    tmp = TEMPLATE / "scripts" / ".kit-counts.ts"
    tmp.write_text(script)
    try:
        res = subprocess.run(["npx", "tsx", str(tmp)], cwd=TEMPLATE, capture_output=True, text=True)
        if res.returncode:
            sys.exit(res.stderr)
        out = res.stdout
    finally:
        tmp.unlink()
    return json.loads(out.strip().splitlines()[-1])


def build_assets(pack, out, p):
    """Logo renditions, favicons and app icons from the pack's brand/ masters."""
    from PIL import Image
    b = pack / "brand"
    slug = p["slug"]
    logo = Image.open(b / "logo.png").convert("RGBA")
    header = Image.open(b / "logo-104.png").convert("RGBA") if (b / "logo-104.png").exists() else logo
    mark = Image.open(b / "mark.png").convert("RGBA")
    icon = Image.open(b / "icon-512.png").convert("RGBA")
    white = Image.open(b / "logo-white.png").convert("RGBA") if (b / "logo-white.png").exists() else logo

    def h(img, height):
        return img.resize((round(img.width * height / img.height), height), Image.LANCZOS)

    def sq(size):
        return icon.resize((size, size), Image.LANCZOS)

    def maskable(size):
        tile = Image.new("RGBA", (size, size), "white")
        inner = icon.resize((round(size * .78),) * 2, Image.LANCZOS)
        tile.paste(inner, ((size - inner.width) // 2,) * 2, inner)
        return tile

    for pub in (out / "client/public", out / "public"):
        (pub / "logo").mkdir(parents=True, exist_ok=True)
        (pub / "icons").mkdir(parents=True, exist_ok=True)
        (pub / "assets").mkdir(parents=True, exist_ok=True)
        if pub.name == "public" and pub.parent == out:
            pass
        logo.save(pub / "logo.png")
        logo.save(pub / f"assets/{slug}-logo.png")
        white.save(pub / f"assets/{slug}-logo-white.png")
        sq(180).save(pub / "apple-touch-icon.png")
        sq(192).save(pub / "android-chrome-192x192.png")
        sq(512).save(pub / "android-chrome-512x512.png")
        sq(32).save(pub / "favicon.png")
        sq(48).save(pub / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
        for s in (16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512):
            sq(s).save(pub / f"icons/icon-{s}x{s}.png")
        for s in (192, 512):
            maskable(s).save(pub / f"icons/maskable-{s}x{s}.png")
    pub = out / "client/public/logo"
    logo.save(pub / f"{slug}-logo.png")
    hd = h(header, 104)
    hd.save(pub / f"{slug}-logo-104.png")
    hd.save(pub / f"{slug}-logo-104.webp", quality=90)
    mark.save(pub / f"{slug}-mark.png")
    mk = h(mark, 104)
    mk.save(pub / f"{slug}-mark-104.png")
    mk.save(pub / f"{slug}-mark-104.webp", quality=90)
    sq(180).save(pub / "apple-touch-icon.png")
    sq(32).save(pub / "favicon-32.png")
    sq(48).save(pub / "favicon-48.png")
    sq(192).save(pub / "icon-192.png")
    sq(512).save(pub / "icon-512.png")
    print(f"  assets: logo {hd.width}x104, mark {mk.width}x104 (country-config logo.width104 / markWidth104 should match)")


def build_images(pack, out, p, content_dir):
    """OG image and article covers (rendered with Playwright from the logo)."""
    covers = []
    for md in sorted(content_dir.glob("*/*.md")):
        if md.parent.parent.name == "places":
            continue
        fm = re.match(r"---\n(.*?)\n---", md.read_text(), re.S)
        meta = dict(re.findall(r"^(\w+):\s*(.*)$", fm.group(1), re.M)) if fm else {}
        img = meta.get("image", "")
        if img.startswith("/content/") and not (out / "client/public" / img.lstrip("/")).exists():
            tag, title, sub = p.get("covers", {}).get(Path(img).stem) or ["News" if md.parent.name == "news" else "Guide", meta.get("title", "")[:60], (meta.get("summary") or meta.get("excerpt", ""))[:120]]
            covers.append({"file": str(out / "client/public" / img.lstrip("/")), "tag": tag, "title": title, "sub": sub})
    job = {"logo": str(out / f"client/public/logo/{p['slug']}-logo-104.png"), "mark": str(out / f"client/public/logo/{p['slug']}-mark.png"),
           "colors": p["colors"], "og": [str(out / "client/public/og-homepage.jpg"), str(out / "public/og-homepage.jpg")],
           "ogHeadline": p.get("ogHeadline", f"Find, compare and contact businesses <span>across {p['country']}.</span>"),
           "ogCities": p.get("ogCities", []), "covers": covers}
    (out / ".kit-images.json").write_text(json.dumps(job))
    try:
        sh(["node", str(KIT / "images.cjs"), str(out / ".kit-images.json")])
    finally:
        (out / ".kit-images.json").unlink()


def strip_reference_data(sql):
    """Template init.sql minus the template country's regions/places/categories rows."""
    keep = [l for l in sql.splitlines(True)
            if not re.match(r"INSERT INTO public\.(categories|localities|provinces|catalog_sync_state) ", l)
            and not re.match(r"SELECT pg_catalog\.setval\('public\.(categories|cities|localities|provinces)_id_seq'", l)]
    return "".join(keep)


def main():
    args = sys.argv[1:]
    seed = None
    if "--seed" in args:
        i = args.index("--seed"); seed = args[i + 1]; del args[i:i + 2]
    pack, out = Path(args[0]).resolve(), Path(args[1]).resolve()
    p = json.loads((pack / "pack.json").read_text())
    pairs, colors = replacements(p), p.get("colors", {})
    print(f"[kit] {p['brand']} from {TEMPLATE} -> {out}")

    # 1. clean the output (keep .git and node_modules)
    out.mkdir(parents=True, exist_ok=True)
    for e in out.iterdir():
        if e.name in (".git", "node_modules"):
            continue
        shutil.rmtree(e) if e.is_dir() and not e.is_symlink() else e.unlink()

    # 2. copy + transform template files
    files = subprocess.run(["git", "ls-files"], cwd=TEMPLATE, check=True, capture_output=True, text=True).stdout.split("\n")
    files = [f for f in files if f and not any(re.search(s, f) for s in SKIP) and (TEMPLATE / f).exists()]
    for f in files:
        src = TEMPLATE / f
        dst_rel = f.replace("pakistanyp", p["slug"])
        dst = out / dst_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if f == "server/sql/init.sql":
            dst.write_text(transform(strip_reference_data(src.read_text()), pairs, colors))
        elif src.suffix in TEXT_EXT and f != "package-lock.json":
            dst.write_text(transform(src.read_text(), pairs, colors, p.get("placeMap", {})))
        else:
            shutil.copy2(src, dst)
    print(f"  {len(files)} template files")

    # 3. user-facing "Province" wording -> the country's region term
    one, many = p["regionTerm"]
    sh(["node", str(KIT / "region-terms.cjs"), str(out), one, many, p["regionsPhrase"][0], p["regionsPhrase"][1]])

    # 4. country config block, data files, locale
    cfg = out / "shared/country.ts"
    text = cfg.read_text()
    text = re.sub(r"// <country-code>.*?// </country-code>", f'// <country-code>\nexport type CountryCode = "{p["code"]}";\n// </country-code>', text, flags=re.S)
    text = re.sub(r"(// <country-config>[^\n]*\n).*?(// </country-config>)", lambda m: m.group(1) + (pack / "country-config.ts").read_text().strip() + "\n" + m.group(2), text, flags=re.S)
    cfg.write_text(text)
    (out / "shared/countries").mkdir(parents=True, exist_ok=True)
    for name in ("places", "categories", "locale"):
        shutil.copy2(pack / f"{name}.ts", out / f"shared/countries/{name}.ts")

    # 5. content (counts substituted) and root overlays
    counts = pack_counts(out)
    print(f"  counts: {counts}")
    for src in (pack / "content").rglob("*.md"):
        dst = out / "content" / src.relative_to(pack / "content")
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(fill_tokens(src.read_text(), counts))
    if (pack / "root").exists():
        shutil.copytree(pack / "root", out, dirs_exist_ok=True)
    if (pack / "public").exists():
        shutil.copytree(pack / "public", out / "client/public", dirs_exist_ok=True)

    # 6. brand assets, OG image, article covers
    build_assets(pack, out, p)
    build_images(pack, out, p, out / "content")

    # 7. leak scan (code only; data files and content are the pack's own)
    leaks = []
    for f in out.rglob("*"):
        rel = f.relative_to(out).as_posix()
        if f.is_dir() or rel.startswith((".git/", "node_modules/", "content/", "dist/")) or rel.startswith("shared/countries/") \
                or f.suffix not in TEXT_EXT or rel in ("package-lock.json", "server/categoryRedirects.json"):
            continue
        for n, line in enumerate(f.read_text(errors="ignore").splitlines(), 1):
            for m in re.finditer(LEAKS, line):
                leaks.append(f"{rel}:{n}: {m.group(0)} | {line.strip()[:140]}")
    (out / ".kit-leaks.txt").write_text("\n".join(leaks))
    print(f"  leak scan: {len(leaks)} hit(s){' -> .kit-leaks.txt' if leaks else ''}")

    # 8. optional: bake reference data into init.sql
    if seed:
        seed_init(out, seed)
    print("[kit] done")


def seed_init(out, url):
    """Load the schema into an empty database, run the catalog sync, dump the reference rows into init.sql."""
    init = out / "server/sql/init.sql"
    sh(["psql", url, "-q", "-v", "ON_ERROR_STOP=1", "-f", str(init)], stdout=subprocess.DEVNULL)
    env = dict(os.environ, DATABASE_URL=url, DATABASE_DRIVER="pg", INDEXNOW_DISABLED="true")
    sh(["npx", "tsx", "scripts/seed.ts"], cwd=out, env=env)
    dump = subprocess.run(["pg_dump", url, "--data-only", "--inserts", "--no-owner", "--no-privileges",
                           "-t", "public.provinces", "-t", "public.localities", "-t", "public.categories", "-t", "public.catalog_sync_state"],
                          check=True, capture_output=True, text=True).stdout
    rows = [l for l in dump.splitlines(True) if l.startswith(("INSERT INTO", "SELECT pg_catalog.setval"))]
    # catalog_sync_state is created by the sync itself; init.sql must create it before the rows
    extra = "CREATE TABLE IF NOT EXISTS public.catalog_sync_state (key text PRIMARY KEY, value text NOT NULL);\n"
    init.write_text(init.read_text() + "\n-- Reference data generated by tools/country-kit (regions, cities, localities, categories)\n" + extra + "".join(rows))
    print(f"  init.sql: +{len(rows)} reference rows")


if __name__ == "__main__":
    main()

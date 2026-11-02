# Writing brief: the site brand (IndiaYP or SaudiYP) place guides

This site (IndiaYP, indiayp.com, or SaudiYP, saudiyp.com, as stated in your task) is a business directory. Each province and major city page gets a
unique, genuinely useful guide for people looking for businesses and services there. Google penalises thin,
templated, mass-produced text, so every guide must be specific to its place, accurate and useful.

## File format (exactly)
Markdown file with YAML-style front matter (one `key: value` per line, no quotes needed, no colons inside values
except in metaTitle/metaDescription where a dash is preferred):

```
---
metaTitle: <= 60 characters, e.g. "Lahore Business Directory – Companies & Services | the site brand (IndiaYP or SaudiYP)"
metaDescription: 140–158 characters, specific to the place, no clickbait
summary: one plain sentence (max 200 chars) describing the place for business seekers
---
<intro: 2 short paragraphs, what the place is and why it matters commercially>

## Key facts
- **<Label>:** <value>
(5–8 bullets: province/administrative status, capital or seat, population with year and source type
 e.g. "Population (2023 census, district):", telephone area code, notable industries, airport, etc.)

## Economy and main industries
## Main business areas and markets
   (name real commercial areas, markets, industrial estates; mention localities that exist in our data
    where natural – list for the city is in the places file named in your task)
## <one more place-specific section, e.g. "Getting around", "Trade and exports", "Tourism and hospitality">
## Finding businesses in <Place>
   (2–4 sentences: which kinds of businesses people commonly look for there; mention the site brand (IndiaYP or SaudiYP) at most once,
    plainly, no hype)
## Frequently asked questions
### <Question>?
<Answer, 1–3 sentences>
(3–4 Q&As people really ask, e.g. area code, main markets, business registration office, chamber of commerce)

<!-- sources: list the URLs you used to verify facts, one per line -->
```

## Rules
- Length: provinces 650–900 words; cities 500–750 words (excluding front matter and the sources comment).
- Facts: every number or specific claim (population, area codes, rankings, "largest", founding dates, names of
  markets, chambers, industrial estates) must be checked with WebSearch / WebFetch against reliable sources
  (the latest official census or statistics agency (India: Census of India 2011 and official state data; Saudi: GASTAT Saudi Census 2022), official government / chamber of commerce sites, Wikipedia as a
  secondary check). If you cannot verify something, leave it out. Never invent figures.
- Prefer the latest official census figures (India 2011 census; Saudi 2022 census); say exactly what the number covers (city, district or division).
- Tone: clear, neutral, practical, British English spelling. No superlatives you can't support,
  no "nestled", "vibrant tapestry", "bustling hub", "rich heritage" clichés, no emojis, no exclamation marks.
- Each guide must read differently: different angles, different FAQ questions where the place differs.
- Politically sensitive topics: describe disputed areas only
  in the administrative terms the site's country uses, factually and without commentary.
- Only plain Markdown: paragraphs, `##`/`###` headings, `- ` bullets, `**bold**`. No links, tables, images or HTML
  (except the final sources comment).
- Do not edit any other file in the repository.

When done, report: files written, word count per file, and any facts you deliberately left out.

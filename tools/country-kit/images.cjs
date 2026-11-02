// Country kit: render the homepage OG image and article cover images with Playwright.
// Usage: node images.cjs <job.json>   (written by build.py)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const job = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const data = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;
const logo = data(job.logo);
const mark = data(job.mark);
const c = (hex) => job.colors[hex] || hex;
const GREEN = c("#0B6B2E"), DEEP = c("#05501F"), ACTION = c("#E3A82B");
const fonts = `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Geist:wght@500;600;700&display=swap" rel="stylesheet">`;

(async () => {
  const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((f) => f && fs.existsSync(f) && fs.statSync(f).isFile());
  const b = await chromium.launch(exe ? { executablePath: exe } : {}).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const shot = async (html, files) => {
    await p.setContent(`<html><head>${fonts}</head><body style="margin:0">${html}</body></html>`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    for (const file of [].concat(files)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await p.screenshot({ path: file, type: "jpeg", quality: 86 });
    }
  };

  await shot(`<div style="width:1200px;height:630px;background:#FAF8F3;font-family:Geist;position:relative;overflow:hidden">
<div style="position:absolute;top:0;left:0;right:0;height:10px;background:${GREEN}"></div>
<img src="${mark}" style="position:absolute;right:-60px;top:40px;height:560px;opacity:.08">
<div style="position:absolute;left:72px;top:80px"><img src="${logo}" style="height:96px"></div>
<div style="position:absolute;left:72px;top:290px;font:700 58px Geist;letter-spacing:-.04em;line-height:1.08;color:#0A0A0A;max-width:1000px">${job.ogHeadline.replace("<span>", `<span style="color:${GREEN}">`)}</div>
<div style="position:absolute;left:72px;bottom:64px;display:flex;gap:12px;font:500 24px Geist;color:#3A4354">${job.ogCities
    .map((e) => `<span style="background:#fff;border:1.5px solid #E3E6EC;border-radius:999px;padding:8px 18px">${e}</span>`)
    .join("")}</div></div>`, job.og);

  job.covers.forEach((cv, i) => (cv.bg = i % 2 ? DEEP : GREEN));
  for (const cv of job.covers) {
    await shot(`<div style="width:1200px;height:630px;overflow:hidden;font-family:Geist;background:${cv.bg};position:relative">
<div style="position:absolute;inset:0;background:radial-gradient(circle at 85% 30%, rgba(255,255,255,.14), transparent 45%)"></div>
<img src="${mark}" style="position:absolute;right:-40px;bottom:-30px;height:560px;opacity:.16;filter:grayscale(1) brightness(3)">
<div style="position:absolute;top:0;left:0;right:0;height:10px;background:${ACTION}"></div>
<div style="position:absolute;left:150px;top:56px;background:#fff;border-radius:16px;padding:12px 18px"><img src="${logo}" style="height:44px;display:block"></div>
<div style="position:absolute;left:154px;top:200px;display:inline-block;background:${ACTION};color:#141414;font:700 20px Geist;border-radius:999px;padding:8px 18px;letter-spacing:.02em">${cv.tag}</div>
<div style="position:absolute;left:152px;top:262px;right:150px;color:#fff;font:800 60px/1.05 Montserrat;letter-spacing:-.03em">${cv.title}</div>
<div style="position:absolute;left:154px;bottom:70px;right:200px;color:#EEF3EF;font:500 26px/1.35 Geist">${cv.sub}</div>
</div>`, cv.file);
  }
  await b.close();
  console.log(`  images: og + ${job.covers.length} cover(s)`);
})().catch((e) => { console.error(e); process.exit(1); });

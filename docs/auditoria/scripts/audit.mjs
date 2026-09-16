// Auditoria automatizada local (build de produção servido por `vite preview`).
// Saída: JSON + screenshots em ./out. Não substitui certificação de acessibilidade.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://127.0.0.1:4173";
const OUT = path.resolve("out");
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ["/", "/diagnostico", "/portfolio", "/conteudos", "/faq", "/privacidade", "/rota-inexistente-xyz"];
const WIDTHS = [360, 390, 768, 1440];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const report = {};

for (const route of ROUTES) {
  report[route] = {};
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 800 : 900 }, deviceScaleFactor: 1, locale: "pt-BR" });
    // Simula consentimento já recusado para não cobrir a tela nas capturas "limpas"; captura separada com banner na home 390.
    const page = await ctx.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleErrors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
    page.on("requestfailed", (r) => failedRequests.push(`${r.failure()?.errorText} ${r.url().slice(0, 140)}`));
    page.on("response", (r) => { if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.url().slice(0, 140)}`); });

    await page.addInitScript(() => { try { sessionStorage.setItem("bw-splash", "1"); } catch {} });
    const t0 = Date.now();
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const loadMs = Date.now() - t0;

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const overflowX = de.scrollWidth > de.clientWidth + 1;
      // elementos que extrapolam a largura
      const wide = [];
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 2 && getComputedStyle(el).position !== "fixed") {
          if (wide.length < 8) wide.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""} right=${Math.round(r.right)}`);
        }
      });
      const h1s = [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().replace(/\s+/g, " ").slice(0, 100));
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => h.tagName + ": " + h.textContent.trim().replace(/\s+/g, " ").slice(0, 70));
      const imgs = [...document.images];
      const imgNoAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
      const imgEmptyAlt = imgs.filter((i) => i.getAttribute("alt") === "").length;
      const imgBroken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 120)).slice(0, 10);
      const imgRemote = imgs.filter((i) => /lovable\.app/.test(i.currentSrc || i.src)).length;
      // alvos de toque pequenos (links/botões visíveis < 44px em qualquer dimensão)
      const small = [];
      document.querySelectorAll("a[href],button,input,select,textarea,[role=button]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") return;
        if (r.width < 24 || r.height < 24) small.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      const title = document.title;
      const desc = document.querySelector('meta[name="description"]')?.content || "";
      const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
      const robots = document.querySelector('meta[name="robots"]')?.content || "";
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { const j = JSON.parse(s.textContent); return j["@type"] || (j["@graph"] ? "graph:" + j["@graph"].map((g) => g["@type"]).join("+") : "?"); } catch { return "INVALID_JSON"; } });
      const lang = document.documentElement.lang;
      const links = [...document.querySelectorAll("a[href]")];
      const emptyLinks = links.filter((a) => !a.textContent.trim() && !a.getAttribute("aria-label") && !a.querySelector("img[alt]:not([alt=''])")).length;
      const externalNoRel = links.filter((a) => a.target === "_blank" && !/noopener|noreferrer/.test(a.rel)).length;
      const textLen = document.body.innerText.replace(/\s+/g, " ").length;
      const fixedEls = [...document.querySelectorAll("body *")].filter((el) => getComputedStyle(el).position === "fixed").map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()}.${(typeof el.className === "string" ? el.className : "").split(" ")[0]} h=${Math.round(r.height)} top=${Math.round(r.top)}`; }).slice(0, 8);
      return { overflowX, scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, wide, h1s, headingsCount: headings.length, headings: headings.slice(0, 45), imgs: imgs.length, imgNoAlt, imgEmptyAlt, imgBroken, imgRemote, small: small.slice(0, 12), smallCount: small.length, title, desc, canonical, robots, ld, lang, linksCount: links.length, emptyLinks, externalNoRel, textLen, fixedEls };
    });

    // Foco visível: tabula 12 vezes e registra elemento + se outline/box-shadow muda
    const focusTrail = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return "body";
        const cs = getComputedStyle(el);
        const hasRing = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
        return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 25)}" ring=${hasRing}`;
      });
      focusTrail.push(info);
    }

    let axe = null;
    try {
      const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
      axe = res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ").slice(0, 100)) }));
    } catch (e) { axe = [{ id: "axe_error", help: String(e).slice(0, 200) }]; }

    const shot = path.join(OUT, `${route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "")}-${width}.png`);
    await page.screenshot({ path: shot, fullPage: route !== "/" || width >= 768 ? false : false });
    // fullPage separado (mais leve): apenas 390 e 1440
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: shot.replace(".png", "-full.png"), fullPage: true }).catch(() => {});
    }

    report[route][width] = { loadMs, consoleErrors: [...new Set(consoleErrors)].slice(0, 12), failedRequests: [...new Set(failedRequests)].slice(0, 12), ...metrics, focusTrail, axe };
    await ctx.close();
  }
}

// Fluxo do formulário /diagnostico em 390: preencher, enviar, ver estado e o que sai na rede.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: "pt-BR" });
  const page = await ctx.newPage();
  const net = [];
  page.on("request", (r) => { if (/functions\/v1|wa\.me|googletagmanager|facebook|supabase/.test(r.url())) net.push(`${r.method()} ${r.url().slice(0, 120)}`); });
  const popups = [];
  page.on("popup", (p) => popups.push(p.url().slice(0, 160)));
  await page.addInitScript(() => { try { sessionStorage.setItem("bw-splash", "1"); localStorage.setItem("lal_cookie_consent", "accepted"); } catch {} });
  await page.goto(BASE + "/diagnostico?utm_source=teste&utm_medium=cpc&utm_campaign=auditoria", { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(800);
  const form = await page.evaluate(() => {
    const f = document.querySelector("form"); if (!f) return { found: false };
    const fields = [...f.querySelectorAll("input,select,textarea")].map((i) => ({ name: i.name || i.id, type: i.type, required: i.required, label: !!(i.labels && i.labels.length) || !!i.getAttribute("aria-label") || !!i.getAttribute("aria-labelledby"), autocomplete: i.getAttribute("autocomplete"), inputmode: i.getAttribute("inputmode") }));
    const submit = f.querySelector('button[type=submit]');
    return { found: true, fields, submitDisabledInitially: submit ? submit.disabled : null, submitText: submit?.textContent.trim() };
  });
  // tenta enviar vazio
  await page.click('button[type=submit]', { force: true }).catch(() => {});
  await page.waitForTimeout(300);
  const emptyErrors = await page.evaluate(() => [...document.querySelectorAll(".dg-field-error")].map((e) => e.textContent.trim()));
  await page.screenshot({ path: path.join(OUT, "diagnostico-390-errors.png"), fullPage: true }).catch(() => {});
  // preenche
  const fill = async (sel, val) => { const el = await page.$(sel); if (el) { await el.fill(val); } };
  await fill('input[name="nome"], #nome', "Teste Auditoria");
  await fill('input[name="whats"], #whats', "11999999999");
  await fill('input[name="local"], #local', "Pinheiros");
  // chips (objetivo/chaves) — clica no primeiro de cada grupo
  const chips = await page.$$(".dg-chip, [role=radio], button.dg-chip");
  const chipTexts = [];
  for (const c of chips.slice(0, 12)) chipTexts.push((await c.textContent())?.trim());
  const clicked = await page.evaluate(() => {
    const groups = [...document.querySelectorAll("[data-group], fieldset, .dg-chips")];
    let n = 0;
    for (const g of groups) { const b = g.querySelector("button"); if (b) { b.click(); n++; } }
    return n;
  });
  await page.waitForTimeout(300);
  const stateBefore = await page.evaluate(() => ({ submitDisabled: document.querySelector('button[type=submit]')?.disabled, errors: [...document.querySelectorAll(".dg-field-error")].map((e) => e.textContent.trim()) }));
  await page.click('button[type=submit]').catch(() => {});
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ success: !!document.querySelector(".dg-success"), successText: document.querySelector(".dg-success")?.textContent.trim().slice(0, 200), formCleared: !document.querySelector('input[name="nome"], #nome')?.value }));
  await page.screenshot({ path: path.join(OUT, "diagnostico-390-after-submit.png"), fullPage: true }).catch(() => {});
  report.__form = { form, emptyErrors, chipTexts, clickedGroups: clicked, stateBefore, after, net, popups };
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("OK: relatório em", path.join(OUT, "report.json"));

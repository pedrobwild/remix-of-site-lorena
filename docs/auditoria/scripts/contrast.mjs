import { chromium } from "playwright"; import AxeBuilder from "@axe-core/playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
for (const [route,width] of [["/",1440],["/diagnostico",390]]) {
  const p = await (await b.newContext({ viewport:{width,height:900} })).newPage();
  await p.addInitScript(()=>{try{sessionStorage.setItem("bw-splash","1");localStorage.setItem("lal_cookie_consent","declined")}catch{}});
  await p.goto("http://127.0.0.1:4173"+route,{waitUntil:"networkidle"}).catch(()=>{}); await p.waitForTimeout(800);
  const res = await new AxeBuilder({page:p}).withRules(["color-contrast"]).analyze();
  console.log(`\n## ${route}@${width}`);
  const seen=new Set();
  for (const v of res.violations) for (const n of v.nodes) { const d=n.any[0]?.data||{}; const k=`${d.fgColor}/${d.bgColor}`; if(seen.has(k)) continue; seen.add(k);
    console.log(`  ${k} ratio=${d.contrastRatio} size=${d.fontSize} weight=${d.fontWeight} -> ${n.target.join(" ").slice(0,90)} | "${(n.html.replace(/<[^>]+>/g,"").trim()).slice(0,50)}"`); }
}
await b.close();

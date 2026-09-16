import { chromium } from "playwright";
const B="http://127.0.0.1:4173"; const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
// 1) SEO imediato sem backend
for (const route of ["/faq","/rota-inexistente-xyz","/portfolio"]) {
  const p = await (await b.newContext({ viewport:{width:390,height:800} })).newPage();
  await p.addInitScript(()=>{try{sessionStorage.setItem("bw-splash","1")}catch{}});
  await p.goto(B+route).catch(()=>{}); await p.waitForTimeout(600);
  console.log(route, "| t=600ms |", await p.title(), "|", await p.evaluate(()=>document.querySelector('link[rel=canonical]')?.href), "|", await p.evaluate(()=>document.querySelector('meta[name=robots]')?.content));
}
// 2) banner mobile
{ const p = await (await b.newContext({ viewport:{width:390,height:800} })).newPage();
  await p.addInitScript(()=>{try{sessionStorage.setItem("bw-splash","1")}catch{}});
  await p.goto(B+"/",{waitUntil:"networkidle"}).catch(()=>{}); await p.waitForTimeout(1000);
  console.log("banner@390:", JSON.stringify(await p.evaluate(()=>{const e=document.querySelector(".cookie-banner"); const r=e.getBoundingClientRect(); return {h:Math.round(r.height), pctViewport: Math.round(r.height/innerHeight*100)}})));
  await p.screenshot({path:"out/home-390-after.png"});
  console.log("imgs remotos lovable.app na home:", await p.evaluate(()=>[...document.images].filter(i=>/lovable\.app/.test(i.src)).length), "| imgs /__l5e/:", await p.evaluate(()=>[...document.images].filter(i=>/\/__l5e\//.test(i.getAttribute("src")||"")).length));
  console.log("preload hero-studio presente?", await p.evaluate(()=>!!document.querySelector('link[rel=preload][href*="hero-studio"]')), "| preload hero-cozinha:", await p.evaluate(()=>document.querySelector('link[rel=preload][as=image]')?.getAttribute("href")));
}
// 3) formulário com backend indisponível -> estado de fallback honesto
{ const ctx = await b.newContext({ viewport:{width:390,height:800} }); const p = await ctx.newPage();
  await p.addInitScript(()=>{try{sessionStorage.setItem("bw-splash","1");localStorage.setItem("lal_cookie_consent","declined")}catch{}});
  await p.goto(B+"/diagnostico",{waitUntil:"networkidle"}).catch(()=>{}); await p.waitForTimeout(500);
  await p.fill("#dg-nome","Teste"); await p.fill("#dg-whats","11999999999"); await p.fill("#dg-local","Pinheiros");
  await p.evaluate(()=>{ for (const g of document.querySelectorAll("[data-group], fieldset, .dg-chips")) g.querySelector("button")?.click(); });
  const t0=Date.now(); await p.click('button[type=submit]');
  await p.waitForTimeout(300); console.log("botão durante envio:", await p.evaluate(()=>document.querySelector('button[type=submit]')?.textContent.trim()));
  await p.waitForSelector(".dg-ficha.dg-sent",{timeout:15000}).catch(()=>console.log("sem estado enviado"));
  console.log("tempo até estado final:", Date.now()-t0, "ms");
  console.log("resultado:", JSON.stringify(await p.evaluate(()=>({delivery: document.querySelector(".dg-success")?.getAttribute("data-delivery"), text: document.querySelector(".dg-success")?.textContent.trim().slice(0,120)}))));
  await p.screenshot({path:"out/diagnostico-390-fallback.png"});
}
await b.close();

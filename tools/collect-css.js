// 用法: node collect-css.js <sessionName> <标签名>
// 收集该页主文档 + 同源 iframe 的全部样式表:能读 cssRules 的直接取全文,读不出的记录 href 由 node 下载
// 输出存入 css-dump/(按来源命名,重跑按文件名去重)
import fs from 'node:fs';
import path from 'node:path';
const [,, session, tag] = process.argv;
const OUT = path.join(import.meta.dirname, 'css-dump');

const probe = `(async () => {
  const sheets = [];
  const docs = [document];
  const walk = (d) => [...d.querySelectorAll('iframe')].forEach(f => { try { if (f.contentDocument) { docs.push(f.contentDocument); walk(f.contentDocument); } } catch (e) {} });
  walk(document);
  for (const d of docs) {
    for (const ss of d.styleSheets) {
      const owner = ss.ownerNode;
      // Dark Reader 的注入表是全站改写规则,混入会污染生成器
      if (owner && [...owner.attributes || []].some(a => a.name.startsWith('data-darkreader'))) continue;
      let rules = null;
      try { rules = [...ss.cssRules].map(r => r.cssText).join('\\n'); } catch (e) {}
      sheets.push({ href: ss.href, rules, inline: !ss.href });
    }
  }
  return JSON.stringify(sheets);
})()`;

const res = await fetch('http://127.0.0.1:9223/', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ method: 'Runtime.evaluate', params: { expression: probe, returnByValue: true, awaitPromise: true }, sessionName: session }),
});
const r = await res.json();
if (r.exceptionDetails) { console.error('PAGE EXCEPTION:', r.exceptionDetails.exception?.description); process.exit(1); }
const sheets = JSON.parse(r.result.value);
let saved = 0, downloaded = 0, skipped = 0;
for (let i = 0; i < sheets.length; i++) {
  const s = sheets[i];
  const base = s.href ? path.basename(new URL(s.href).pathname).replace(/[^\w.-]/g, '_') : `inline-${tag}-${i}.css`;
  if (s.rules) {
    // 扩展注入的小内联表(无 href 且极短)没有站方价值,过滤噪音
    if (s.inline && s.rules.length < 200) continue;
    const f = path.join(OUT, base);
    if (fs.existsSync(f)) { skipped++; continue; }
    fs.writeFileSync(f, s.rules); saved++;
  } else if (s.href && s.href.startsWith('http')) {
    const f = path.join(OUT, base);
    if (fs.existsSync(f)) { skipped++; continue; }
    try {
      const res2 = await fetch(s.href, { headers: { referer: 'https://member.bilibili.com/' } });
      if (!res2.ok) { console.error('HTTP', res2.status, s.href); continue; }
      fs.writeFileSync(f, Buffer.from(await res2.arrayBuffer())); downloaded++;
    } catch (e) { console.error('FETCH FAIL', s.href, String(e).slice(0, 80)); }
  }
}
console.log(`[${tag}] sheets=${sheets.length} saved=${saved} downloaded=${downloaded} skipped=${skipped}`);

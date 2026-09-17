// 收集页面全部样式表到 css-dump/(生成器输入)。与浏览器传输方式解耦,分两步:
//   node collect-css.js probe > probe.js                      # 输出页面探针表达式
//   bsk evaluate --json --session <id> "$(cat probe.js)" > raw.json   # 经 bsk 在页面内执行
//   node collect-css.js save <标签名> raw.json                 # 存盘 + 下载外链表
// 收集范围:主文档 + 同源 iframe 全部样式表:能读 cssRules 的直接取全文,读不出的记录 href 由 node 下载
import fs from 'node:fs';
import path from 'node:path';
const [, , cmd, tag, rawFile] = process.argv;
const OUT = path.join(import.meta.dirname, 'css-dump');

const probe = `(async () => {
  const sheets = [];
  const docs = [document];
  const walk = (d) => [...d.querySelectorAll('iframe')].forEach(f => { try { if (f.contentDocument) { docs.push(f.contentDocument); walk(f.contentDocument); } } catch (e) {} });
  walk(document);
  // adoptedStyleSheets(constructable,ownerNode 为 null)与 shadowRoot 内的表不在
  // document.styleSheets 里;micro-app 微前端的样式隔离就走这条路,漏收则整批组件无映射
  const adoptOf = (root) => [...(root.adoptedStyleSheets || [])];
  const shadows = [];
  const walkShadow = (root) => [...root.querySelectorAll('*')].forEach(el => {
    if (el.shadowRoot) { shadows.push(el.shadowRoot); walkShadow(el.shadowRoot); }
  });
  for (const d of docs) {
    walkShadow(d);
    const all = [...d.styleSheets, ...adoptOf(d), ...shadows.flatMap(s => [...s.styleSheets, ...adoptOf(s)])];
    shadows.length = 0;
    for (const ss of all) {
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

if (cmd === 'probe') {
  console.log(probe);
  process.exit(0);
}

if (cmd === 'save') {
  if (!tag || !rawFile) { console.error('usage: node collect-css.js save <标签名> <bsk输出json文件>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  // bsk evaluate --json 输出 {ok, tab_id, value},value 是探针返回的 JSON 字符串
  const outer = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  if (!outer.ok) { console.error('bsk evaluate failed'); process.exit(1); }
  const sheets = JSON.parse(outer.value);
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
  process.exit(0);
}

console.error('usage: node collect-css.js probe | save <标签名> <raw.json>');
process.exit(1);

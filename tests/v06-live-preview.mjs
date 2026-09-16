// Offline, synthetic visual QA. Build first; no server/data/payment calls.
import fs from 'node:fs';
import path from 'node:path';
const root='dist/client';
const cssPath=fs.readdirSync(root,{recursive:true}).find(p=>p.endsWith('.css'));
if(!cssPath)throw new Error('Run npm run build first');
const css=fs.readFileSync(path.join(root,cssPath),'utf8');
const js=fs.readFileSync('work/live-tests/fixture.js','utf8').replaceAll('</script','<\\/script');
const page=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script type="module">${js}</script></body></html>`;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync('work/live-tests/mobile.html',`<!doctype html><html><head><title>Bloco C — QA sintético</title></head><body><iframe title="Bloco C QA 390x844" style="width:390px;height:844px;border:0" srcdoc="${escape(page)}"></iframe></body></html>`);
console.log('QA fixture: work/live-tests/mobile.html (390 × 844; synthetic transport)');

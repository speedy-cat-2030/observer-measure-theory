import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const m=read('90_meta/manifest.json'), index=read('40_index/articles.json'), ledger=read('90_meta/reading-ledger.json'), graph=read('40_index/claims.json');
const problems=[];let checkedLinks=0;
const ids=new Set(m.articles.map(a=>a.id));
const count=(arr,id)=>arr.filter(a=>a.id===id).length;
for(const a of m.articles){
 const p=path.join(root,a.snapshot),c=path.join(root,a.card);
 if(!fs.existsSync(p)||hash(fs.readFileSync(p))!==a.sha256)problems.push('snapshot hash: '+a.id);
 if(!fs.existsSync(c))problems.push('card missing: '+a.id);
 if(count(index.articles,a.id)!==1)problems.push('index cardinality: '+a.id);
 const l=ledger.articles.find(l=>l.id===a.id);
 if(count(ledger.articles,a.id)!==1||!l?.full_text_read||l?.sha256!==a.sha256)problems.push('reading ledger: '+a.id);
 const e=index.articles.find(e=>e.id===a.id);
 if(!e?.topics.length||!e?.modules.length||e?.sha256!==a.sha256)problems.push('topics/version: '+a.id);
 if(e?.modules.some(f=>!fs.existsSync(path.join(root,f))))problems.push('module missing: '+a.id);
}
if(index.articles.length!==ids.size||ledger.articles.length!==ids.size)problems.push('coverage cardinality');
const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
if(nodes.size!==graph.nodes.length)problems.push('duplicate claim IDs');
for(const n of graph.nodes){
 if(n.sources.some(id=>!ids.has(id)))problems.push('invalid claim source: '+n.id);
 if(n.depends_on.some(id=>!nodes.has(id)))problems.push('invalid dependency: '+n.id);
 if(!fs.existsSync(path.join(root,n.file)))problems.push('claim file: '+n.id);
}
const visited=new Set(),active=new Set();
function visit(id){if(active.has(id)){problems.push('dependency cycle: '+id);return;}if(visited.has(id)||!nodes.has(id))return;active.add(id);for(const d of nodes.get(id).depends_on)visit(d);active.delete(id);visited.add(id);}
for(const id of nodes.keys())visit(id);
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
const all=walk(root);
const docs=all.filter(p=>p.endsWith('.md')&&!/[\\/]80_sources[\\/]/.test(p));
for(const f of docs){
 const body=fs.readFileSync(f,'utf8');
 for(const match of body.matchAll(/\[[^\]\r\n]*\]\(([^)]+)\)/g)){
  const dest=match[1].replace(/^<|>$/g,'');
  if(/^[a-z][a-z0-9+.-]*:/i.test(dest)||dest.startsWith('#'))continue;
  const rel=dest.split('#')[0];if(!rel)continue;
  const target=path.resolve(path.dirname(f),decodeURIComponent(rel)); checkedLinks++;
  const within=path.relative(root,target);if(within.startsWith('..')||path.isAbsolute(within))problems.push('non-self-contained link: '+path.relative(root,f)+' -> '+dest);
  if(!fs.existsSync(target))problems.push('broken link: '+path.relative(root,f)+' -> '+dest);
 }
}
const srcChars=m.articles.reduce((s,a)=>s+a.characters,0);
const entryChars=fs.readFileSync(path.join(root,'00_START.md'),'utf8').length;
const modulePaths=all.filter(p=>/[\\/]10_theory[\\/]/.test(p)&&p.endsWith('.md'));
const moduleChars=modulePaths.map(p=>({file:path.relative(root,p).replaceAll('\\','/'),characters:fs.readFileSync(p,'utf8').length}));
const report={checked_at:new Date().toISOString(),status:problems.length?'FAIL':'PASS',articles:ids.size,full_read_attestations:ledger.articles.filter(a=>a.full_text_read).length,cards:index.articles.length,theory_modules:modulePaths.length,claim_nodes:nodes.size,local_markdown_links_checked:checkedLinks,source_bytes:m.articles.reduce((s,a)=>s+a.bytes,0),source_characters:srcChars,entry_characters:entryChars,entry_character_reduction:1-entryChars/srcChars,module_characters:moduleChars,scope:'snapshot hashes; explicit human/model reading attestations; card/index/graph coverage; local links; not semantic or scientific proof',problems};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'90_meta','validation-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(problems.length)process.exitCode=1;

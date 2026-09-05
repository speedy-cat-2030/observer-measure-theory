import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,s)=>{const dest=path.join(root,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,s);};
const m=read('90_meta/manifest.json');
const add=read('90_meta/editorial-addenda.json');
const topicFiles={measure:'10_theory/01_measure.md',reference:'10_theory/02_reference.md',numbers:'10_theory/03_numbers.md',time:'10_theory/04_time_identity.md',identity:'10_theory/04_time_identity.md',onset:'10_theory/05_onset.md',future:'10_theory/06_future.md',bayes:'10_theory/07_bayes_objections.md',objections:'10_theory/07_bayes_objections.md',asi:'10_theory/08_asi_ethics.md',ethics:'10_theory/08_asi_ethics.md',governance:'10_theory/09_governance.md',consciousness:'10_theory/10_consciousness.md',simulation:'10_theory/11_simulation_ontology.md',ontology:'10_theory/11_simulation_ontology.md',forecast:'10_theory/12_forecasts.md',practice:'10_theory/13_personal_dialogue.md',dialogue:'10_theory/13_personal_dialogue.md',history:'20_history/EVOLUTION.md'};
const notes=new Map();
for(const name of fs.readdirSync(path.join(root,'90_meta')).filter(n=>n.endsWith('.jsonl')&&n.includes('notes'))){
 for(const line of fs.readFileSync(path.join(root,'90_meta',name),'utf8').split(/\r?\n/).filter(s=>s.trim())){
  const n=JSON.parse(line);if(notes.has(n.id))throw new Error('Duplicate note '+n.id);
  for(const key of ['state','summary','caveat'])if(!n[key])throw new Error('Missing '+key+' '+n.id);
  for(const t of n.topics)if(!topicFiles[t])throw new Error('Unknown topic '+t);
  notes.set(n.id,{...n,notes_file:'90_meta/'+name});
 }
}
if(notes.size!==m.articles.length||m.articles.some(a=>!notes.has(a.id)))throw new Error('Article/notes coverage mismatch');
const entries=[];
for(const a of m.articles){
 const n=notes.get(a.id);
 const topics=n.topics.map(t=>`[${t}](../${topicFiles[t]})`).join(' · ');
 const card=`# ${a.id} — ${a.title}\n\n日付: ${a.date} | 状態: **${n.state}**\n\n${topics}\n\n## 主張/役割の要約\n\n${n.summary}\n\n## 留保・更新関係\n\n${n.caveat}\n${add[a.id]?'\n**E/追加点検:** '+add[a.id]+' [数値台帳](../10_theory/03_numbers.md)\n':''}\n## 根拠へのアクセス\n\n[保存原文](../${a.snapshot}) (${a.lines}行) · [掲載先](${a.url})\n\n節の行位置: \`node tools/corpus.mjs headings ${a.id}\`。必要範囲だけ \`read ${a.id}:開始-終了\`。完全な出典名/ハッシュはmanifest。原文版SHA-256先頭: \`${a.sha256.slice(0,16)}\`。\n`;
 write(a.card,card);
 entries.push({id:a.id,title:a.title,date:a.date,state:n.state,topics:n.topics,modules:[...new Set(n.topics.map(t=>topicFiles[t]))],card:a.card,snapshot:a.snapshot,sha256:a.sha256,notes_file:n.notes_file,has_editorial_addendum:!!add[a.id]});
}
const safe=s=>s.replaceAll('|','／').replaceAll('\n',' ');
write('40_index/ARTICLES.md','# Article catalog — all 74\n\n目次専用。通常は01_ROUTERから該当論点へ。日付/番号だけで現在性を決めない。本文主張の出典は各カード→保存原文。\n\n|ID|日付|題名|状態|topics|\n|---|---|---|---|---|\n'+entries.map(e=>`|${e.id}|${e.date}|[${safe(e.title)}](../${e.card})|${safe(e.state)}|${e.topics.join(', ')}|`).join('\n')+'\n');
write('40_index/articles.json',JSON.stringify({schema_version:1,topic_files:topicFiles,articles:entries},null,2)+'\n');
console.log(JSON.stringify({cards:entries.length,notes:notes.size,topics:Object.keys(topicFiles).length}));

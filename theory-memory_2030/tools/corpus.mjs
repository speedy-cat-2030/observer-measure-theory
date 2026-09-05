import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(root, '..');
const repositoryRelative = p => {
  const relative = path.relative(repositoryRoot, p);
  if(path.isAbsolute(relative)||relative==='..'||relative.startsWith('..'+path.sep)) throw new Error('Source must be inside the repository root.');
  return relative.replaceAll('\\','/');
};
const manifestPath = path.join(root, '90_meta', 'manifest.json');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p,s); };
const [cmd, ...args] = process.argv.slice(2);
if(cmd === 'init') {
  if(fs.existsSync(manifestPath)) throw new Error('Already initialized; snapshots will not be overwritten.');
  const source = path.resolve(args[0]);
  const sourceRelative = repositoryRelative(source);
  const articles = fs.readdirSync(source).filter(n=>n.endsWith('.md')).sort().map(name=>{
    const data=fs.readFileSync(path.join(source,name)); const body=data.toString('utf8');
    const id=name.match(/^\d+/)?.[0]; if(!id) throw new Error(name);
    write(path.join(root,'80_sources',id+'.md'),data);
    const lines=body.split(/\r?\n/);
    return {id,original_name:name,source_path:repositoryRelative(path.join(source,name)),snapshot:'80_sources/'+id+'.md',card:'30_articles/'+id+'.md',sha256:hash(data),bytes:data.length,characters:body.length,lines:lines.length,date:body.match(/^date:\s*(.*)$/m)?.[1],url:body.match(/^source:\s*"(.*)"/m)?.[1],title:body.match(/^title:\s*"(.*)"/m)?.[1],headings:lines.flatMap((s,i)=>/^#{1,6} /.test(s)?[{line:i+1,title:s}]:[])};
  });
  write(manifestPath, JSON.stringify({schema_version:2,created_at:new Date().toISOString(),source_path_base:'repository-root',source_root:sourceRelative,articles},null,2)+'\n');
  console.log(JSON.stringify({count:articles.length,bytes:articles.reduce((s,a)=>s+a.bytes,0),characters:articles.reduce((s,a)=>s+a.characters,0)},null,2));
} else {
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const sourceBase=m.source_path_base==='repository-root'?repositoryRoot:root;
  if(cmd==='read') {
    for(const arg of args) {
      const [id,range]=arg.split(':'); const a=m.articles.find(a=>a.id===id.padStart(3,'0')); if(!a) throw new Error(arg);
      const lines=fs.readFileSync(path.join(root,a.snapshot),'utf8').split(/\r?\n/);
      const [lo,hi]=range?range.split('-').map(Number):[1,lines.length];
      console.log(`<<< ${a.id} ${a.title} | L${lo}-${hi} / ${lines.length} >>>\n`+lines.slice(lo-1,hi).join('\n')+`\n<<< END ${a.id} >>>`);
    }
  } else if(cmd==='headings') {
    for(const a of m.articles.filter(a=>!args.length||args.includes(a.id))) console.log(a.id+' '+a.title+'\n'+a.headings.map(h=>h.line+' '+h.title).join('\n'));
  } else if(cmd==='verify') {
    const problems=[]; let cards=0; const localOnly=args.includes('--local');
    for(const a of m.articles) {
      const p=path.join(root,a.snapshot);
      if(!fs.existsSync(p)||hash(fs.readFileSync(p))!==a.sha256) problems.push({id:a.id,problem:'snapshot missing or changed'});
      const original=path.resolve(sourceBase,a.source_path);
      if(!localOnly&&fs.existsSync(original)&&hash(fs.readFileSync(original))!==a.sha256) problems.push({id:a.id,problem:'original changed'});
      if(!localOnly&&!fs.existsSync(original)) problems.push({id:a.id,problem:'original missing'});
      if(fs.existsSync(path.join(root,a.card))) cards++; else problems.push({id:a.id,problem:'card missing'});
    }
    const sourceDir=path.resolve(sourceBase,m.source_root);
    const current=!localOnly&&fs.existsSync(sourceDir)?fs.readdirSync(sourceDir).filter(n=>n.endsWith('.md')):[];
    const added=current.filter(n=>!m.articles.some(a=>a.original_name===n));
    console.log(JSON.stringify({mode:localOnly?'self-contained':'with-originals',articles:m.articles.length,cards,added,problems},null,2));
    if(problems.length||added.length) process.exitCode=1;
  } else if(cmd==='impact') {
    const key=args[0]; if(!key) throw new Error('impact requires a claim ID or article ID');
    const graph=JSON.parse(fs.readFileSync(path.join(root,'40_index','claims.json'),'utf8'));
    const index=JSON.parse(fs.readFileSync(path.join(root,'40_index','articles.json'),'utf8'));
    const article=/^\d+$/.test(key)?index.articles.find(a=>a.id===key.padStart(3,'0')):null;
    if(!article&&!graph.nodes.some(n=>n.id===key))throw new Error('Unknown article/claim: '+key);
    const seeds=graph.nodes.filter(n=>n.id===key||(article&&(n.sources.includes(article.id)||article.modules.includes(n.file)))).map(n=>n.id);
    const ids=new Set(seeds); let grew=true;
    while(grew){grew=false;for(const n of graph.nodes)if(!ids.has(n.id)&&n.depends_on.some(d=>ids.has(d))){ids.add(n.id);grew=true;}}
    console.log(JSON.stringify({query:key,selection:'direct sources plus conservative topic-module match; descendants require reconsideration',seeds,affected:graph.nodes.filter(n=>ids.has(n.id)).map(n=>({id:n.id,title:n.title,file:n.file,issues:n.issues})),always_check:['00_START.md','20_history/EVOLUTION.md','20_history/OPEN_ISSUES.md']},null,2));
  } else if(cmd==='search') {
    const query=args[0]; if(!query) throw new Error('search requires a literal query');
    const raw=args.includes('--sources'); const cap=Number(args.find(s=>s.startsWith('--limit='))?.split('=')[1]||30); let hits=0;
    function walk(dir) { return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]):[]; }
    const files=raw?walk(path.join(root,'80_sources')):walk(root).filter(p=>!/[\\/](80_sources|90_meta|tools)[\\/]/.test(p));
    for(const p of files.filter(p=>p.endsWith('.md'))) {
      const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
      for(let i=0;i<lines.length;i++) if(lines[i].toLocaleLowerCase().includes(query.toLocaleLowerCase())) { if(hits++<cap) console.log(path.relative(root,p).replaceAll('\\','/')+':'+(i+1)+': '+lines[i]); }
    }
    console.log(`Matches: ${hits}; shown: ${Math.min(hits,cap)}`);
  } else throw new Error('Commands: init SOURCE | read ID[:START-END]... | headings [ID...] | verify [--local] | impact CLAIM_OR_ARTICLE | search QUERY [--sources] [--limit=30]');
}

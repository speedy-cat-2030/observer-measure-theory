// Reproduce the rounded stock/flow model of articles 072/073.
// These calculations check internal arithmetic, not physical validity.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H0=8e22, h=1.63e20, Tb=1.5e9;
const classes={mammals:{A0:1.60e26,a:4.21e18},fish_inclusive:{A0:4e28+1.60e26,a:1e20+4.21e18}};
function P(L,s,c,T=Tb){return (H0+h*s*L)/(H0+h*s*L+c.A0+c.a*Math.min(L,T));}
function years(p,s,c,T=Tb){
  if(p<=P(0,s,c,T))return 0;
  const d=(1-p)*h*s-p*c.a;
  const pre=d>0?(p*c.A0-(1-p)*H0)/d:Infinity;
  if(pre>=0&&pre<=T)return pre;
  return (p/(1-p)*(c.A0+c.a*T)-H0)/(h*s);
}
const rows=[];
for(const [name,c] of Object.entries(classes))for(const s of [1,10])for(const p of [.1,.5,.9,.99]){
  const L=years(p,s,c);
  if(Math.abs(P(L,s,c)-p)>1e-12)throw new Error('Inverse calculation failed');
  rows.push({reference:name,s,target:p,years:L,years_if_animals_stop_now:years(p,s,c,0),before_biosphere_end:L<=Tb,hazard_if_mean_life_equals_L:1/L});
}
const compare=[
  ['mammals',1,.1,1.1e5,'072'],['mammals',1,.5,1e6,'072'],
  ['fish_inclusive',1,.1,7.6e7,'070/072'],['fish_inclusive',1,.5,6.8e8,'070/072/073'],
  ['fish_inclusive',10,.1,2.9e6,'070/072'],['fish_inclusive',10,.5,2.6e7,'070/072'],
  ['fish_inclusive',1,.9,1.1e10,'072/073'],['fish_inclusive',10,.9,1.1e9,'072/073'],
  ['fish_inclusive',1,.99,1.2e11,'073'],['fish_inclusive',10,.99,1.2e10,'073']
].map(([reference,s,target,reported,source])=>{const calculated=years(target,s,classes[reference]);return {reference,s,target,reported,calculated,reported_over_calculated:reported/calculated,source};});
const result={status:'editorial arithmetic from rounded source inputs; not scientific verification',equation:'P(L)=(H0+h*s*L)/(H0+h*s*L+A0+a*min(L,Tb))',inputs:{H0,h,Tb,classes},baseline:Object.fromEntries(Object.entries(classes).map(([name,c])=>[name,{past:P(0,1,c),eternal_animal_flow_limit:h/(h+c.a),a1_final:H0/(H0+c.A0+c.a*Tb),a2_final:H0/(H0+c.A0),human_over_animal_flow:h/c.a}])),rows,reported_comparison:compare};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'90_meta','calculation-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

/* Translates public, static interface labels; never queries CRM records. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root=path.resolve(__dirname,'..');
const originalLoad=Module._load;
Module._load=function(id,parent,main){ if(id==='server-only') return {}; if(id.startsWith('@/')) id=path.join(root,id.slice(2)); return originalLoad.call(this,id,parent,main); };
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,file);
require('@next/env').loadEnvConfig(root);
const {translatePresentationBatch}=require('../lib/i18n/content-translations.ts');
const phrases=require('../lib/i18n/interface-source.json');
const output=path.join(root,'lib/i18n/interface-copy.json');
const dictionary=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{};
const memory={from(){return {select(){return this;},match(){return this;},async maybeSingle(){return {data:null,error:null};},async upsert(){return {error:null};}};}};
async function main(){
  async function translate(batch,locale,start,attempt=0){
    const source=Object.fromEntries(batch.map((text,index)=>[`s${index}`,text]));
    try {
      return await translatePresentationBatch(memory,{organizationId:1,entityType:'landing',entityId:'static-interface',fieldPath:`interface.${start}.${batch.length}`,sourceLocale:'es',targetLocale:locale,sourceText:'',context:'Static user-interface copy. Some labels already use English or French: return them unchanged in the same language. Use concise labels. Preserve punctuation, placeholders and ALL numbers exactly, including years.'},source);
    } catch(error) {
      if(!/incompleta|verificación/.test(error.message)) {
        if(attempt>=2)throw error;
        console.log('Provider busy; waiting 45 seconds before retry.');
        await new Promise(resolve=>setTimeout(resolve,45000));
        return translate(batch,locale,start,attempt+1);
      }
      if(batch.length<=1) throw error;
      const mid=Math.ceil(batch.length/2);
      const left=await translate(batch.slice(0,mid),locale,start);
      const right=await translate(batch.slice(mid),locale,start+mid);
      return {...left,...Object.fromEntries(Object.entries(right).map(([key,value])=>[`s${Number(key.slice(1))+mid}`,value]))};
    }
  }
  for(const locale of ['en','fr']){
    const pending=phrases.filter(text=>!dictionary[text]?.[locale]);
    for(let start=0;start<pending.length;start+=60){
      const batch=pending.slice(start,start+60);
      const result=await translate(batch,locale,start);
      batch.forEach((text,index)=>{ dictionary[text]={...dictionary[text],[locale]:result[`s${index}`]}; });
      fs.writeFileSync(output,JSON.stringify(dictionary,null,2)+'\n');
      console.log(`${locale}: ${Math.min(start+60,pending.length)}/${pending.length}`);
    }
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

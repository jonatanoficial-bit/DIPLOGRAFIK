import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT=process.cwd();
const source=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(ROOT,'build.config.json'),'utf8'));
const EXPECTED_VERSION=config.version;
const listeners=new Map();
const cacheStores=new Map();
let claimed=false, skipped=false, online=true;
const ORIGIN='https://diplocraft.test';

function normalize(input,ignoreSearch=false){
  const raw=typeof input==='string'?input:input?.url;
  const url=new URL(raw,ORIGIN+'/');
  if(ignoreSearch) url.search='';
  return url.href;
}
class FakeCache{
  constructor(){this.map=new Map();}
  async addAll(urls){ for(const url of urls)this.map.set(normalize(url),new Response(`cached:${url}`,{status:200})); }
  async match(request,opts={}){return this.map.get(normalize(request,Boolean(opts.ignoreSearch)))?.clone();}
  async put(request,response){this.map.set(normalize(request),response.clone());}
  async keys(){return [...this.map.keys()].map(url=>({url}));}
}
const caches={
  async open(name){if(!cacheStores.has(name))cacheStores.set(name,new FakeCache());return cacheStores.get(name);},
  async keys(){return [...cacheStores.keys()];},
  async delete(name){return cacheStores.delete(name);},
  async match(request,opts={}){for(const cache of cacheStores.values()){const hit=await cache.match(request,opts);if(hit)return hit;}},
};
const self={
  location:{origin:ORIGIN},
  clients:{claim:async()=>{claimed=true;}},
  skipWaiting:()=>{skipped=true;},
  addEventListener:(type,handler)=>listeners.set(type,handler),
};
const context={self,caches,fetch:async(input)=>{ if(!online) throw new Error('offline'); const raw=typeof input==='string'?input:input?.url; return new Response(`network:${raw}`,{status:200}); },URL,Response,Request,console,setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(source,context,{filename:'sw.js'});

async function runWait(type,event={}){
  let promise=Promise.resolve();
  listeners.get(type)({...event,waitUntil:p=>{promise=Promise.resolve(p);}});
  await promise;
}
await runWait('install');
online=false;
const namesAfterInstall=await caches.keys();
const current=namesAfterInstall.find(x=>x.includes(EXPECTED_VERSION));
const installedCache=await caches.open(current);
const installedCount=(await installedCache.keys()).length;
cacheStores.set('diplocraft-old-build',new FakeCache());
await runWait('activate');
const namesAfterActivate=await caches.keys();
let versionMessage=null;
listeners.get('message')({data:{type:'GET_VERSION'},ports:[{postMessage:data=>{versionMessage=data;}}]});
listeners.get('message')({data:{type:'SKIP_WAITING'},ports:[]});

async function runFetch(request){let promise;listeners.get('fetch')({request,respondWith:p=>{promise=Promise.resolve(p);}});return promise?await promise:null;}
const navigation=await runFetch({method:'GET',mode:'navigate',url:ORIGIN+'/route/without-network'});
const navigationText=await navigation.text();
const icon=await runFetch({method:'GET',mode:'same-origin',url:ORIGIN+'/assets/pwa/icon-192.png'});
const iconText=await icon.text();
const moduleResponse=await runFetch({method:'GET',mode:'same-origin',url:ORIGIN+'/src/game.js'});
const moduleText=await moduleResponse.text();

const result={
 listeners:[...listeners.keys()],current_cache:current,installed_count:installedCount,names_after_activate:namesAfterActivate,
 claimed,skipped,version_message:versionMessage,
 navigation_offline:navigation?.status===200&&navigationText.includes('index.html'),
 asset_offline:icon?.status===200&&iconText.includes('icon-192.png'),
 module_offline:moduleResponse?.status===200&&moduleText.includes('src/game.js'),
 old_cache_removed:!namesAfterActivate.includes('diplocraft-old-build'),
 passed:Boolean(current&&installedCount>100&&claimed&&skipped&&versionMessage?.version===EXPECTED_VERSION&&navigation?.status===200&&icon?.status===200&&moduleResponse?.status===200&&!namesAfterActivate.includes('diplocraft-old-build'))
};
fs.writeFileSync(path.join(ROOT,'tests/pwa-service-worker-simulation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
process.exit(result.passed?0:1);

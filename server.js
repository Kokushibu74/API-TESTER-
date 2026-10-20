const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const API = 'https://openrouter.ai/api/v1';
const MIME = {'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8'};

function send(res,status,data,type='application/json; charset=utf-8'){
  res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(type.startsWith('application/json')?JSON.stringify(data):data);
}
function read(req,limit=65536){
  return new Promise((resolve,reject)=>{let raw='',size=0;req.on('data',chunk=>{size+=chunk.length;if(size>limit){reject(Error('Request too large'));req.destroy();return;}raw+=chunk;});req.on('end',()=>resolve(raw));req.on('error',reject);});
}
function quotaHeaders(headers){
  const out={};
  for(const [k,v] of headers.entries()) if(/rate.?limit|quota|usage|tokens.?remaining|retry-after|request.?remaining/i.test(k)) out[k]=v;
  return out;
}
async function providerFetch(url,options={},timeoutMs=25000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),Math.min(Math.max(Number(timeoutMs)||25000,1000),60000));
  const started=Date.now();
  try{
    const response=await fetch(url,{...options,signal:controller.signal});
    const raw=await response.text();
    let data=raw;try{data=raw?JSON.parse(raw):null;}catch{}
    return {response,data,elapsedMs:Date.now()-started,quota:quotaHeaders(response.headers),headers:Object.fromEntries(response.headers.entries())};
  }catch(e){if(e.name==='AbortError')throw Error('Request timed out.');throw Error(e.message||'Network request failed.');}
  finally{clearTimeout(timer);}
}
http.createServer(async(req,res)=>{
  if(req.method==='GET'&&req.url==='/api/health')return send(res,200,{ok:true,app:'AI Model Checker',provider:'OpenRouter'});
  if(req.method==='GET'&&req.url==='/api/catalog'){
    try{
      const result=await providerFetch(API+'/models',{headers:{'Accept':'application/json'}},30000);
      if(!result.response.ok)return send(res,502,{error:'Could not load model catalogue from OpenRouter.',providerStatus:result.response.status});
      const models=Array.isArray(result.data?.data)?result.data.data.map(m=>({
        id:m.id,name:m.name||m.id,context_length:m.context_length||null,
        prompt_price:m.pricing?.prompt??null,completion_price:m.pricing?.completion??null,
        description:m.description||'',architecture:m.architecture?.modality||''
      })).filter(m=>m.id).sort((a,b)=>a.name.localeCompare(b.name)):null;
      if(!models)return send(res,502,{error:'Provider returned an unexpected model catalogue format.'});
      return send(res,200,{ok:true,provider:'OpenRouter',count:models.length,models});
    }catch(e){return send(res,502,{error:e.message});}
  }
  if(req.method==='POST'&&req.url==='/api/check'){
    try{
      const input=JSON.parse(await read(req));
      const key=String(input.apiKey||'').trim(),model=String(input.model||'').trim();
      if(!key)return send(res,400,{error:'Paste your OpenRouter API key first.'});
      if(!model)return send(res,400,{error:'Select a model first.'});
      if(key.length>1000||/[\r\n]/.test(key))return send(res,400,{error:'API key format is invalid.'});
      const headers={Authorization:'Bearer '+key,'Accept':'application/json'};
      const auth=await providerFetch(API+'/models',{headers},20000);
      if(!auth.response.ok){
        return send(res,200,{ok:false,keyValid:false,model,stage:'key_check',status:auth.response.status,statusText:auth.response.statusText,elapsedMs:auth.elapsedMs,quota:auth.quota,error:auth.data?.error?.message||'The provider rejected this key.',headers:auth.headers});
      }
      const catalog=Array.isArray(auth.data?.data)?auth.data.data:[];
      const found=catalog.find(m=>m.id===model);
      const started=Date.now();
      let completion;
      try{
        completion=await providerFetch(API+'/chat/completions',{
          method:'POST',
          headers:{...headers,'Content-Type':'application/json'},
          body:JSON.stringify({model,messages:[{role:'user',content:'Reply with exactly: API_TEST_OK'}],max_tokens:16,stream:false})
        },Number(input.timeoutMs)||30000);
      }catch(e){return send(res,200,{ok:false,keyValid:true,model,modelListed:!!found,stage:'model_request',error:e.message});}
      const body=completion.data;
      const message=body?.choices?.[0]?.message?.content;
      const usage=body?.usage||null;
      return send(res,200,{
        ok:completion.response.ok,keyValid:true,model,modelListed:!!found,
        modelName:found?.name||model,stage:completion.response.ok?'complete':'model_request',
        status:completion.response.status,statusText:completion.response.statusText,
        elapsedMs:completion.elapsedMs,totalElapsedMs:Date.now()-started,
        quota:completion.quota,authQuota:auth.quota,usage,
        promptTokens:usage?.prompt_tokens??null,completionTokens:usage?.completion_tokens??null,totalTokens:usage?.total_tokens??null,
        answer:typeof message==='string'?message:null,
        error:completion.response.ok?null:(body?.error?.message||body?.message||'Model request failed.'),
        providerRequestId:completion.headers['x-request-id']||completion.headers['request-id']||null
      });
    }catch(e){return send(res,400,{error:e.message||'Request failed.'});}
  }
  if(req.method==='GET'){
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    const rel=pathname==='/'?'public/index.html':pathname.replace(/^\/+/, '');
    const file=path.resolve(ROOT,rel);
    if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,{error:'Not found'});
    return send(res,200,fs.readFileSync(file),MIME[path.extname(file)]||'application/octet-stream');
  }
  return send(res,404,{error:'Not found'});
}).listen(PORT,HOST,()=>console.log('AI Model Checker running at http://'+HOST+':'+PORT+'\nProvider: OpenRouter (1000+ model catalogue)\nKeep Termux open; Ctrl+C stops it.'));

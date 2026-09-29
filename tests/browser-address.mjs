// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4175).
// External requests are blocked: these checks cover local behavior, not providers.
import assert from 'node:assert/strict';
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const fill = async (selector,value) => { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);await pause(60); };
const results=[];
const check=async(name,expression)=>{const result=await evaluate(expression);assert.equal(result,true,name);results.push(name);console.log('PASS',name);};
const resize=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,mobile:width<1024,deviceScaleFactor:1});await pause(150);};

try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Page.navigate',{url:'http://127.0.0.1:4175/'}); await pause(800);
 await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','[]');localStorage.setItem('apoio_cataguases_urban_index_v3',JSON.stringify({savedAt:Date.now(),addresses:[{logradouro:'Rua 7 de Setembro',complemento:'',bairro:'Centro',cep:'36770000',localidade:'Cataguases',uf:'MG',kind:'address',latitude:-21.39,longitude:-42.69}]}));`);
 await send('Page.reload'); await pause(800);
 for(const width of [1440,390]) {
  await resize(width,900);
  await check(width+' catalog navigation label',`[...document.querySelectorAll('nav button')].filter(e=>e.textContent.trim()==='Cat\u00e1logo').length===2`);
  await check(width+' no map list switch',`!document.querySelector('[aria-label="Modo de visualiza\u00e7\u00e3o"]')`); await fill('#main-search-input','Rua 7');
  await evaluate(`document.querySelector('[role="option"] button').click()`); await pause(700);
  await check(width+' selected address remains in list',`document.querySelector('[aria-label="Endereço selecionado"]')?.innerText.includes('Rua 7 de Setembro')===true`);
  await check(width+' street number is not duplicated',`!document.querySelector('#main-search-input').value.includes('Setembro, 7')`);
  await check(width+' directions link is available',`document.querySelector('[aria-label="Endereço selecionado"] a').href.includes('destination=-21.39%2C-42.69')`);
  await check(width+' single result card',`document.querySelectorAll('article').length===1`);
  await evaluate(`document.querySelector('article button[aria-expanded]').click()`); await pause(100);
  await check(width+' accessibility expands inside card',`document.querySelector('article button[aria-expanded]').getAttribute('aria-expanded')==='true' && document.querySelectorAll('article').length===1`);
  await evaluate(`document.querySelector('article button[aria-expanded]').click()`);
  await check(width+' suggestions stay closed',`!document.querySelector('[role="listbox"]')`);
  await evaluate(`document.querySelector('[aria-label="Mostrar filtros"]').click()`); await pause(80);
  await evaluate(`document.querySelector('#advanced-search-filters input[type="checkbox"]').click()`); await pause(150);
  await check(width+' filters preserve address result',`!!document.querySelector('[aria-label="Endereço selecionado"]')`);
  await evaluate(`document.querySelector('[aria-label="Mostrar filtros"]').click()`);
  await fill('#main-search-input','outra busca');
  await check(width+' editing clears old selection',`!document.querySelector('[aria-label="Endereço selecionado"]')`);
 }
 console.log(results.length+' browser checks passed');
} finally { ws.close(); }

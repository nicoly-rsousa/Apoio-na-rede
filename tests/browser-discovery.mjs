// Run against an isolated Chrome profile (CDP :9222) and Vite preview (:4173).
// External requests are blocked: these checks cover local behavior, not providers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const click = async text => { await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}&&e.getClientRects().length);if(!e)throw Error('Missing button: '+${JSON.stringify(text)});e.click()})()`); await pause(100); };
const fill = async (selector,value) => { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);await pause(60); };
const results=[];
const check=async(name,expression)=>{const result=await evaluate(expression);assert.equal(result,true,name);results.push(name);console.log('PASS',name);};
const resize=async(width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,mobile:width<1024,deviceScaleFactor:1});await pause(150);};
const mockGoogle = `
window.__fits=0;
window.__failPlaces=false;
class FakeMap {
 constructor(element){ this.element=element; this.zoom=14; }
 setCenter(){} setZoom(value){this.zoom=value} getZoom(){return this.zoom}
 fitBounds(){window.__fits++} addListener(){return {remove(){}}}
}
class Marker {
 constructor(options){this.element=document.createElement('button');this.element.dataset.testMarker=options.title;this.element.append(options.content);this.map=options.map;}
 set map(value){this.element.remove();if(value)value.element.append(this.element)}
 addListener(name,handler){this.element.addEventListener(name,handler);return {remove:()=>this.element.removeEventListener(name,handler)}}
}
class Overlay {setMap(){}}
class InfoWindow {setContent(){}open(){}close(){}}
const Place={
 searchNearby:async request=>{await new Promise(resolve=>setTimeout(resolve,80));if(window.__failPlaces)throw Error('Provider unavailable');const type=request.includedTypes[0];return {places:[{id:type,displayName:'Local '+type,formattedAddress:'Cataguases',location:{lat:()=>-21.42,lng:()=>-42.72},types:[type]}]};},
 searchByText:async()=>({places:[]})
};
window.google={maps:{Map:FakeMap,marker:{AdvancedMarkerElement:Marker},Polyline:Overlay,Circle:Overlay,InfoWindow,
 LatLngBounds:class {extend(){return this}},event:{clearInstanceListeners(){},addListenerOnce(map,event,callback){setTimeout(callback,0);return {remove(){}}}},
 importLibrary:async name=>name==='places'?{Place,SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}}:{}
}};
`;
let injection;
try {
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:mockGoogle});
 await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await pause(1800);
 await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','["mobilidade"]');`);
 await send('Page.reload');await pause(1500);
 for(const width of [1440,390,320]) {
  await resize(width,900);
  for(const label of ['Alimentação','Saúde','Lazer','Comércio','Serviços','Banheiros','Educação','Transporte','Hospedagem']) {
   await evaluate(`(()=>{const button=[...document.querySelectorAll('.category-tile')].find(e=>e.textContent.trim()===${JSON.stringify(label)});button.click()})()`);await pause(350);
   await check(width+' '+label+' card e ícone',`document.querySelectorAll('.place-discovery-card').length===1&&document.querySelectorAll('[data-test-marker] svg').length===1`);
  }
  await check(width+' enquadramento dos resultados',`window.__fits>0`);
  await check(width+' sem overflow global',`document.documentElement.scrollWidth<=document.documentElement.clientWidth`);
 }
 await fill('#main-search-input','termo anterior');
 await evaluate(`document.querySelector('.category-tile').click()`);await pause(350);
 await check('Categoria limpa busca anterior',`document.querySelector('#main-search-input').value===''&&document.querySelectorAll('.place-discovery-card').length===1`);
 await evaluate(`window.__failPlaces=true;document.querySelectorAll('.category-tile')[1].click()`);await pause(350);
 await check('Erro visível sem sumir seção',`document.querySelector('.discovery-places').innerText.includes('Não foi possível carregar')`);
 await evaluate(`window.__failPlaces=false`);await click('Tentar carregar sugestões novamente');await pause(350);
 await check('Retry recupera cards e marcadores',`document.querySelectorAll('.place-discovery-card').length===1&&document.querySelectorAll('[data-test-marker]').length===1`);
 await evaluate(`document.querySelector('[aria-label="Mostrar filtros"]').click()`);await pause(100);await evaluate(`document.querySelector('#advanced-search-filters input[type="checkbox"]').click()`);await pause(150);
 await check('Verificados não inclui Google sem verificação',`document.querySelectorAll('.place-discovery-card').length===0&&document.querySelectorAll('[data-test-marker]').length===0`);
 fs.writeFileSync('docs/auditoria-desktop-mobile/discovery-fixed.json',JSON.stringify({environment:'Chrome; Google Maps/Places simulados',passed:results},null,2));
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}

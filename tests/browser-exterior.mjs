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
const results=[];
const check=async(name,expression)=>{const result=await evaluate(expression);assert.equal(result,true,name);results.push(name);console.log('PASS',name);};


const mock = `
window.__street=true;window.__details=0;
class Place {
 constructor(){this.photos=[]}
 static async searchNearby(){return {places:[{id:'test-place',displayName:'Test storefront',formattedAddress:'Cataguases',location:{lat:()=>-21.39,lng:()=>-42.69},types:['store']}]}}
 static async searchByText(){return {places:[]}}
 async fetchFields(){window.__details++;this.photos=window.__emptyPhotos?[]:[{getURI:()=>'/brand/apoio-na-rede-logo.png',authorAttributions:[{displayName:'Test author',uri:null}]}]}
}
class StreetViewService {async getPanorama(){if(!window.__street)throw Error('ZERO_RESULTS');return {data:{location:{pano:'test',latLng:{}}}}}}
class StreetViewPanorama {constructor(el,options){el.textContent='Test outdoor panorama';window.__heading=options.pov.heading}setVisible(){}}
window.google={maps:{event:{clearInstanceListeners(){}},LatLng:class{},importLibrary:async name=>name==='places'?{Place,SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}}:name==='streetView'?{StreetViewService,StreetViewPanorama,StreetViewSource:{OUTDOOR:'outdoor'},StreetViewPreference:{NEAREST:'nearest'}}:name==='geometry'?{spherical:{computeHeading:()=>125}}:{}}};
`;
let injection;
try {
await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:mock});
await send('Page.navigate',{url:'http://127.0.0.1:4175/'});await pause(800);
await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','[]')`);
await send('Page.reload');await pause(1000);
await check('static image displayed',`document.querySelector('article img')?.naturalWidth>0`);
await check('no Street View instantiated',`window.__heading===undefined`);
await evaluate(`window.__street=false;document.querySelector('.category-tile').click()`);await pause(1000);
await check('details photos requested for place',`window.__details>0`);
await check('fallback image and author displayed',`document.querySelector('article img')?.naturalWidth>0 && document.querySelector('article').innerText.includes('Test author')`);
await evaluate(`window.__emptyPhotos=true;document.querySelectorAll('.category-tile')[1].click()`);await pause(700);
await check('empty photo response is not a connection error',`document.querySelector('article')?.innerText.includes('O Google n\u00e3o disponibilizou fotos deste local.')===true`);
await check('empty photo response does not offer pointless retry',`![...document.querySelectorAll('article button')].some(button=>button.textContent==='Tentar novamente')`);
console.log(results.length+' exterior checks passed (Google services simulated)');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close()}

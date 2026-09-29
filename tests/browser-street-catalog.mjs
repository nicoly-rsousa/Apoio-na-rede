import fs from 'node:fs';
// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4175).
// External requests are blocked: these checks cover local behavior, not providers.
import assert from 'node:assert/strict';
const targets = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({data}) => { const message = JSON.parse(data); if(message.method==='Fetch.requestPaused'){void send('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'}],body:fs.readFileSync('public/brand/apoio-na-rede-logo.png').toString('base64')});} const request = pending.get(message.id); if (request) { clearTimeout(request.timer); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000); pending.set(requestId, {resolve, reject, timer}); ws.send(JSON.stringify({id:requestId,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));

let injection;
try{
await send('Page.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:[]});
await send('Fetch.enable',{patterns:[{urlPattern:'https://maps.googleapis.com/maps/api/streetview?*'}]});
injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
const originalFetch=window.fetch;
window.__metadata=0;
window.fetch=(url,options)=>String(url).includes('streetview/metadata')?(window.__metadata++,Promise.resolve({ok:true,json:async()=>({status:window.__denied?'REQUEST_DENIED':String(url).includes('-21.3901')?'ZERO_RESULTS':'OK'})})):originalFetch(url,options);
const Place={searchNearby:async()=>({places:Array.from({length:8},(_,i)=>({id:'local'+i,displayName:'Local '+i,formattedAddress:'Cataguases',location:{lat:()=>-21.39-i*.0001,lng:()=>-42.69},types:['store']})).reverse()}),searchByText:async()=>({places:[]})};
class StreetViewService {async getPanorama(){if(window.__denied)throw Error('REQUEST_DENIED');return {data:{location:{pano:'test',latLng:{}}}}}}
class StreetViewPanorama {constructor(el){el.dataset.panorama='loaded'}addListener(){}setVisible(){}getStatus(){return 'OK'}}
window.google={maps:{LatLng:class{},event:{clearInstanceListeners(){}},StreetViewStatus:{OK:'OK'},importLibrary:async name=>name==='streetView'?{StreetViewService,StreetViewPanorama,StreetViewSource:{OUTDOOR:'outdoor'},StreetViewPreference:{NEAREST:'nearest'}}:name==='geometry'?{spherical:{computeHeading:()=>90}}:{Place,SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}}}};
`});
await send('Page.navigate',{url:'http://127.0.0.1:4175/'});await pause(500);
await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','[]');`);
await send('Page.reload');await pause(2200);
console.log(await evaluate(`({cards:document.querySelectorAll('article').length,loaded:document.querySelectorAll('[data-panorama=loaded]').length===5,checked:window.__metadata})`));
assert.equal(await evaluate(`document.querySelectorAll('article').length`),5);
assert.equal(await evaluate(`document.querySelectorAll('[data-panorama=loaded]').length===5`),true);
await evaluate(`window.__denied=true;document.querySelector('.category-tile').click()`);await pause(500);
assert.equal(await evaluate(`document.querySelectorAll('article').length`),0);
console.log('PASS five cards with loaded images; unavailable API produces no empty cards');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await send('Fetch.disable');ws.close()}

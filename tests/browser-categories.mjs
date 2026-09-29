import fs from 'node:fs';
// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4176).
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
await send('Fetch.disable');
injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
const originalFetch=window.fetch;
window.__metadata=0;
window.fetch=(url,options)=>String(url).includes('streetview/metadata')?(window.__metadata++,Promise.resolve({ok:true,json:async()=>({status:window.__denied?'REQUEST_DENIED':String(url).includes('-21.3901')?'ZERO_RESULTS':'OK'})})):originalFetch(url,options);
const Place={searchNearby:async(request)=>({places:Array.from({length:8},(_,i)=>({id:'local'+i,displayName:request.includedTypes[0]+' Local '+i,formattedAddress:'Cataguases',location:{lat:()=>-21.39-i*.0001,lng:()=>-42.69},types:[request.includedTypes[0]]})).reverse()}),searchByText:async()=>({places:[]})};
class StreetViewService {async getPanorama(){if(window.__denied)throw Error('REQUEST_DENIED');return {data:{location:{pano:'test',latLng:{}}}}}}
class StreetViewPanorama {constructor(el){el.dataset.panorama='loaded'}addListener(){}setVisible(){}getStatus(){return 'OK'}}
class MapPreview {constructor(el,options){el.dataset.hybrid=options.mapTypeId;window.__streetControl=options.streetViewControl}}
class Marker {constructor(options){window.__markerPosition=options.position}set map(value){if(value===null){window.__cleanupFailures=(window.__cleanupFailures??0)+1;throw new TypeError('getRootNode unavailable after quota failure')}}}
window.google={maps:{Map:MapPreview,marker:{AdvancedMarkerElement:Marker},LatLng:class{},event:{addListenerOnce(map,event,callback){setTimeout(callback,0);return {remove(){throw new Error('Invalid listener')}}},clearInstanceListeners(){throw new Error('Invalid map')}},StreetViewStatus:{OK:'OK'},importLibrary:async name=>name==='streetView'?{StreetViewService,StreetViewPanorama,StreetViewSource:{OUTDOOR:'outdoor'},StreetViewPreference:{NEAREST:'nearest'}}:name==='geometry'?{spherical:{computeHeading:()=>90}}:{Place,SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}}}};
`});
await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(1500);
await evaluate(`localStorage.clear();localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.setItem('apoio_accessibility_preferences_v1','[]');`);
await send('Page.reload');await pause(2200);

assert.equal(await evaluate("document.querySelectorAll('article').length"),5);
for(const index of [0,1,3,8]) {
 await evaluate(`document.querySelectorAll('.category-tile')[${index}].click()`);await pause(600);
 assert.equal(await evaluate("document.querySelectorAll('article').length"),5,'category must keep five cards');
 assert.equal(await evaluate(`[...document.querySelectorAll('article h2')].every(e=>e.textContent.startsWith(${JSON.stringify(['restaurant','hospital',null,'supermarket',null,null,null,null,'hotel'][index])}))`),true,'results match requested category');
 await evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.startsWith('Ver todos os')).click()");await pause(100);
 assert.equal(await evaluate("document.querySelectorAll('article').length"),8,'show all matching results');
}
await evaluate("document.querySelectorAll('.category-tile')[2].click();document.querySelectorAll('.category-tile')[4].click()");await pause(600);
assert.equal(await evaluate("document.querySelectorAll('article').length"),5);
assert.ok(await evaluate('window.__cleanupFailures>0'),'exercised failed Google cleanup');
console.log('PASS failed Google cleanup does not blank page; category selection, five previews, all eight results and switching resets preview');
}finally{if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});await send('Fetch.disable');ws.close()}

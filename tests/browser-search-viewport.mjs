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

try {
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.disable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,mobile:true,deviceScaleFactor:1});
 await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(1400);
 await evaluate("localStorage.setItem('apoio_accessibility_onboarding_v1','completed')");await send('Page.reload');await pause(1000);
 await evaluate("document.querySelector('#main-search-input').focus()");await pause(400);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:360,mobile:true,deviceScaleFactor:1});await pause(400);
 assert.equal(await evaluate("(()=>{const e=document.querySelector('#main-search-input'),r=e.getBoundingClientRect();return document.activeElement===e && r.top>=document.querySelector('.app-header').getBoundingClientRect().bottom && r.bottom<=visualViewport.height+visualViewport.offsetTop})()"),true,'input stays visible after viewport shrinks');
 assert.equal(await evaluate("parseFloat(getComputedStyle(document.querySelector('#main-search-input')).fontSize)>=16"),true);
 assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy')).animationName"),'none');
 console.log('PASS mobile focus after viewport shrink, readable input, no overflow and reduced motion');
}finally{await send('Emulation.setEmulatedMedia',{features:[]});ws.close()}

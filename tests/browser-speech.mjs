// Run against an isolated Chrome profile (CDP :9223) and Vite preview (:4176).
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

let injection;
try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Fetch.disable'); await send('Network.enable'); await send('Network.setBlockedURLs',{urls:['https://*']});
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
 window.__spoken=[];
 Object.defineProperty(window,'speechSynthesis',{value:{paused:true,getVoices:()=>[{lang:'pt-BR',name:'Test'}],cancel(){},resume(){this.paused=false},speak(u){window.__spoken.push(u);u.onstart?.()}}});
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text}}});
 `});
 await send('Page.navigate',{url:'http://127.0.0.1:4176/'});await pause(2500);
 await evaluate(`localStorage.setItem('apoio_accessibility_onboarding_v1','completed');localStorage.removeItem('acessacidade_accessibility_settings')`);
 await send('Page.reload');await pause(1000);
 await evaluate(`document.querySelector('[aria-controls="accessibility-menu"]').click()`);await pause(100);
 const clickRead=()=>evaluate(`[...document.querySelectorAll('#accessibility-menu button')].find(e=>/Ouvir p|Parar leitura/.test(e.textContent)).click()`);
 await clickRead();await pause(100);
 assert.equal(await evaluate(`window.__spoken.length===1 && window.__spoken[0].text.includes('procura') && window.__spoken[0].voice.lang==='pt-BR' && !speechSynthesis.paused`),true);
 await clickRead();await pause(100);
 await clickRead();await pause(100);
 await evaluate(`window.__spoken[0].onend()`);await pause(100);
 assert.equal(await evaluate(`document.body.innerText.includes('Lendo em voz alta')`),true,'old speech event must not stop new speech');
 await evaluate(`window.__spoken[1].onerror({error:'voice-unavailable'})`);await pause(100);
 assert.equal(await evaluate(`!!document.querySelector('[role="alert"]') && !document.body.innerText.includes('Lendo em voz alta')`),true);
 console.log('PASS page playback, Portuguese voice, resume, stop/restart, stale events and error feedback');
} finally {
 if(injection) await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 ws.close();
}


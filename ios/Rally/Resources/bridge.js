(() => {
  'use strict';
  let nextId = 0;
  const pending = new Map();
  const post = message => window.webkit.messageHandlers.rally.postMessage(message);
  window.rallyNativeReply = (id, result) => {
    const entry = pending.get(id); if (!entry) return;
    pending.delete(id); entry.cleanup();
    if (result.error) entry.reject(new TypeError(result.error));
    else entry.resolve(new Response(result.body, {status: result.status, headers: {'content-type': 'application/json'}}));
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const path = typeof input === 'string' ? input : input.url;
    if (!/^\/api\/(rooms(?:\/|$)|ranked\/|relay\/)/.test(path)) return originalFetch(input, init);
    return new Promise((resolve, reject) => {
      const id = ++nextId, signal = init.signal;
      const abort = () => { pending.delete(id); post({type:'cancel',id}); reject(new DOMException('Request aborted', 'AbortError')); };
      if (signal?.aborted) { reject(new DOMException('Request aborted', 'AbortError')); return; }
      const cleanup = () => signal?.removeEventListener('abort', abort);
      pending.set(id, {resolve, reject, cleanup}); signal?.addEventListener('abort', abort, {once:true});
      const headers = Object.fromEntries(new Headers(init.headers || {}).entries());
      post({type:'fetch',id,path,method:init.method || 'GET',headers,body:init.body || null});
    });
  };
  // Native sharing and clipboard work for bundled file content as well as online play.
  Object.defineProperty(navigator, 'share', {value: async data => {post({type:'share',title:data.title||'Rally Tennis',text:data.text||'',url:data.url||''});}, configurable:true});
  Object.defineProperty(navigator, 'clipboard', {value:{writeText:async text=>post({type:'copy',text:String(text)})}, configurable:true});
})();

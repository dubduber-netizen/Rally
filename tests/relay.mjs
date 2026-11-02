import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localEnv} from '../scripts/local-env.mjs';
const env=localEnv(),host='a'.repeat(48),guest='b'.repeat(48),intruder='c'.repeat(48);
async function api(path,token,body,method='POST'){const r=await worker.fetch(new Request('https://rally.test/api/'+path,{method,headers:{'x-rally-token':token},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,...await r.json()}}
const room=await api('rooms',host,{offer:{type:'offer',sdp:'unreachable'}}),path='rooms/'+room.code;
await api(path+'/join',guest);
const fallback=await api(path,guest,{relay:true},'PATCH');assert.equal(fallback.status,200);
const id=fallback.relayId,relay='relay/'+id;
const packet=(seq,t,extra={})=>({seq,active:true,game:{t,n:seq,...extra},controls:[]});
let r=await api(relay,host,packet(1,'s',{s:{sets:[1,0],pointId:42}}));assert.equal(r.peer,null);
r=await api(relay,guest,packet(1,'i',{i:{x:1,seq:12}}));assert.equal(r.peer.game.s.pointId,42);
r=await api(relay,host,packet(2,'s'));assert.equal(r.peer.game.i.x,1);
assert.equal((await api(relay,intruder,packet(3,'s'))).status,401);
assert.equal((await api(relay,guest,packet(3,'s'))).status,400);
// Refresh uses the same seat token; a new token cannot take over an occupied seat.
r=await api(path+'/join',guest);assert.equal(r.status,200);assert.equal(r.relay,true);
assert.equal((await api(path+'/join',intruder)).status,409);
// A late HTTP packet cannot replace newer input.
await api(relay,guest,packet(5,'i',{i:{x:-1}}));await api(relay,guest,packet(4,'i',{i:{x:1}}));r=await api(relay,host,packet(6,'s'));assert.equal(r.peer.game.i.x,-1);
// Both fallback requests converge without replacing match state.
r=await api(path,host,{relay:true},'PATCH');assert.equal(r.relayId,id);r=await api(relay,host,packet(7,'s'));assert.equal(r.peer.seq,5);
env.sql.prepare('UPDATE relay_matches SET expires=0 WHERE id=?').run(id);assert.equal((await api(relay,host,packet(8,'s'))).status,410);
console.log('PASS: server fallback exchanges state and input without WebRTC, authenticated seats, refresh/rejoin, stale-packet rejection, stable fallback ID, expiry');

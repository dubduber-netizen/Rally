import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import worker from '../worker/index.js';import {localEnv} from '../scripts/local-env.mjs';
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8'),html=JSON.parse(src.slice(11,src.indexOf(';\n'))),js=html.split('<script>')[1].split('</script>')[0];
const c={role:1,engine:null,ping:180,local:{x:1,y:0}};vm.createContext(c);vm.runInContext(js.slice(0,js.indexOf('const $='))+'\nthis.Engine=TennisEngine;',c);vm.runInContext(js.slice(js.indexOf('const guestInputs='),js.indexOf('function send(message)')),c);
c.engine=new c.Engine(0);c.engine.s.armed=true;c.engine.s.phase='rally';c.engine.s.p[1].x=1;c.engine.s.p[1].y=-10;c.rememberGuestInput({t:'i',n:5});
let state=JSON.parse(JSON.stringify(c.engine.s));c.reconcileGuestMovement({x:2,y:-10},{ack:5,s:state},false);assert.equal(state.p[1].x,2,'Replaying movement since the acknowledged input must not pull the guest backward');
state=JSON.parse(JSON.stringify(c.engine.s));state.p[1].x=1.1;c.reconcileGuestMovement({x:2.2,y:-10},{ack:5,s:state},false);assert.equal(state.p[1].x,2.2,'Repeated acknowledgments must not apply the same correction twice');
c.engine.s.p[1].x=2;c.rememberGuestInput({t:'i',n:6});state=JSON.parse(JSON.stringify(c.engine.s));state.p[1].x=1.5;c.reconcileGuestMovement({x:3,y:-10},{ack:6,s:state},false);assert.ok(state.p[1].x>2.8&&state.p[1].x<3,'A real authoritative discrepancy still corrects smoothly');
state=JSON.parse(JSON.stringify(c.engine.s));state.pointId++;state.p[1].x=-2;c.reconcileGuestMovement({x:3,y:-10},{ack:6,s:state},true);assert.equal(state.p[1].x,-2,'A new point must use the authoritative reset');
assert.equal(c.relayInterval(80,false),8);assert.equal(c.relayInterval(20,false),30);assert.equal(c.relayInterval(80,true),1000);
// Render prediction uses the same first-bounce physics as the authoritative engine.
for(const surface of ['clay','grass','hard'])for(const drop of [false,true]){
 const e=new c.Engine(0,surface);e.s.phase='rally';e.s.rackets=[1,0];Object.assign(e.s.p[0],{x:0,y:10});Object.assign(e.s.b,{x:.5,y:10,z:1.1,last:1,bounces:1});e.launch(0,{x:0,y:0,drop,charge:drop?0:1});
 while(e.s.b.z>.12||e.s.b.vz>=0)e.advanceBall(1/120);
 const original=JSON.stringify(e.s.b),prediction=c.predictBall(e.s,.1);assert.equal(JSON.stringify(e.s.b),original,'Visual prediction cannot change match state');e.advanceBall(.1);for(const k of ['x','y','z'])assert.ok(Math.abs(prediction[k]-e.s.b[k])<1e-7,`${surface} ${drop} ${k}: bounce prediction must match physics`);
}
// A successful relay exchange authenticates, writes and fetches the peer in one D1 call.
const env=localEnv(),host='a'.repeat(48),guest='b'.repeat(48);async function api(path,token,body,method='POST'){const r=await worker.fetch(new Request('https://rally.test/api/'+path,{method,headers:{'x-rally-token':token},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,...await r.json()}}
const room=await api('rooms',host,{offer:{type:'offer',sdp:'test'}}),path='rooms/'+room.code;await api(path+'/join',guest);const fallback=await api(path,guest,{relay:true},'PATCH');const packet=(seq,t)=>({seq,active:true,game:{t,n:seq},controls:[]});await api('relay/'+fallback.relayId,host,packet(1,'s'));
let count=0;const prepare=env.DB.prepare.bind(env.DB);env.DB.prepare=sql=>{count++;return prepare(sql)};const reply=await api('relay/'+fallback.relayId,guest,packet(1,'i'));assert.equal(reply.status,200);assert.equal(count,1);assert.ok(reply.peerAgeMs>=0&&reply.peerAgeMs<1000);assert.equal(reply.peer.game.t,'s');
console.log('PASS: delayed-snapshot movement replay, repeated-ack stability, smooth correction, point reset, bounded bounce-aware prediction, faster relay scheduling, one-query authenticated exchange and server-derived packet age');

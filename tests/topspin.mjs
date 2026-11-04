import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const html=JSON.parse(source.slice(11,source.indexOf(';\n'))),script=html.split('<script>')[1].split('</script>')[0];new vm.Script(script);
const context={};vm.createContext(context);vm.runInContext(script.slice(0,script.indexOf('const $='))+'\nthis.Engine=TennisEngine;',context);
function shot({side=1,backhand=false,charge=0,lob=false,serving=false}={}){let e=new context.Engine(0);e.s.ends=[side,-side];Object.assign(e.s.p[0],{x:0,y:side*10,backhand});Object.assign(e.s.b,{x:(backhand?-.5:.5)*side,y:side*10,z:1.1,last:1,bounces:1});e.launch(0,{x:0,y:0,seq:1,backhand,charge,lob,angleReward:true},serving);return e}
for(const side of [1,-1])for(const backhand of [false,true]){
 const tap=shot({side,backhand}),half=shot({side,backhand,charge:.5}),full=shot({side,backhand,charge:1});
 assert.ok(Math.abs(full.s.b.vy)>Math.abs(half.s.b.vy));assert.ok(Math.abs(half.s.b.vy)>Math.abs(tap.s.b.vy));
 assert.equal(tap.s.b.gravity,9.81);assert.ok(full.s.b.gravity>tap.s.b.gravity);assert.ok(Math.abs(full.s.b.vy/tap.s.b.vy)>1.4);
 // A charged shot still lands at the chosen target, rather than gaining power by going long.
 for(const e of [tap,half,full]){const b=e.s.b,t=(-side*7.4-b.y)/b.vy;assert.ok(Math.abs(b.z+b.vz*t-.5*b.gravity*t*t)<1e-9);const netT=-b.y/b.vy;assert.ok(b.z+b.vz*netT-.5*b.gravity*netT*netT>1.07);for(let i=0;i<300&&e.s.b.bounces===0&&e.s.phase==='rally';i++)e.advanceBall(1/120);assert.equal(e.s.phase,'rally');assert.equal(e.s.b.bounces,1);assert.ok(Math.abs(e.s.b.y)<11.885)}
 assert.equal(Math.abs(shot({side,backhand,charge:1}).s.b.vy),Math.abs(shot({side,backhand:!backhand,charge:1}).s.b.vy));
}
for(const setting of [{serving:true}]){const a=shot({...setting,charge:0}).s.b,b=shot({...setting,charge:1}).s.b;for(const key of ['vx','vy','vz','gravity','spin'])assert.equal(a[key],b[key])}
assert.equal(shot({charge:100}).s.b.vy,shot({charge:1}).s.b.vy);assert.equal(shot({charge:-1}).s.b.vy,shot({charge:0}).s.b.vy);
let clock=0,sends=0;const small={textContent:'HAND'},button={dataset:{},style:{setProperty(){}},querySelector(){return small}};
const c={practice:true,practiceReady:false,heldSwing:null,heldLob:null,shotCharge:0,shotSeq:0,lob:false,visualSwingAt:0,performance:{now:()=>clock},sendInputNow:()=>sends++,engine:{s:{phase:'rally',armed:true,pointId:1}},setStroke(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};vm.createContext(c);vm.runInContext('const chargePower=ms=>clamp((ms-140)/660,0,1);'+script.slice(script.indexOf('function swingShot('),script.indexOf('for(const [button,isBackhand]')),c);
c.beginChargedSwing(button,false,1);clock=80;c.releaseChargedSwing(1);assert.equal(c.shotCharge,0);assert.equal(c.shotSeq,1);
c.beginChargedSwing(button,true,2);clock=1000;c.updateChargeMeter(clock);assert.equal(small.textContent,'READY');c.releaseChargedSwing(2);assert.equal(c.shotCharge,1);assert.equal(c.shotSeq,2);
c.beginChargedSwing(button,false,3);clock=1200;c.releaseChargedSwing(4);assert.equal(c.shotSeq,2);c.cancelChargedSwing();c.releaseChargedSwing(3);assert.equal(c.shotSeq,2);
c.beginChargedSwing(button,false,5);c.engine.s.pointId++;c.releaseChargedSwing(5);assert.equal(c.shotSeq,2);assert.equal(sends,2);
console.log('PASS: equal stroke power, controlled landing and net clearance, topspin bounce, unchanged serve, tap versus hold, charge cap, pointer cancellation and stale-point protection');

const bounceSpeeds=[];for(const spin of [0,1]){const e=new context.Engine(0);e.s.phase='rally';Object.assign(e.s.b,{x:0,y:-8,z:0,vx:0,vy:-20,vz:-8,last:0,bounces:0,service:false,spin});e.bounce();bounceSpeeds.push(Math.abs(e.s.b.vy));}assert.equal(bounceSpeeds[0],17.6);assert.ok(bounceSpeeds[1]>=19.6);console.log('PASS: full charge adds over 40% pace versus a tap and retains more speed through the bounce');

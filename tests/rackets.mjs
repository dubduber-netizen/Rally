import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8'),html=JSON.parse(src.slice(11,src.indexOf(';\n'))),js=html.split('<script>')[1].split('</script>')[0],c={};vm.createContext(c);vm.runInContext(js.slice(0,js.indexOf('const $='))+'\nthis.Engine=TennisEngine;',c);
function shot(racket,input={},serving=false,side=1){const e=new c.Engine(0);e.s.rackets=[racket,0];e.s.ends=[side,-side];Object.assign(e.s.p[0],{x:serving?side*2:0,y:side*(serving?12.65:10)});Object.assign(e.s.b,{x:side*.5,y:side*10,z:1.1,last:1,bounces:1});e.launch(0,{x:0,y:0,charge:0,...input},serving);return e}
for(const side of [1,-1])for(const backhand of [false,true]){
 const plain=shot(0,{backhand},true,side),drive=shot(1,{backhand},true,side),touch=shot(2,{backhand},true,side);
 assert.ok(Math.abs(Math.abs(drive.s.b.vy/plain.s.b.vy)-1.10)<1e-12);assert.ok(Math.abs(Math.abs(touch.s.b.vy/plain.s.b.vy)-1)<1e-12);
 // A serve bonus changes pace, preserving the flight's shape and landing target.
 for(const e of [plain,drive,touch]){const b=e.s.b,net=-b.y/b.vy,z=b.z+b.vz*net-.5*b.gravity*net*net;assert.ok(z>1.07);for(let i=0;i<240&&!b.bounces&&e.s.phase==='rally';i++)e.advanceBall(1/120);assert.equal(e.s.phase,'rally');assert.equal(b.bounces,1);assert.ok(Math.abs(b.y)>4.5&&Math.abs(b.y)<4.8)}
 const top=shot(0,{charge:1,backhand},false,side),weaker=shot(1,{charge:1,backhand},false,side);assert.equal(weaker.s.b.spin,.8);assert.equal(top.s.b.spin,1);if(backhand)assert.ok(Math.abs(weaker.s.b.vy)<Math.abs(top.s.b.vy));
 const rally=shot(0,{backhand},false,side),touchRally=shot(2,{backhand},false,side);assert.ok(Math.abs(Math.abs(touchRally.s.b.vy/rally.s.b.vy)-1)<1e-12);
 const standardDrop=shot(0,{drop:true},false,side),touchDrop=shot(2,{drop:true},false,side);
 for(const e of [standardDrop,touchDrop])for(let i=0;i<300&&!e.s.b.bounces&&e.s.phase==='rally';i++)e.advanceBall(1/120);
 assert.equal(touchDrop.s.phase,'rally');assert.equal(touchDrop.s.b.bounces,1);assert.ok(Math.abs(touchDrop.s.b.y)<Math.abs(standardDrop.s.b.y)-.25);assert.ok(touchDrop.s.b.vz<standardDrop.s.b.vz);
}
// Unknown/old client racket IDs safely use Spin, the default racket.
assert.equal(shot(999,{charge:1}).s.b.vy,shot(0,{charge:1}).s.b.vy);assert.equal(shot('2',{charge:1}).s.b.vy,shot(0,{charge:1}).s.b.vy);
const e=shot(2,{drop:true});e.s.rackets[0]=1;assert.equal(e.s.b.dropBounce,.9);const cloned=JSON.parse(JSON.stringify(e.s));assert.equal(cloned.rackets[0],1);assert.equal(cloned.b.dropBounce,.9);e.setupPoint();assert.equal(e.s.rackets[0],1);
assert.equal((html.match(/data-racket="[012]"/g)||[]).length,3);assert.ok(js.includes('avatar:selected,racket:selectedRacket'));assert.ok(js.includes('if(racketChoiceLocked())return;cancelChargedSwing();selectedRacket='));


// Drive favors forehands over backhands and loses extra pace specifically on serve returns.
const fore=shot(1,{backhand:false}),back=shot(1,{backhand:true});assert.ok(Math.abs(fore.s.b.vy)>Math.abs(back.s.b.vy)*1.2);
function returning(racket,backhand){const m=new c.Engine(0);m.s.rackets=[racket,0];m.s.phase='rally';Object.assign(m.s.p[0],{x:0,y:10});Object.assign(m.s.b,{x:.5,y:4,z:1.1,last:1,bounces:0,service:true,returnOfServe:true,vx:0,vy:10,vz:-1});m.s.server=1;m.bounce();assert.equal(m.s.b.service,false);assert.equal(m.s.b.returnOfServe,true);m.s.b.z=1.1;m.s.b.y=10;m.launch(0,{x:0,y:0,backhand});assert.equal(m.s.b.returnOfServe,false);return m}
assert.ok(Math.abs(Math.abs(returning(1,false).s.b.vy/fore.s.b.vy)-.85)<1e-12);assert.ok(Math.abs(Math.abs(returning(1,true).s.b.vy/back.s.b.vy)-.85)<1e-12);
assert.ok(Math.abs(returning(1,false).s.b.vy)<Math.abs(returning(2,false).s.b.vy));
for(const wing of [false,true]){assert.ok(shot(0,{charge:1,backhand:wing}).s.b.spin>shot(1,{charge:1,backhand:wing}).s.b.spin);assert.ok(shot(0,{charge:1,backhand:wing}).s.b.spin>shot(2,{charge:1,backhand:wing}).s.b.spin)}
function landedDrop(racket){const m=shot(racket,{drop:true});for(let i=0;i<300&&!m.s.b.bounces&&m.s.phase==='rally';i++)m.advanceBall(1/120);assert.equal(m.s.phase,'rally');return m.s.b}
const spinDrop=landedDrop(0),driveDrop=landedDrop(1),touchDrop=landedDrop(2);assert.ok(Math.abs(spinDrop.y)>Math.abs(driveDrop.y));assert.ok(Math.abs(driveDrop.y)>Math.abs(touchDrop.y));assert.ok(spinDrop.vz>driveDrop.vz&&driveDrop.vz>touchDrop.vz);
// Choice locks after a serve, including a fault, and does not unlock at the next point.
c.localReady=false;c.practice=true;c.engine=new c.Engine(0);vm.runInContext(js.slice(js.indexOf('function racketChoiceLocked('),js.indexOf('function surfaceChoiceLocked(')),c);assert.equal(c.racketChoiceLocked(),false);c.engine.launch(0,{x:0,y:0},true);assert.equal(c.racketChoiceLocked(),true);c.engine.fault('Test fault');assert.equal(c.racketChoiceLocked(),true);c.engine.setupPoint();assert.equal(c.racketChoiceLocked(),true);c.engine=new c.Engine(0);assert.equal(c.racketChoiceLocked(),false);c.practice=false;assert.equal(c.racketChoiceLocked(),false);c.localReady=true;assert.equal(c.racketChoiceLocked(),true);
console.log('PASS: Drive serve/forehand and backhand/return trade-offs, Spin heavy topspin and weaker drops, Touch drops with normal all-round pace, stable shot metadata, racket lock through points and faults, new-match unlock');

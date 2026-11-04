import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8'),html=JSON.parse(src.slice(11,src.indexOf(';\n'))),js=html.split('<script>')[1].split('</script>')[0],c={};vm.createContext(c);vm.runInContext(js.slice(0,js.indexOf('const $='))+'\nthis.Engine=TennisEngine;',c);
function bounce(surface,spin,drop){const e=new c.Engine(0,surface);e.s.phase='rally';Object.assign(e.s.b,{x:0,y:-4,z:0,vx:2,vy:-10,vz:-6,last:0,bounces:0,service:false,spin,drop});e.bounce();assert.equal(e.s.phase,'rally');return e.s.b}
for(const spin of [0,.5,1])for(const drop of [false,true]){
 const clay=bounce('clay',spin,drop),hard=bounce('hard',spin,drop),grass=bounce('grass',spin,drop);
 assert.ok(grass.vz<hard.vz&&hard.vz<clay.vz);assert.ok(Math.abs(grass.vy)>Math.abs(hard.vy)&&Math.abs(hard.vy)>Math.abs(clay.vy));
 assert.ok(grass.vz/clay.vz>=.939&&grass.vz/clay.vz<.941);assert.ok(Math.abs(grass.vy/clay.vy)<=1.031);assert.ok(Math.abs(grass.vy)<10);assert.equal(grass.gravity,clay.gravity);
}
// Surface effects begin at the bounce; launching the same shot stays identical.
for(const input of [{x:1,y:0,charge:0},{x:-1,y:1,charge:1},{x:0,y:0,lob:true},{x:0,y:0,drop:true}]){
 const balls=[];for(const surface of ['clay','grass','hard']){const e=new c.Engine(0,surface);e.s.phase='rally';Object.assign(e.s.p[0],{x:0,y:10});Object.assign(e.s.b,{x:.5,y:10,z:1,last:1,bounces:1});e.launch(0,input);balls.push(JSON.stringify(e.s.b))}assert.equal(balls[0],balls[1]);assert.equal(balls[0],balls[2]);
}
assert.equal(new c.Engine(0,'unknown').s.surface,'clay');const host=new c.Engine(0,'grass'),guest=new c.Engine(0,'hard');guest.s=JSON.parse(JSON.stringify(host.s));assert.equal(guest.s.surface,'grass');guest.setupPoint();assert.equal(guest.s.surface,'grass');
for(const id of ['clay','grass','hard'])assert.ok(html.includes('data-surface="'+id+'"'));assert.ok(js.includes('if(surfaceChoiceLocked())return;selectedSurface='));
console.log('PASS: subtle surface pace/bounce differences, no added bounce speed, unchanged shot launch, serialized multiplayer surface, point persistence and match selection lock');

import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8'),html=JSON.parse(source.slice(11,source.indexOf(';\n'))),js=html.split('<script>')[1].split('</script>')[0];new vm.Script(js);const c={};vm.createContext(c);vm.runInContext(js.slice(0,js.indexOf('const $='))+'\nthis.Engine=TennisEngine;',c);
for(const side of [1,-1])for(const backhand of [false,true])for(const x of [-1,0,1])for(const y of [-1,0,1]){
 const e=new c.Engine(0);e.s.rackets=[1,0];e.s.ends=[side,-side];Object.assign(e.s.p[0],{x:0,y:side*10,backhand});Object.assign(e.s.b,{x:side*(backhand?-.5:.5),y:side*10,z:1.1,last:1,bounces:1});e.launch(0,{x,y,backhand,drop:true,charge:1,angleReward:true});assert.equal(e.s.b.spin,0);assert.equal(e.s.b.drop,true);
 for(let i=0;i<300&&e.s.b.bounces===0&&e.s.phase==='rally';i++)e.advanceBall(1/120);
 assert.equal(e.s.phase,'rally');assert.equal(e.s.b.bounces,1);assert.ok(-side*e.s.b.y>=2.3&&-side*e.s.b.y<=3.8);assert.ok(Math.abs(e.s.b.vy)<5);
 const firstBounceZSpeed=e.s.b.vz;assert.ok(firstBounceZSpeed<4.5);for(let i=0;i<400&&e.s.phase==='rally';i++)e.advanceBall(1/120);assert.equal(e.s.phase,'between');assert.ok(Math.abs(e.s.b.y)<6.4);
}
const e=new c.Engine(0);e.s.phase='rally';e.s.elapsed=0;e.s.rally=1;Object.assign(e.s.p[1],{x:0,y:-10,cooldown:0});Object.assign(e.s.b,{x:1,y:8,z:1,vx:4,vy:-15,vz:3,last:0,service:false,bounces:0});assert.equal(e.ai(1).x,0);e.s.elapsed=.15;assert.equal(e.ai(1).x,0);e.s.elapsed=.25;e.ai(1);let target=e.aiReads[1].x;assert.ok(target>0);e.s.b.x=-3;e.s.b.vx=-12;e.s.elapsed=.35;e.ai(1);assert.equal(e.aiReads[1].x,target);e.s.elapsed=.6;e.ai(1);assert.ok(e.aiReads[1].x<0);e.s.rally++;e.s.elapsed=.65;assert.equal(e.ai(1).x,0);assert.ok(e.aiReads[1].next>.85);e.s.phase='serve';e.s.server=1;e.s.elapsed=2;assert.equal(e.ai(1).seq,e.s.p[1].seq+1);
assert.ok(html.includes('id="drop-button"'));assert.ok(html.indexOf('id="drop-button"')>html.indexOf('id="lob-button"'));
console.log('PASS: drop shot clears net, lands short, has a soft second bounce, ignores charge; bot delays and caches movement reads while still serving');
// A mix of net and baseline drops should be reachable, while a well-placed short ball can still win.
let returns=0,total=0;
for(const surface of ['clay','hard','grass'])for(const launchDepth of [2,4,6,8,10])for(const depth of [8,10,12])for(const botX of [-2,0,2])for(const aim of [-1,0,1]){
 const match=new c.Engine(0,surface);match.s.rackets=[1,0];match.s.phase='rally';Object.assign(match.s.p[0],{x:0,y:launchDepth});Object.assign(match.s.p[1],{x:botX,y:-depth,cooldown:0});Object.assign(match.s.b,{x:.5,y:launchDepth,z:1.1,last:1,bounces:1});match.launch(0,{x:aim,y:0,drop:true});
 for(let frame=0;frame<480&&match.s.phase==='rally'&&match.s.b.last===0;frame++)match.update(1/120,[{x:0,y:0,seq:0},match.ai(1)]);
 if(match.s.b.last===1)returns++;total++;
}
assert.ok(returns/total>.6,'Bot must approach and return ordinary drops');assert.ok(returns/total<.9,'Well-placed drops must still beat a deep opponent');
console.log(`PASS: bot returns ${returns}/${total} varied drop shots across all surfaces, with winning drops still possible`);

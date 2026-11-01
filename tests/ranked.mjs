import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localEnv} from '../scripts/local-env.mjs';
const env=localEnv(),tokens=['a','b','c','d'].map(x=>x.repeat(64));
async function api(token,path,method='GET',body){let r=await worker.fetch(new Request('https://rally.test/api/ranked/'+path,{method,headers:{'x-player-token':token},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,...await r.json()}}
assert.equal((await api('','profile')).status,401);
for(const t of tokens)assert.equal((await api(t,'profile')).player.rating,1000);
assert.equal((await api(tokens[0],'profile','POST',{name:'Aces'})).player.name,'Aces');
assert.equal((await api(tokens[0],'queue','POST')).queued,true);
let b=await api(tokens[1],'queue','POST'),a=await api(tokens[0],'status');assert.ok(b.match);assert.equal(b.match.id,a.match.id);assert.notEqual(b.match.role,a.match.role);
assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM rank_seats').get().n,2);
let c=await api(tokens[2],'queue','POST');assert.equal(c.queued,true);
// Two contenders must not reserve the same waiting player.
let races=await Promise.all([api(tokens[3],'queue','POST'),api(tokens[2],'queue','POST')]);assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM rank_seats').get().n,4);assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM rank_matches').get().n,2);
await api(tokens[0],'start','POST',{matchId:a.match.id});await api(tokens[1],'start','POST',{matchId:a.match.id});assert.equal((await api(tokens[0],'status')).match.status,'active');
let res=await api(tokens[0],'result','POST',{matchId:a.match.id,winner:0,sets:[2,0]});assert.equal(res.player.rating,1000);
res=await api(tokens[1],'result','POST',{matchId:a.match.id,winner:0,sets:[2,0]});assert.equal(res.match.status,'finished');
res=await api(tokens[0],'status');assert.equal(res.player.rating,res.match.role===0?1016:984);const firstRating=res.player.rating;
await api(tokens[1],'result','POST',{matchId:a.match.id,winner:0,sets:[2,0]});assert.equal((await api(tokens[0],'status')).player.rating,firstRating);
for(const t of tokens.slice(0,2))await api(t,'ack','POST',{matchId:a.match.id});
assert.equal(env.sql.prepare('SELECT COUNT(*) AS n FROM rank_seats').get().n,2);
// Leaving before connection cancels without a loss.
let before=await api(tokens[2],'profile');await api(tokens[2],'queue','DELETE');let cancelled=await api(tokens[3],'status');assert.equal(cancelled.match.status,'cancelled');assert.equal(cancelled.player.losses,0);await api(tokens[3],'ack','POST',{matchId:cancelled.match.id});
// Active match forfeits settle exactly once.
await api(tokens[0],'queue','POST');b=await api(tokens[1],'queue','POST');for(const t of tokens.slice(0,2))await api(t,'start','POST',{matchId:b.match.id});let old=(await api(tokens[0],'profile')).player.losses;await api(tokens[0],'queue','DELETE');assert.equal((await api(tokens[0],'profile')).player.losses,old+1);await api(tokens[0],'queue','DELETE');assert.equal((await api(tokens[0],'profile')).player.losses,old+1);
console.log('PASS: saved profiles, Elo pairing, concurrent queue claims, both-confirmed result, idempotent ratings, cancellation, active forfeit');
// Unconfirmed results must not turn into a contradictory forfeit after leaving.
for(const t of tokens.slice(0,2)){const current=await api(t,'status');if(current.match)await api(t,'ack','POST',{matchId:current.match.id})}
await api(tokens[0],'queue','POST');b=await api(tokens[1],'queue','POST');for(const t of tokens.slice(0,2))await api(t,'start','POST',{matchId:b.match.id});await api(tokens[0],'result','POST',{matchId:b.match.id,winner:0,sets:[2,1]});let rating=(await api(tokens[0],'profile')).player.rating;await api(tokens[0],'queue','DELETE');assert.equal((await api(tokens[0],'profile')).player.rating,rating);await api(tokens[1],'result','POST',{matchId:b.match.id,winner:1,sets:[1,2]});assert.equal((await api(tokens[1],'status')).match.status,'disputed');assert.equal((await api(tokens[0],'profile')).player.rating,rating);
console.log('PASS: unfinished confirmation survives leaving; conflicting results do not affect ratings');
for(const t of tokens.slice(0,2)){let current=await api(t,'status');if(current.match)await api(t,'ack','POST',{matchId:current.match.id})}
await api(tokens[0],'queue','POST');b=await api(tokens[1],'queue','POST');const roomToken='e'.repeat(48);let rr=await worker.fetch(new Request('https://rally.test/api/rooms',{method:'POST',headers:{'x-rally-token':roomToken},body:JSON.stringify({offer:{type:'offer',sdp:'ranked-offer'}})}),env);const room=await rr.json();assert.match(room.code,/^[A-Z]{4}$/);assert.equal((await api(tokens[0],'room','POST',{matchId:b.match.id,room:room.code,roomToken})).status,400);assert.equal((await api(tokens[1],'room','POST',{matchId:b.match.id,room:room.code,roomToken:'wrong'})).status,403);assert.equal((await api(tokens[1],'room','POST',{matchId:b.match.id,room:room.code,roomToken})).match.room,room.code);assert.equal((await api(tokens[0],'status')).match.room,room.code);
env.sql.prepare('UPDATE rank_matches SET guest_seen=? WHERE id=?').run(Date.now()-91000,b.match.id);assert.equal((await api(tokens[1],'status')).match.status,'cancelled');
console.log('PASS: four-letter ranked signaling room, host ownership, guest room discovery, preconnection timeout');

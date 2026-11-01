import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function localEnv(){
 const sql=new DatabaseSync(':memory:');for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())sql.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const wrap=(query,args=[])=>({bind(...values){return wrap(query,values)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){const v=sql.prepare(query).run(...args);return {success:true,meta:{changes:v.changes}}},query,args});
 const DB={prepare:query=>wrap(query),async batch(statements){sql.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(sql.prepare(s.query).run(...s.args));sql.exec('COMMIT');return rows}catch(e){sql.exec('ROLLBACK');throw e}}};
 const data=new Map();const BUCKET={async get(k){let v=data.get(k);return v?{etag:v.etag,json:async()=>JSON.parse(v.value)}:null},async put(k,value,o){if(o?.onlyIf?.etagDoesNotMatch==='*'&&data.has(k))return null;if(o?.onlyIf?.etagMatches&&data.get(k)?.etag!==o.onlyIf.etagMatches)return null;const v={value,etag:crypto.randomUUID()};data.set(k,v);return v},async delete(k){data.delete(k)},async list({prefix}){return {objects:[...data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}}};
 return {DB,BUCKET,sql};
}

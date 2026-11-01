import http from 'node:http';
import worker from '../worker/index.js';
import {localEnv} from './local-env.mjs';
const env=localEnv();
http.createServer(async(req,res)=>{try{let chunks=[];for await(const chunk of req)chunks.push(chunk);let init={method:req.method,headers:req.headers};if(!['GET','HEAD'].includes(req.method))init.body=Buffer.concat(chunks);let r=await worker.fetch(new Request('http://localhost'+req.url,init),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}}).listen(Number(process.env.PORT||(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:3000)),'0.0.0.0');

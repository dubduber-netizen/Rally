import fs from 'node:fs';
import vm from 'node:vm';
const origin='https://rally-tennis.dubduber.chatgpt.site';
const source=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
let html=JSON.parse(source.slice(11,source.indexOf(';\n')));
if(!html.includes('const link=new URL(location.href)'))throw new Error('Invite export anchor changed');
html=html.replace('const link=new URL(location.href)',`const link=new URL('${origin}/')`);
html=html.replaceAll('document.hidden','(document.hidden||window.rallyAppPaused)');
html=html.replace('shotSeq++;lob=isLob;',"window.webkit?.messageHandlers.rally?.postMessage({type:'haptic'});shotSeq++;lob=isLob;");
html=html.replace('</body>',`<script>
window.addEventListener('rallyappstate',()=>{keys={};target=null;cancelChargedSwing();document.dispatchEvent(new Event('visibilitychange'))});
</script></body>`);
for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
fs.writeFileSync(new URL('../ios/Rally/Resources/game.html',import.meta.url),html);
console.log('Bundled Rally game: offline practice, current courts and controls, production multiplayer API via native bridge.');

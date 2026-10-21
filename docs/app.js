(function(){'use strict';
var KEY='dotmail-viewer-last',$=function(i){return document.getElementById(i)};
// Locked-down policy injected into every opened file: no network of any kind.
var CSP='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">';
var TPL=null;
function err(m){$('err').textContent=m||''}
function harden(html){var m=/<head[^>]*>/i.exec(html);return m?html.slice(0,m.index+m[0].length)+CSP+html.slice(m.index+m[0].length):CSP+html}
function getLast(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.html?v:null}catch(e){return null}}
function show(html,name){$('frame').removeAttribute('src');$('frame').srcdoc=harden(html);$('nm').textContent=name;$('forgetV').hidden=!getLast();$('close').textContent=getLast()?'Open another file':'Close';document.body.classList.add('viewing');err('')}
function close(){document.body.classList.remove('viewing');$('frame').removeAttribute('srcdoc');$('frame').src='about:blank';refreshLast()}
function remember(html,name){try{localStorage.setItem(KEY,JSON.stringify({name:name,html:html}));return true}catch(e){err('Opened, but it is too large to remember on this device.');return false}}
function forget(){try{localStorage.removeItem(KEY)}catch(e){}refreshLast()}
function template(cb){if(TPL)return cb(TPL);
  var x=new XMLHttpRequest();x.open('GET','template.html');x.onload=function(){if(x.status!==200)return err('Could not load the viewer template.');TPL=x.responseText;cb(TPL)};x.onerror=function(){err('Could not load the viewer template.')};x.send()}
function fromData(d,cb){
  if(!d||typeof d!=='object'||!Array.isArray(d.threads))return err('This is not .mail page data (needs a "threads" list).');
  var js=JSON.stringify(d).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  template(function(t){var h=t;if(!d.demo)h=h.replace(/<div class="banner">[\s\S]*?<\/div>\n?/,'').replace('<title>.mail (demo)</title>','<title>.mail</title>');cb(h.split('__DATA__').join(js))})}
function handle(text,name,rem){
  var t=text.replace(/^\uFEFF/,''),s=t.trimStart();
  function done(html){if(rem)remember(html,name);show(html,name)}
  if(s[0]==='{'){var d;try{d=JSON.parse(s)}catch(e){return err('That JSON file could not be read.')}return fromData(d,done)}
  if(!/<html|<!doctype/i.test(s.slice(0,2000)))return err('That does not look like a .mail file.');
  done(t)}
function readFile(f){if(!f)return;if(f.size>50*1024*1024)return err('That file is too large.');
  var r=new FileReader();r.onload=function(){handle(String(r.result),f.name,$('rem').checked)};r.onerror=function(){err('Could not read that file.')};r.readAsText(f)}
// #m=<base64url(deflate-raw(JSON))> links: decoded locally, never sent anywhere (fragments are not sent to servers).
function fromLink(p){
  history.replaceState(null,'',location.pathname+location.search);
  if(typeof DecompressionStream==='undefined'||typeof Response==='undefined'){return err('This browser is too old to open .mail links. Ask your bot for the .mail file instead.')}
  var b;try{var s=p.replace(/-/g,'+').replace(/_/g,'/');s+='==='.slice((s.length+3)%4);var bin=atob(s);b=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i)}catch(e){return err('This .mail link is damaged or incomplete.')}
  var ds;try{ds=new DecompressionStream('deflate-raw')}catch(e){return err('This browser cannot open .mail links. Ask your bot for the .mail file instead.')}
  new Response(new Blob([b]).stream().pipeThrough(ds)).text().then(function(txt){var d;try{d=JSON.parse(txt)}catch(e){return err('This .mail link is damaged or incomplete.')}
    fromData(d,function(html){var nm=(d.inbox?d.inbox+' ':'')+'(from link)';remember(html,nm);show(html,nm)})},function(){err('This .mail link is damaged or incomplete.')})}
function refreshLast(){var v=getLast();$('last').style.display=v?'flex':'none';if(v)$('lastName').textContent='Remembered: '+v.name}
$('openBtn').onclick=function(){$('file').value='';$('file').click()};
$('file').onchange=function(){readFile(this.files[0])};
$('demoBtn').onclick=function(){$('frame').removeAttribute('srcdoc');$('frame').src='demo.html';$('nm').textContent='Demo inbox (fictional)';$('forgetV').hidden=true;$('close').textContent='Close';document.body.classList.add('viewing');err('')};
$('close').onclick=close;
$('reopen').onclick=function(){var v=getLast();if(v)show(v.html,v.name);else err('Nothing remembered.')};
$('forget').onclick=forget;
$('forgetV').onclick=function(){forget();close()};
var dz=$('drop');
['dragenter','dragover'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();dz.classList.add('over')})});
['dragleave','drop'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();if(e==='drop'||ev.target===document.documentElement)dz.classList.remove('over')})});
document.addEventListener('drop',function(ev){var f=ev.dataTransfer&&ev.dataTransfer.files[0];if(f&&!document.body.classList.contains('viewing'))readFile(f)});
refreshLast();
if(location.hash.indexOf('#m=')===0)fromLink(location.hash.slice(3));
else{var v=getLast();if(v)show(v.html,v.name)}
window.addEventListener('hashchange',function(){if(location.hash.indexOf('#m=')===0)fromLink(location.hash.slice(3))});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
})();

(function(){'use strict';
var KEY='dotmail-viewer-last',$=function(i){return document.getElementById(i)};
// Locked-down policy injected into every opened file: no network of any kind.
var CSP='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">';
var TPL=null;
function err(m){$('err').textContent=m||''}
function harden(html){var m=/<head[^>]*>/i.exec(html);return m?html.slice(0,m.index+m[0].length)+CSP+html.slice(m.index+m[0].length):CSP+html}
function getLast(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&(v.html||v.enc)?v:null}catch(e){return null}}
function show(html,name){$('frame').removeAttribute('src');$('frame').srcdoc=harden(html);$('nm').textContent=name;$('forgetV').hidden=!getLast();$('close').textContent=getLast()?'Open another file':'Close';document.body.classList.add('viewing');err('')}
function close(){document.body.classList.remove('viewing');$('frame').removeAttribute('srcdoc');$('frame').src='about:blank';refreshLast()}
function remember(html,name,enc){try{localStorage.setItem(KEY,JSON.stringify(enc?{name:name,enc:enc}:{name:name,html:html}));return true}catch(e){err('Opened, but it is too large to remember on this device.');return false}}
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
  var m=/<script type="application\/json" id="data">([\s\S]*?)<\/script>/.exec(t),d=null;
  if(m){try{d=JSON.parse(m[1])}catch(e){d=null}}
  if(d&&Array.isArray(d.threads))return fromData(d,done);
  done(t)}
function readFile(f){if(!f)return;if(f.size>50*1024*1024)return err('That file is too large.');
  var r=new FileReader();r.onload=function(){handle(String(r.result),f.name,$('rem').checked)};r.onerror=function(){err('Could not read that file.')};r.readAsText(f)}
// #m=<base64url(deflate-raw(JSON))> links: decoded locally, never sent anywhere (fragments are not sent to servers).
function b64u(p){var s=p.replace(/-/g,'+').replace(/_/g,'/');s+='==='.slice((s.length+3)%4);var bin=atob(s),b=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return b}
function oldBrowser(){if(typeof DecompressionStream==='undefined'||typeof Response==='undefined'){err('This browser is too old to open .mail links. Ask your bot for the .mail file instead.');return true}return false}
function inflate(b,enc){var ds;try{ds=new DecompressionStream('deflate-raw')}catch(e){return err('This browser cannot open .mail links. Ask your bot for the .mail file instead.')}
  new Response(new Blob([b]).stream().pipeThrough(ds)).text().then(function(txt){var d;try{d=JSON.parse(txt)}catch(e){return err('This .mail link is damaged or incomplete.')}
    fromData(d,function(html){var nm=(d.inbox?d.inbox+' ':'')+(enc?'(locked link)':'(from link)');if(enc)remember(null,nm,enc);else remember(html,nm);unlockDone();show(html,nm)})},function(){err('This .mail link is damaged or incomplete.')})}
function fromLink(p){history.replaceState(null,'',location.pathname+location.search);if(oldBrowser())return;
  var b;try{b=b64u(p)}catch(e){return err('This .mail link is damaged or incomplete.')}inflate(b)}
// #e= locked links: version 1 | iterations (u32 BE) | salt 16 | iv 12 | AES-256-GCM ciphertext+tag. Only this encrypted form is ever stored.
var pendingEnc=null;
function fromLocked(p,name){history.replaceState(null,'',location.pathname+location.search);if(oldBrowser())return;
  if(!window.crypto||!crypto.subtle)return err('This browser cannot unlock .mail links (needs a secure https page).');
  try{var b=b64u(p);if(b[0]!==1||b.length<34)throw 0}catch(e){return err('This .mail link is damaged or incomplete.')}
  pendingEnc=p;document.body.classList.remove('viewing');document.body.classList.add('locked');$('lock').hidden=false;$('lockErr').textContent='';$('pc').value='';
  $('lockForget').hidden=!(getLast()&&getLast().enc===p);setTimeout(function(){$('pc').focus()},50)}
function unlockDone(){document.body.classList.remove('locked');$('lock').hidden=true;pendingEnc=null}
$('lockForm').onsubmit=function(ev){ev.preventDefault();var p=pendingEnc;if(!p)return;var b=b64u(p),it=((b[1]<<24)>>>0)+(b[2]<<16)+(b[3]<<8)+b[4],salt=b.slice(5,21),iv=b.slice(21,33),ct=b.slice(33);
  $('unlock').disabled=true;$('lockErr').textContent='Unlocking…';
  crypto.subtle.importKey('raw',new TextEncoder().encode($('pc').value),'PBKDF2',false,['deriveKey']).then(function(k){
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,{name:'AES-GCM',length:256},false,['decrypt'])}).then(function(key){
    return crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct)}).then(function(plain){$('unlock').disabled=false;$('lockErr').textContent='';$('pc').value='';inflate(new Uint8Array(plain),p)},
    function(){$('unlock').disabled=false;$('lockErr').textContent='Wrong passcode';$('pc').select()})};
$('lockForget').onclick=function(){forget();unlockDone()};
function refreshLast(){var v=getLast();$('last').style.display=v?'flex':'none';if(v)$('lastName').textContent='Remembered: '+v.name}
$('openBtn').onclick=function(){$('file').value='';$('file').click()};
$('file').onchange=function(){readFile(this.files[0])};
$('demoBtn').onclick=function(){$('frame').removeAttribute('srcdoc');$('frame').src='demo.html';$('nm').textContent='Demo inbox (fictional)';$('forgetV').hidden=true;$('close').textContent='Close';document.body.classList.add('viewing');err('')};
$('close').onclick=close;
$('reopen').onclick=function(){var v=getLast();if(v&&v.enc)fromLocked(v.enc,v.name);else if(v)show(v.html,v.name);else err('Nothing remembered.')};
$('forget').onclick=forget;
$('forgetV').onclick=function(){forget();close()};
var dz=$('drop');
['dragenter','dragover'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();dz.classList.add('over')})});
['dragleave','drop'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();if(e==='drop'||ev.target===document.documentElement)dz.classList.remove('over')})});
document.addEventListener('drop',function(ev){var f=ev.dataTransfer&&ev.dataTransfer.files[0];if(f&&!document.body.classList.contains('viewing'))readFile(f)});
refreshLast();
if(location.hash.indexOf('#m=')===0)fromLink(location.hash.slice(3));
else if(location.hash.indexOf('#e=')===0)fromLocked(location.hash.slice(3));
else if(/^\?demo\b/.test(location.search)||location.hash==='#demo')$('demoBtn').onclick();
else{var v=getLast();if(v){if(v.enc)fromLocked(v.enc,v.name);else show(v.html,v.name)}}
window.addEventListener('hashchange',function(){if(location.hash.indexOf('#m=')===0)fromLink(location.hash.slice(3));else if(location.hash.indexOf('#e=')===0)fromLocked(location.hash.slice(3))});
// Install tip: phones only, once, never when already installed.
(function(){var KEY2='dotmail-install-tip',ua=navigator.userAgent,tip=$('itip');
  try{if(localStorage.getItem(KEY2))return}catch(e){return}
  var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;if(standalone)return;
  var ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),android=/Android/.test(ua)&&/Mobile|Chrome/.test(ua);
  if(!ios&&!android)return;
  var deferred=null;function done(){tip.hidden=true;try{localStorage.setItem(KEY2,'1')}catch(e){}}
  var T=$('itipText');
  if(ios){if(/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|Instagram|FBAN|FBAV|Line\//.test(ua)||!/Safari/.test(ua))T.textContent='Open this page in Safari first, then tap Share and Add to Home Screen.';
    else{T.innerHTML='Tap the Share button <svg viewBox="0 0 24 24" aria-label="Share"><path d="M12 15V3M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg> then <b>Add to Home Screen</b>.'}}
  else T.textContent='Tap the \u22ee menu, then Add to Home screen.';
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;T.textContent='Open it like an app, right from your Home Screen.';$('itipInstall').hidden=false});
  $('itipInstall').onclick=function(){if(!deferred)return;deferred.prompt();deferred.userChoice.then(function(c){if(c&&c.outcome==='accepted')done()},function(){});deferred=null;$('itipInstall').hidden=true};
  window.addEventListener('appinstalled',done);$('itipX').onclick=done;tip.hidden=false})();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(function(){});
})();

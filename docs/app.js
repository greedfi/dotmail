(function(){'use strict';
var KEY='dotmail-viewer-last',$=function(i){return document.getElementById(i)};
// Locked-down policy injected into every opened file: no network of any kind.
var CSP='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">';
var TPL=null;
function err(m){$('err').textContent=m||''}
function harden(html){
  var m=/<head[^>]*>/i.exec(html);
  return m?html.slice(0,m.index+m[0].length)+CSP+html.slice(m.index+m[0].length):CSP+html;
}
function show(html,name){
  $('frame').srcdoc=harden(html);$('nm').textContent=name;document.body.classList.add('viewing');err('');
}
function close(){document.body.classList.remove('viewing');$('frame').removeAttribute('srcdoc');$('frame').src='about:blank';refreshLast()}
function fromJSON(text,name,cb){
  var d;try{d=JSON.parse(text)}catch(e){return err('That JSON file could not be read.')}
  if(!d||typeof d!=='object'||!Array.isArray(d.threads))return err('This JSON is not .mail page data (needs a "threads" list).');
  var js=JSON.stringify(d).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  function go(t){var h=t.replace(/<div class="banner">[\s\S]*?<\/div>\n?/,'').replace('<title>.mail (demo)</title>','<title>.mail</title>');cb(h.split('__DATA__').join(js))}
  if(TPL)return go(TPL);
  var x=new XMLHttpRequest();x.open('GET','template.html');x.onload=function(){if(x.status!==200)return err('Could not load the viewer template.');TPL=x.responseText;go(TPL)};x.onerror=function(){err('Could not load the viewer template.')};x.send();
}
function handle(text,name,remember){
  var t=text.replace(/^\uFEFF/,''),s=t.trimStart();
  function done(html){
    if(remember){try{localStorage.setItem(KEY,JSON.stringify({name:name,html:html}))}catch(e){err('Opened, but it is too large to remember on this device.')}}
    show(html,name);
  }
  if(s[0]==='{')return fromJSON(s,name,done);
  if(!/<html|<!doctype/i.test(s.slice(0,2000)))return err('That does not look like a .mail file.');
  done(t);
}
function readFile(f){
  if(!f)return;if(f.size>50*1024*1024)return err('That file is too large.');
  var r=new FileReader();r.onload=function(){handle(String(r.result),f.name,$('rem').checked)};r.onerror=function(){err('Could not read that file.')};r.readAsText(f);
}
function refreshLast(){var v=null;try{v=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  $('last').style.display=v&&v.html?'flex':'none';if(v)$('lastName').textContent='Remembered: '+v.name}
$('openBtn').onclick=function(){$('file').value='';$('file').click()};
$('file').onchange=function(){readFile(this.files[0])};
$('demoBtn').onclick=function(){$('frame').removeAttribute('srcdoc');$('frame').src='demo.html';$('nm').textContent='Demo inbox (fictional)';document.body.classList.add('viewing');err('')};
$('close').onclick=close;
$('reopen').onclick=function(){try{var v=JSON.parse(localStorage.getItem(KEY));show(v.html,v.name)}catch(e){err('Nothing remembered.')}};
$('forget').onclick=function(){try{localStorage.removeItem(KEY)}catch(e){}refreshLast()};
var dz=$('drop');
['dragenter','dragover'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();dz.classList.add('over')})});
['dragleave','drop'].forEach(function(e){document.addEventListener(e,function(ev){ev.preventDefault();if(e==='drop'||ev.target===document.documentElement)dz.classList.remove('over')})});
document.addEventListener('drop',function(ev){var f=ev.dataTransfer&&ev.dataTransfer.files[0];if(f&&!document.body.classList.contains('viewing'))readFile(f)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('viewing')&&document.activeElement===document.body)close()});
refreshLast();
})();

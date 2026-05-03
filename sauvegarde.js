// SAUVEGARDE GITHUB - Module partagé index.html + examen.html
const GITHUB_OWNER='fredgendrin',GITHUB_REPO='Maths-ECE3',GITHUB_FILE='resultats.json',GITHUB_BRANCH='main',TOKEN_STORE='eib_github_token';
const BACKUP_KEYS=['eib_prog_v6','eib_remedial_v6','eib_exams_v1'];
function getGHToken(){return localStorage.getItem(TOKEN_STORE)||'';}
async function githubLoad(){
  const token=getGHToken();if(!token)return false;
  try{
    const url=`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`;
    const resp=await fetch(url,{headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json'}});
    if(resp.status===404)return false;
    if(!resp.ok)throw new Error('load '+resp.status);
    const data=await resp.json();
    const content=JSON.parse(atob(data.content.replace(/\n/g,'')));
    BACKUP_KEYS.forEach(key=>{if(content[key]!==undefined)localStorage.setItem(key,JSON.stringify(content[key]));});
    console.log('[Sauvegarde] Restauré depuis GitHub');
    return true;
  }catch(e){console.warn('[Sauvegarde] Erreur load:',e.message);return false;}
}
async function githubSave(){
  const token=getGHToken();if(!token)return false;
  try{
    const backup={savedAt:new Date().toISOString()};
    BACKUP_KEYS.forEach(key=>{const val=localStorage.getItem(key);if(val)backup[key]=JSON.parse(val);});
    const content=btoa(unescape(encodeURIComponent(JSON.stringify(backup,null,2))));
    const url=`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
    let sha=null;
    try{const ex=await fetch(url,{headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json'}});if(ex.ok){const d=await ex.json();sha=d.sha;}}catch(e){}
    const body={message:'Resultats '+new Date().toLocaleDateString('fr-FR'),content,branch:GITHUB_BRANCH};
    if(sha)body.sha=sha;
    const r=await fetch(url,{method:'PUT',headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok){const err=await r.json();throw new Error(err.message);}
    console.log('[Sauvegarde] Sauvegardé sur GitHub');
    return true;
  }catch(e){console.warn('[Sauvegarde] Erreur save:',e.message);return false;}
}
function showSaveIndicator(status){
  let el=document.getElementById('ghSI');
  if(!el){el=document.createElement('div');el.id='ghSI';el.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;padding:8px 16px;border-radius:100px;font-size:12px;font-family:sans-serif;border:1px solid;transition:opacity 0.3s;';document.body.appendChild(el);}
  const m={saving:{bg:'rgba(108,92,231,0.15)',b:'rgba(108,92,231,0.4)',c:'#a29bfe',t:'Sauvegarde...'},saved:{bg:'rgba(0,184,148,0.12)',b:'rgba(0,184,148,0.4)',c:'#6ee7b7',t:'Sauvegardé ☁️'},error:{bg:'rgba(214,48,49,0.12)',b:'rgba(214,48,49,0.4)',c:'#fca5a5',t:'Erreur sauvegarde'}}[status];
  el.style.background=m.bg;el.style.borderColor=m.b;el.style.color=m.c;el.textContent=m.t;el.style.opacity='1';
  if(status!=='saving')setTimeout(()=>el.style.opacity='0',3000);
}
async function githubSaveWithIndicator(){showSaveIndicator('saving');const ok=await githubSave();showSaveIndicator(ok?'saved':'error');return ok;}
async function initGithubBackup(cb){const t=getGHToken();if(!t){if(cb)cb(false);return;}const ok=await githubLoad();if(cb)cb(ok);}
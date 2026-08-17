import { app } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { t } from './i18n.js';
import { applyTheme, savedTheme } from './theme.js';
const auth=getAuth(app),db=getFirestore(app),$=s=>document.querySelector(s);let user,prefs=savedTheme();
function render(){applyTheme(prefs);document.documentElement.lang=prefs.locale;document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(prefs.locale,el.dataset.i18n));$('#locale').value=prefs.locale;$('#primary').value=prefs.primary;$('#secondary').value=prefs.secondary;document.querySelectorAll('.theme').forEach(button=>button.classList.toggle('selected',button.dataset.p.toLowerCase()===prefs.primary.toLowerCase()&&button.dataset.s.toLowerCase()===prefs.secondary.toLowerCase()))}
onAuthStateChanged(auth,async current=>{if(!current)return location.assign('./index.html');user=current;const snapshot=await getDoc(doc(db,'private_users',user.uid));prefs={...prefs,...(snapshot.data()?.preferences||{})};render()});
document.querySelectorAll('.theme').forEach(button=>button.onclick=()=>{prefs.primary=button.dataset.p;prefs.secondary=button.dataset.s;render()});
['primary','secondary','locale'].forEach(id=>$(('#'+id)).oninput=event=>{prefs[id]=event.target.value;render()});
$('#settingsForm').onsubmit=async event=>{event.preventDefault();try{await setDoc(doc(db,'private_users',user.uid),{preferences:prefs,preferencesUpdatedAt:serverTimestamp()},{merge:true});applyTheme(prefs);alert(t(prefs.locale,'save'));}catch(error){alert(error.message)}};

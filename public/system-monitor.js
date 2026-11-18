(()=>{
'use strict';
const root=document.querySelector('[data-system-monitor]');
if(!root)return;
const grid=root.querySelector('.sm-grid'),panel=root.querySelector('.sm-settings');
const open=root.querySelector('[data-sm-open]'),close=root.querySelectorAll('[data-sm-close]');
const themeToggle=root.querySelector('[data-sm-theme-toggle]'),languageSelect=root.querySelector('[data-sm-language-select]');
const refreshButton=root.querySelector('[data-sm-refresh]'),countdown=root.querySelector('[data-sm-countdown]');
const refreshForm=root.querySelector('.sm-refresh-form'),soundToggle=root.querySelector('[data-sm-sound-toggle]');
const intervalSelect=root.querySelector('[data-sm-refresh-interval]'),saveRefreshButton=root.querySelector('[data-sm-save-refresh]');
const layoutKey='laravel-system-monitor:layout:v1',themeKey='laravel-system-monitor:theme:v1',refreshKey='laravel-system-monitor:refresh-interval:v1',soundKey='laravel-system-monitor:sound:v1';
const labels={up:root.dataset.moveUp||'Move up',down:root.dataset.moveDown||'Move down',drag:root.dataset.dragHandle||'Drag to reorder',disabled:'Automatic refresh disabled',next:countdown?.dataset.label||'Next refresh'};
let layout={hidden:[],order:[]};try{layout=Object.assign(layout,JSON.parse(localStorage.getItem(layoutKey)||'{}'));}catch(e){}
const cards=[...grid.querySelectorAll('[data-widget]')],byId=id=>cards.find(card=>card.dataset.widget===id);
const currentOrder=()=>[...grid.querySelectorAll('[data-widget]')].map(card=>card.dataset.widget);
const save=()=>{try{localStorage.setItem(layoutKey,JSON.stringify(layout));}catch(e){}};
const apply=()=>{cards.forEach(card=>card.hidden=layout.hidden.includes(card.dataset.widget));layout.order.forEach(id=>{const card=byId(id);if(card)grid.appendChild(card);});};
const move=(id,direction)=>{const card=byId(id);if(!card)return;const ordered=currentOrder(),index=ordered.indexOf(id),target=index+direction;if(target<0||target>=ordered.length)return;const other=byId(ordered[target]);if(direction<0)grid.insertBefore(card,other);else grid.insertBefore(other,card);layout.order=currentOrder();save();renderOptions();};
const renderOptions=()=>{
 const list=panel.querySelector('[data-sm-options]');list.innerHTML='';
 currentOrder().forEach((id,index)=>{const card=byId(id);if(!card)return;
  const row=document.createElement('div');row.className='sm-widget-option';
  const main=document.createElement('label');main.className='sm-widget-option-main';
  const text=document.createElement('span');text.textContent=card.dataset.title;
  const input=document.createElement('input');input.type='checkbox';input.checked=!layout.hidden.includes(id);
  input.addEventListener('change',()=>{layout.hidden=input.checked?layout.hidden.filter(x=>x!==id):[...layout.hidden,id];apply();save();});
  main.append(input,text);
  const actions=document.createElement('div');actions.className='sm-widget-option-actions';
  const up=document.createElement('button');up.type='button';up.textContent='↑';up.title=labels.up;up.setAttribute('aria-label',labels.up);up.disabled=index===0;up.addEventListener('click',()=>move(id,-1));
  const down=document.createElement('button');down.type='button';down.textContent='↓';down.title=labels.down;down.setAttribute('aria-label',labels.down);down.disabled=index===currentOrder().length-1;down.addEventListener('click',()=>move(id,1));
  actions.append(up,down);row.append(main,actions);list.appendChild(row);
 });
};
const setTheme=theme=>{const selected=theme==='light'?'light':'dark';document.body.dataset.theme=selected;document.documentElement.style.colorScheme=selected;if(themeToggle){themeToggle.textContent=selected==='dark'?'☀':'☾';themeToggle.setAttribute('aria-label',selected==='dark'?'Switch to light mode':'Switch to dark mode');themeToggle.setAttribute('title',selected==='dark'?'Light mode':'Dark mode');}};
let savedTheme='dark';try{savedTheme=localStorage.getItem(themeKey)||'dark';}catch(e){}setTheme(savedTheme);
languageSelect?.addEventListener('change',()=>languageSelect.form?.submit());
themeToggle?.addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem(themeKey,next);}catch(e){}});
open?.addEventListener('click',()=>{renderOptions();panel.classList.add('open');panel.setAttribute('aria-hidden','false');});
close.forEach(el=>el.addEventListener('click',()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}));
panel?.addEventListener('click',e=>{if(e.target===panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}});
root.querySelector('[data-sm-reset]')?.addEventListener('click',()=>{layout={hidden:[],order:[]};apply();save();renderOptions();});

// The server-rendered page controls refreshes. This countdown is display-only;
// automatic refresh itself is handled by the browser's native meta refresh.
const refreshInterval=Math.max(0,Number(root.dataset.refreshInterval??60)||0);
if(intervalSelect)intervalSelect.value=String(refreshInterval);
let nextRefreshAt=refreshInterval?Date.now()+refreshInterval*1000:0;
const updateCountdown=()=>{
 if(!countdown)return;
 if(!refreshInterval){countdown.textContent=labels.disabled;return;}
 const remaining=Math.max(0,Math.ceil((nextRefreshAt-Date.now())/1000));
 countdown.textContent=labels.next+': '+remaining+'s';
};
updateCountdown();
if(refreshInterval)window.setInterval(updateCountdown,1000);
refreshForm?.addEventListener('submit',()=>{const stamp=refreshForm.querySelector('input[name="_sm_refresh"]');if(stamp)stamp.value=String(Date.now());});
// Sound preferences use sessionStorage so every browser tab has independent settings.
let soundEnabled=true,audioContext=null,alertSoundTimer=null;
// Keep a stable tab identifier across reloads, while isolating preferences between tabs.
const soundTabId=(()=>{try{let id=sessionStorage.getItem('laravel-system-monitor:sound-tab:v1');if(!id){id=window.crypto?.randomUUID?.()||('tab-'+Date.now()+'-'+Math.random().toString(36).slice(2));sessionStorage.setItem('laravel-system-monitor:sound-tab:v1',id);}return id;}catch(e){return 'session';}})();
const tabSoundStorageKey=key=>'laravel-system-monitor:tab:'+soundTabId+':'+key;
const readSoundPreference=key=>{try{const value=localStorage.getItem(tabSoundStorageKey(key));if(value!==null)return value;}catch(e){}try{const value=sessionStorage.getItem(key);if(value!==null){try{localStorage.setItem(tabSoundStorageKey(key),value);}catch(e){}return value;}}catch(e){}return null;};
const writeSoundPreference=(key,value)=>{try{localStorage.setItem(tabSoundStorageKey(key),value);}catch(e){}try{sessionStorage.setItem(key,value);}catch(e){}};
const cardSoundKey=id=>'laravel-system-monitor:sound:v1:'+id;
const cardSoundEnabled=card=>{return readSoundPreference(cardSoundKey(card.dataset.widget))!=='off';};
const unhealthyCards=()=>[...root.querySelectorAll('.sm-card')].filter(card=>card.querySelector('.sm-warn,.sm-bad,.warn,.bad'));
const audibleUnhealthyCards=()=>soundEnabled?unhealthyCards().filter(card=>cardSoundEnabled(card)):[];
const hasUnhealthyMetric=()=>audibleUnhealthyCards().length>0;
soundEnabled=readSoundPreference(soundKey)!=='off';
const setSoundButton=()=>{if(soundToggle){soundToggle.textContent=soundEnabled?'♫ Ses: Açık':'♫ Ses: Kapalı';soundToggle.setAttribute('aria-pressed',String(soundEnabled));}};
const setCardSoundButton=button=>{const enabled=cardSoundEnabled(button.closest('.sm-card'));button.textContent=enabled?'🔊':'🔇';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Bu kutunun uyarı sesini kapat':'Bu kutunun uyarı sesini aç');button.title=enabled?'Uyarı sesi açık':'Uyarı sesi kapalı';};
const playHealthAlert=()=>{if(!audioContext||audioContext.state!=='running'||!hasUnhealthyMetric())return;const startAt=audioContext.currentTime;[880,740,880,740,880].forEach((frequency,index)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),start=startAt+index*.24;oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.12,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.2);});};
const unlockAudio=async()=>{try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;audioContext??=new AudioContextClass();if(audioContext.state==='suspended')await audioContext.resume();if(hasUnhealthyMetric())playHealthAlert();}catch(error){console.warn('[System Monitor] Audio is unavailable:',error);}};
const syncAlertSound=()=>{const audibleCards=audibleUnhealthyCards();root.querySelectorAll('.sm-card[data-widget]').forEach(card=>card.classList.toggle('sm-alert-active',audibleCards.includes(card)));if(!hasUnhealthyMetric()){if(alertSoundTimer){window.clearInterval(alertSoundTimer);alertSoundTimer=null;}return;}if(!alertSoundTimer){playHealthAlert();alertSoundTimer=window.setInterval(()=>{if(!hasUnhealthyMetric()){syncAlertSound();return;}playHealthAlert();},12000);}};
root.querySelectorAll('.sm-card[data-widget]').forEach(card=>{const button=document.createElement('button');button.type='button';button.className='sm-card-sound-toggle';button.dataset.smCardSound=card.dataset.widget;button.addEventListener('pointerdown',event=>event.stopPropagation());button.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();const enabled=!cardSoundEnabled(card);writeSoundPreference(cardSoundKey(card.dataset.widget),enabled?'on':'off');setCardSoundButton(button);if(enabled)await unlockAudio();syncAlertSound();});card.appendChild(button);setCardSoundButton(button);});
soundToggle?.addEventListener('click',async()=>{soundEnabled=!soundEnabled;writeSoundPreference(soundKey,soundEnabled?'on':'off');setSoundButton();if(soundEnabled)await unlockAudio();syncAlertSound();});
setSoundButton();
document.addEventListener('pointerdown',unlockAudio,{once:true,passive:true});
document.addEventListener('keydown',unlockAudio,{once:true});
syncAlertSound();
if(soundEnabled&&hasUnhealthyMetric())unlockAudio();

// Native drag-and-drop for desktop.
let dragged=null;
cards.forEach(card=>{
 card.addEventListener('dragstart',e=>{dragged=card;card.classList.add('sm-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.widget);});
 card.addEventListener('dragend',()=>{card.classList.remove('sm-dragging');cards.forEach(x=>x.classList.remove('sm-over'));dragged=null;layout.order=currentOrder();save();});
 card.addEventListener('dragover',e=>{if(!dragged||dragged===card)return;e.preventDefault();card.classList.add('sm-over');});
 card.addEventListener('dragleave',()=>card.classList.remove('sm-over'));
 card.addEventListener('drop',e=>{e.preventDefault();if(!dragged||dragged===card)return;card.classList.remove('sm-over');const r=card.getBoundingClientRect(),after=(e.clientY-r.top)/r.height>.5;grid.insertBefore(dragged,after?card.nextSibling:card);layout.order=currentOrder();save();});
});

// Touch drag is started only from a dedicated handle, preserving normal page scrolling.
cards.forEach(card=>{
 const head=card.querySelector('.sm-card-head');if(!head)return;
 const handle=document.createElement('button');handle.type='button';handle.className='sm-drag-handle';handle.textContent='⠿';handle.title=labels.drag;handle.setAttribute('aria-label',labels.drag);head.appendChild(handle);
 let active=false;
 handle.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;active=true;dragged=card;handle.setPointerCapture(e.pointerId);card.classList.add('sm-dragging');e.preventDefault();});
 handle.addEventListener('pointermove',e=>{if(!active||!dragged)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sm-card[data-widget]');if(!target||target===dragged)return;const rect=target.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2;grid.insertBefore(dragged,after?target.nextSibling:target);cards.forEach(x=>x.classList.toggle('sm-over',x===target));});
 const finish=()=>{if(!active)return;active=false;dragged=null;cards.forEach(x=>x.classList.remove('sm-dragging','sm-over'));layout.order=currentOrder();save();};
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
});
apply();
})();
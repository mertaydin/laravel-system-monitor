(()=>{
'use strict';
const root=document.querySelector('[data-system-monitor]');
if(!root)return;
const grid=root.querySelector('.sm-grid'),panel=root.querySelector('.sm-settings');
const open=root.querySelector('[data-sm-open]'),close=root.querySelectorAll('[data-sm-close]');
const themeToggle=root.querySelector('[data-sm-theme-toggle]'),languageSelect=root.querySelector('[data-sm-language-select]');
const refreshButton=root.querySelector('[data-sm-refresh]'),countdown=root.querySelector('[data-sm-countdown]');
const intervalSelect=root.querySelector('[data-sm-refresh-interval]'),saveRefreshButton=root.querySelector('[data-sm-save-refresh]');
const layoutKey='laravel-system-monitor:layout:v1',themeKey='laravel-system-monitor:theme:v1',refreshKey='laravel-system-monitor:refresh-interval:v1';
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

// Refresh preferences are stored in the authenticated Laravel session.
let refreshInterval=Math.max(0,Number(root.dataset.refreshInterval??60)||0);
try{const storedInterval=localStorage.getItem(refreshKey);if(storedInterval!==null&&[0,15,30,60,300,600].includes(Number(storedInterval)))refreshInterval=Number(storedInterval);}catch(e){}
if(intervalSelect)intervalSelect.value=String(refreshInterval);
root.dataset.refreshInterval=String(refreshInterval);
let nextRefreshAt=refreshInterval?Date.now()+refreshInterval*1000:0;
const refresh=()=>{if(refreshButton){refreshButton.disabled=true;refreshButton.textContent='…';}const url=new URL(window.location.href);url.searchParams.set('refresh','1');url.searchParams.set('_sm_refresh',String(Date.now()));window.location.href=url.toString();};
refreshButton?.addEventListener('click',refresh);
saveRefreshButton?.addEventListener('click',async()=>{if(!intervalSelect||!saveRefreshButton)return;const selected=Math.max(0,Number(intervalSelect.value)||0);const token=root.querySelector('input[name="_token"]')?.value;saveRefreshButton.disabled=true;const originalLabel=saveRefreshButton.textContent;saveRefreshButton.textContent=saveRefreshButton.dataset.savingLabel||'Saving…';try{localStorage.setItem(refreshKey,String(selected));}catch(e){}refreshInterval=selected;root.dataset.refreshInterval=String(selected);nextRefreshAt=selected?Date.now()+selected*1000:0;updateCountdown();try{if(!token)throw new Error('Missing CSRF token');const response=await fetch(root.dataset.refreshSaveUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':token,'X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({interval:selected})});if(!response.ok)throw new Error('Unable to save refresh interval');const result=await response.json();refreshInterval=Math.max(0,Number(result.interval)||0);root.dataset.refreshInterval=String(refreshInterval);nextRefreshAt=refreshInterval?Date.now()+refreshInterval*1000:0;updateCountdown();saveRefreshButton.textContent=saveRefreshButton.dataset.savedLabel||'Saved';}catch(error){saveRefreshButton.textContent=saveRefreshButton.dataset.savedLabel||'Saved locally';}finally{saveRefreshButton.disabled=false;window.setTimeout(()=>{if(saveRefreshButton.textContent!==(saveRefreshButton.dataset.savedLabel||'Saved'))saveRefreshButton.textContent=originalLabel;},2500);}});
open?.addEventListener('click',()=>{if(intervalSelect)intervalSelect.value=String(refreshInterval);});
const updateCountdown=()=>{if(!countdown)return;if(!refreshInterval){countdown.textContent=labels.disabled;return;}const remaining=Math.max(0,Math.ceil((nextRefreshAt-Date.now())/1000));countdown.textContent=labels.next+': '+remaining+'s';if(remaining===0)refresh();};
updateCountdown();window.setInterval(updateCountdown,1000);

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
(()=> {
'use strict';
const root=document.querySelector('[data-system-monitor]');
if(!root)return;
const grid=root.querySelector('.sm-grid');
const panel=root.querySelector('.sm-settings');
const open=root.querySelector('[data-sm-open]');
const close=root.querySelectorAll('[data-sm-close]');
const themeToggle=root.querySelector('[data-sm-theme-toggle]');
const languageSelect=root.querySelector('[data-sm-language-select]');
const layoutKey='laravel-system-monitor:layout:v1';
const themeKey='laravel-system-monitor:theme:v1';
let layout={hidden:[],order:[]};
try{layout=Object.assign(layout,JSON.parse(localStorage.getItem(layoutKey)||'{}'));}catch(e){}
const cards=[...grid.querySelectorAll('[data-widget]')];
const byId=id=>cards.find(card=>card.dataset.widget===id);
const save=()=>{try{localStorage.setItem(layoutKey,JSON.stringify(layout));}catch(e){}};
const apply=()=>{
 cards.forEach(card=>card.hidden=layout.hidden.includes(card.dataset.widget));
 layout.order.forEach(id=>{const card=byId(id);if(card)grid.appendChild(card);});
};
const renderOptions=()=>{
 const list=panel.querySelector('[data-sm-options]');
 list.innerHTML='';
 cards.forEach(card=>{
  const label=document.createElement('label');label.className='sm-widget-option';
  const text=document.createElement('span');text.textContent=card.dataset.title;
  const input=document.createElement('input');input.type='checkbox';input.checked=!layout.hidden.includes(card.dataset.widget);
  input.addEventListener('change',()=>{
   layout.hidden=input.checked?layout.hidden.filter(x=>x!==card.dataset.widget):[...layout.hidden,card.dataset.widget];
   apply();save();
  });
  label.append(text,input);list.appendChild(label);
 });
};
const setTheme=theme=>{
 const selected=theme==='light'?'light':'dark';
 document.body.dataset.theme=selected;
 document.documentElement.style.colorScheme=selected;
 if(themeToggle){themeToggle.textContent=selected==='dark'?'☀':'☾';themeToggle.setAttribute('aria-label',selected==='dark'?'Switch to light mode':'Switch to dark mode');themeToggle.setAttribute('title',selected==='dark'?'Light mode':'Dark mode');}
};
let savedTheme='dark';
try{savedTheme=localStorage.getItem(themeKey)||'dark';}catch(e){}
setTheme(savedTheme);
languageSelect?.addEventListener('change',()=>languageSelect.form?.submit());
themeToggle?.addEventListener('click',()=>{
 const next=document.body.dataset.theme==='dark'?'light':'dark';
 setTheme(next);
 try{localStorage.setItem(themeKey,next);}catch(e){}
});
open?.addEventListener('click',()=>{renderOptions();panel.classList.add('open');panel.setAttribute('aria-hidden','false');});
close.forEach(el=>el.addEventListener('click',()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}));
panel?.addEventListener('click',e=>{if(e.target===panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');}});
root.querySelector('[data-sm-reset]')?.addEventListener('click',()=>{layout={hidden:[],order:[]};apply();save();renderOptions();});
let dragged=null;
cards.forEach(card=>{
 card.addEventListener('dragstart',e=>{dragged=card;card.classList.add('sm-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.widget);});
 card.addEventListener('dragend',()=>{card.classList.remove('sm-dragging');cards.forEach(x=>x.classList.remove('sm-over'));dragged=null;layout.order=[...grid.querySelectorAll('[data-widget]')].map(x=>x.dataset.widget);save();});
 card.addEventListener('dragover',e=>{if(!dragged||dragged===card)return;e.preventDefault();card.classList.add('sm-over');});
 card.addEventListener('dragleave',()=>card.classList.remove('sm-over'));
 card.addEventListener('drop',e=>{e.preventDefault();if(!dragged||dragged===card)return;card.classList.remove('sm-over');const r=card.getBoundingClientRect();const after=(e.clientY-r.top)/r.height>.5;grid.insertBefore(dragged,after?card.nextSibling:card);});
});
apply();
})();
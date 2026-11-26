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
const syncVisualAlertState=()=>{const unhealthy=new Set(unhealthyCards());root.querySelectorAll('.sm-card[data-widget]').forEach(card=>card.classList.toggle('sm-alert-active',unhealthy.has(card)));};
const syncAlertSound=()=>{syncVisualAlertState();if(!hasUnhealthyMetric()){if(alertSoundTimer){window.clearInterval(alertSoundTimer);alertSoundTimer=null;}return;}if(!alertSoundTimer){playHealthAlert();alertSoundTimer=window.setInterval(()=>{if(!hasUnhealthyMetric()){syncAlertSound();return;}playHealthAlert();},12000);}};
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
/* Portable system report: JSON, text, and printable chart report. */
(() => {
    'use strict';
    const root = document.querySelector('[data-system-monitor]');
    const header = root?.querySelector('.sm-actions');
    if (!root || !header || header.querySelector('[data-sm-report]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sm-button';
    button.dataset.smReport = 'true';
    button.textContent = 'Export report';
    button.setAttribute('aria-label', 'Export system report as JSON, text, or PDF');

    const collectReport = () => {
        const metrics = [...root.querySelectorAll('.sm-card[data-widget]')].map(card => ({
            section: card.dataset.title || card.dataset.widget,
            value: card.querySelector('.sm-value')?.textContent?.trim() || '',
            details: card.querySelector('.sm-meta')?.textContent?.trim() || '',
            status: card.querySelector('.sm-card-dot')?.className || ''
        }));
        const gauges = [...root.querySelectorAll('.sm-gauge')].map(gauge => {
            const display = gauge.querySelector('.sm-gauge-ring strong')?.textContent?.trim() || '';
            const match = display.match(/-?\d+(?:[.,]\d+)?/);
            return {
                label: gauge.querySelector('.sm-gauge-title')?.textContent?.trim() || '',
                value: match ? Number(match[0].replace(',', '.')) : null,
                display,
                details: gauge.querySelector('.sm-gauge-foot')?.textContent?.trim() || ''
            };
        });
        return {
            generated_at: new Date().toISOString(),
            page_title: document.title,
            last_checked: root.querySelector('[data-sm-last-checked]')?.textContent?.trim() || '',
            overall_health: root.querySelector('.sm-health')?.textContent?.trim() || '',
            gauges,
            metrics
        };
    };
    const download = (content, type, extension) => {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'system-monitor-report-' + new Date().toISOString().replace(/[:.]/g, '-') + '.' + extension;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };
    const addText = (parent, tag, value, className) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = value;
        parent.appendChild(node);
        return node;
    };
    const exportPdf = report => {
        const section = document.createElement('section');
        section.className = 'sm-print-report';
        section.dataset.smPrintReport = 'true';
        section.setAttribute('aria-label', 'System monitor PDF report');

        const masthead = document.createElement('div');
        masthead.className = 'sm-print-masthead';
        const brand = document.createElement('div');
        brand.className = 'sm-print-brand';
        addText(brand, 'span', 'SM', 'sm-print-brand-mark');
        const brandCopy = document.createElement('div');
        addText(brandCopy, 'strong', 'SYSTEM MONITOR', 'sm-print-brand-name');
        addText(brandCopy, 'span', 'INFRASTRUCTURE HEALTH REPORT', 'sm-print-brand-caption');
        brand.appendChild(brandCopy);
        addText(masthead, 'span', 'LIVE SNAPSHOT', 'sm-print-live');
        masthead.appendChild(brand);
        section.appendChild(masthead);

        const intro = document.createElement('div');
        intro.className = 'sm-print-intro';
        addText(intro, 'p', 'SYSTEM OVERVIEW', 'sm-print-eyebrow');
        addText(intro, 'h1', report.page_title || 'System Monitor', 'sm-print-title');
        addText(intro, 'p', 'A point-in-time view of your application and server environment.', 'sm-print-subtitle');
        const meta = document.createElement('div');
        meta.className = 'sm-print-meta-grid';
        const generated = new Date(report.generated_at);
        [['REPORT GENERATED', generated.toLocaleString()], ['LAST METRICS CHECK', report.last_checked || 'Not available']]
            .forEach(([label, value]) => {
                const item = document.createElement('div');
                addText(item, 'span', label, 'sm-print-meta-label');
                addText(item, 'strong', value, 'sm-print-meta-value');
                meta.appendChild(item);
            });
        intro.appendChild(meta);
        section.appendChild(intro);

        const health = document.createElement('div');
        health.className = 'sm-print-health-panel';
        const healthCopy = document.createElement('div');
        addText(healthCopy, 'span', 'OVERALL SYSTEM STATUS', 'sm-print-meta-label');
        addText(healthCopy, 'strong', report.overall_health || 'Status unavailable', 'sm-print-health-value');
        health.appendChild(healthCopy);
        const healthState = /attention|check|required|unhealthy|critical|warning|degraded/i.test(report.overall_health) ? 'warning' : 'ok';
        health.dataset.health = healthState;
        addText(health, 'span', healthState === 'warning' ? 'REVIEW REQUIRED' : 'OPERATIONAL', 'sm-print-health-tag');
        section.appendChild(health);

        const gauges = report.gauges.filter(item => item.value !== null && Number.isFinite(item.value));
        if (gauges.length) {
            const chartSection = document.createElement('section');
            chartSection.className = 'sm-print-section';
            addText(chartSection, 'p', '01 / CAPACITY', 'sm-print-section-kicker');
            addText(chartSection, 'h2', 'Resource utilization', 'sm-print-heading');
            addText(chartSection, 'p', 'Current usage levels across the primary server resources.', 'sm-print-section-desc');
            const chartGrid = document.createElement('div');
            chartGrid.className = 'sm-print-gauge-grid';
            gauges.forEach(item => {
                const card = document.createElement('div');
                card.className = 'sm-print-gauge-card';
                const top = document.createElement('div');
                top.className = 'sm-print-gauge-top';
                addText(top, 'span', item.label, 'sm-print-gauge-label');
                addText(top, 'strong', item.display, 'sm-print-gauge-value');
                card.appendChild(top);
                const track = document.createElement('div');
                track.className = 'sm-print-gauge-track';
                const fill = document.createElement('span');
                fill.className = 'sm-print-gauge-fill ' + (item.value >= 90 ? 'is-critical' : (item.value >= 75 ? 'is-warning' : 'is-healthy'));
                fill.style.width = Math.max(0, Math.min(100, item.value)) + '%';
                track.appendChild(fill);
                card.appendChild(track);
                if (item.details) addText(card, 'p', item.details, 'sm-print-gauge-detail');
                chartGrid.appendChild(card);
            });
            chartSection.appendChild(chartGrid);
            section.appendChild(chartSection);
        }

        const metricsSection = document.createElement('section');
        metricsSection.className = 'sm-print-section sm-print-metrics-section';
        addText(metricsSection, 'p', '02 / COMPONENTS', 'sm-print-section-kicker');
        addText(metricsSection, 'h2', 'Metric details', 'sm-print-heading');
        addText(metricsSection, 'p', 'Configuration and availability details captured at report time.', 'sm-print-section-desc');
        const table = document.createElement('table');
        table.className = 'sm-print-table';
        const thead = document.createElement('thead');
        const heading = document.createElement('tr');
        ['Component', 'Current value', 'Details', 'Status'].forEach(value => addText(heading, 'th', value));
        thead.appendChild(heading);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        report.metrics.forEach(metric => {
            const row = document.createElement('tr');
            const rawStatus = metric.status || '';
            const state = /bad|warn/i.test(rawStatus) ? (/warn/i.test(rawStatus) ? 'warning' : 'critical') : 'healthy';
            addText(row, 'td', metric.section, 'sm-print-component');
            addText(row, 'td', metric.value || '—', 'sm-print-current');
            addText(row, 'td', metric.details || '—', 'sm-print-details');
            const statusCell = document.createElement('td');
            const status = addText(statusCell, 'span', state === 'critical' ? 'Critical' : (state === 'warning' ? 'Warning' : 'Normal'), 'sm-print-status');
            status.dataset.state = state;
            row.appendChild(statusCell);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        metricsSection.appendChild(table);
        section.appendChild(metricsSection);

        const note = document.createElement('div');
        note.className = 'sm-print-note';
        addText(note, 'strong', 'About this report');
        addText(note, 'p', 'This document reflects the values displayed by Laravel System Monitor when the export was created. It is a point-in-time snapshot and does not represent historical telemetry.');
        section.appendChild(note);
        const footer = document.createElement('footer');
        addText(footer, 'span', 'LARAVEL SYSTEM MONITOR');
        addText(footer, 'span', 'CONFIDENTIAL · INTERNAL OPERATIONS');
        section.appendChild(footer);

        root.appendChild(section);
        const previousTitle = document.title;
        document.title = 'system-monitor-report-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            document.body.removeAttribute('data-sm-print-active');
            section.remove();
            document.title = previousTitle;
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup, { once: true });
        document.body.setAttribute('data-sm-print-active', 'true');
        window.print();
        window.setTimeout(cleanup, 60000);
    };
    button.addEventListener('click', () => {
        const choice = window.prompt('Export format: json, txt, or pdf', 'pdf');
        if (choice === null) return;
        const format = choice.trim().toLowerCase();
        const report = collectReport();
        if (format === 'json') download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', 'json');
        else if (format === 'txt') {
            const lines = ['SYSTEM MONITOR REPORT', 'Generated: ' + report.generated_at, 'Last checked: ' + report.last_checked, 'Overall health: ' + report.overall_health, '', ...report.metrics.flatMap(metric => [metric.section, metric.value, metric.details, ''])];
            download(lines.join('\n'), 'text/plain;charset=utf-8', 'txt');
        } else if (format === 'pdf') exportPdf(report);
        else window.alert('Choose json, txt, or pdf.');
    });
    header.appendChild(button);
})();

/* Full-screen dashboard mode for wall displays and incident response. */
(() => {
    'use strict';
    const root = document.querySelector('[data-system-monitor]');
    const header = root?.querySelector('.sm-actions');
    if (!root || !header || header.querySelector('[data-sm-fullscreen]')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sm-button';
    button.dataset.smFullscreen = 'true'; button.textContent = 'Full screen';
    button.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) await root.requestFullscreen();
            else await document.exitFullscreen();
        } catch (error) {
            button.textContent = 'Full screen unavailable';
            window.setTimeout(() => { button.textContent = 'Full screen'; }, 1800);
        }
    });
    document.addEventListener('fullscreenchange', () => {
        button.textContent = document.fullscreenElement === root ? 'Exit full screen' : 'Full screen';
    });
    header.appendChild(button);
})();


/* Animate resource gauges after the dashboard has rendered. */
(() => {
    'use strict';
    const gauges = [...document.querySelectorAll('[data-sm-gauge-target]')];
    if (!gauges.length) return;

    const animate = () => {
        gauges.forEach(gauge => {
            const target = Math.max(0, Math.min(289, Number(gauge.dataset.smGaugeTarget) || 0));
            gauge.style.strokeDasharray = String(target) + ' 289';
        });
    };

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        animate();
        return;
    }

    requestAnimationFrame(() => requestAnimationFrame(animate));
})();

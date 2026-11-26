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
        const isTr = (document.documentElement.lang || '').toLowerCase().startsWith('tr');
        const t = (en, tr) => isTr ? tr : en;
        const section = document.createElement('main');
        section.className = 'sm-print-report';
        section.dataset.smPrintReport = 'true';
        section.setAttribute('aria-label', t('Infrastructure report', 'Altyapı raporu'));

        const generated = new Date(report.generated_at);
        const dateText = generated.toLocaleString(document.documentElement.lang || undefined, { dateStyle: 'long', timeStyle: 'short' });
        const statusFor = metric => {
            const raw = metric.status || '';
            if (/sm-bad|bad|critical|error/i.test(raw)) return 'critical';
            if (/sm-warn|warn|warning/i.test(raw)) return 'warning';
            if (/sm-good|good|ok/i.test(raw)) return 'healthy';
            return 'unknown';
        };
        const statusLabel = state => state === 'critical' ? t('Critical', 'Kritik')
            : state === 'warning' ? t('Attention', 'Dikkat')
            : state === 'healthy' ? t('Normal', 'Normal') : t('Not reported', 'Belirtilmedi');
        const states = report.metrics.map(statusFor);
        const criticalCount = states.filter(state => state === 'critical').length;
        const warningCount = states.filter(state => state === 'warning').length;
        const healthyCount = states.filter(state => state === 'healthy').length;
        const overallState = criticalCount ? 'critical' : warningCount ? 'warning'
            : /attention|check|required|unhealthy|critical|warning|degraded|kontrol|dikkat|sorun/i.test(report.overall_health || '') ? 'warning' : 'healthy';

        const masthead = document.createElement('header');
        masthead.className = 'sm-print-masthead';
        const brand = document.createElement('div');
        brand.className = 'sm-print-brand';
        const mark = addText(brand, 'span', 'SM', 'sm-print-brand-mark');
        mark.setAttribute('aria-hidden', 'true');
        const brandCopy = document.createElement('div');
        addText(brandCopy, 'strong', 'SYSTEM MONITOR');
        addText(brandCopy, 'span', t('OPERATIONS INTELLIGENCE', 'SİSTEM OPERASYONLARI'));
        brand.appendChild(brandCopy);
        masthead.appendChild(brand);
        const reportMeta = document.createElement('div');
        reportMeta.className = 'sm-print-report-meta';
        addText(reportMeta, 'span', t('GENERATED ON', 'RAPOR TARİHİ'));
        addText(reportMeta, 'strong', dateText);
        if (report.last_checked) addText(reportMeta, 'small', t('Last checked: ', 'Son kontrol: ') + report.last_checked);
        masthead.appendChild(reportMeta);
        section.appendChild(masthead);

        const hero = document.createElement('section');
        hero.className = 'sm-print-hero';
        const heroCopy = document.createElement('div');
        addText(heroCopy, 'p', t('INFRASTRUCTURE / LIVE SNAPSHOT', 'ALTYAPI / ANLIK DURUM'), 'sm-print-kicker');
        addText(heroCopy, 'h1', t('System overview', 'Sistem genel görünümü'), 'sm-print-title');
        addText(heroCopy, 'p', t('A point-in-time view of platform resources and service readiness.', 'Platform kaynaklarının ve servislerin rapor anındaki durum özeti.'), 'sm-print-lede');
        hero.appendChild(heroCopy);
        const heroStatus = document.createElement('div');
        heroStatus.className = 'sm-print-hero-status';
        heroStatus.dataset.state = overallState;
        addText(heroStatus, 'span', t('OVERALL HEALTH', 'GENEL SAĞLIK'));
        addText(heroStatus, 'strong', report.overall_health || statusLabel(overallState));
        addText(heroStatus, 'small', overallState === 'critical' ? t('Critical issues detected', 'Kritik sorun tespit edildi')
            : overallState === 'warning' ? t('Review recommended', 'Kontrol önerilir')
            : t('No reported issues', 'Bildirilen sorun yok'));
        hero.appendChild(heroStatus);
        section.appendChild(hero);

        const summary = document.createElement('section');
        summary.className = 'sm-print-summary';
        [
            { value: String(report.metrics.length), label: t('COMPONENTS CHECKED', 'KONTROL EDİLEN BİLEŞEN') },
            { value: String(healthyCount), label: t('NORMAL', 'NORMAL'), state: 'healthy' },
            { value: String(warningCount), label: t('WARNINGS', 'UYARI'), state: 'warning' },
            { value: String(criticalCount), label: t('CRITICAL', 'KRİTİK'), state: 'critical' }
        ].forEach(item => {
            const tile = document.createElement('article');
            tile.className = 'sm-print-summary-tile' + (item.state ? ' is-' + item.state : '');
            addText(tile, 'strong', item.value);
            addText(tile, 'span', item.label);
            summary.appendChild(tile);
        });
        section.appendChild(summary);

        const gauges = report.gauges.filter(item => item.value !== null && Number.isFinite(item.value));
        if (gauges.length) {
            const capacity = document.createElement('section');
            capacity.className = 'sm-print-capacity';
            const heading = document.createElement('div');
            heading.className = 'sm-print-section-heading';
            addText(heading, 'span', '01 / CAPACITY', 'sm-print-section-index');
            addText(heading, 'h2', t('Resource profile', 'Kaynak profili'));
            addText(heading, 'p', t('Utilization captured at export time', 'Dışa aktarma anında ölçülen kullanım'));
            capacity.appendChild(heading);
            const grid = document.createElement('div');
            grid.className = 'sm-print-resource-grid';
            gauges.forEach(item => {
                const card = document.createElement('article');
                card.className = 'sm-print-resource';
                const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                ring.setAttribute('viewBox', '0 0 64 64');
                ring.setAttribute('class', 'sm-print-ring');
                ring.setAttribute('role', 'img');
                ring.setAttribute('aria-label', item.label + ': ' + item.display);
                const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                track.setAttribute('cx', '32'); track.setAttribute('cy', '32'); track.setAttribute('r', '25');
                track.setAttribute('class', 'sm-print-ring-track');
                const progress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                progress.setAttribute('cx', '32'); progress.setAttribute('cy', '32'); progress.setAttribute('r', '25');
                progress.setAttribute('class', 'sm-print-ring-value');
                progress.setAttribute('pathLength', '100');
                progress.setAttribute('stroke-dasharray', Math.max(0, Math.min(100, item.value)) + ' 100');
                progress.setAttribute('transform', 'rotate(-90 32 32)');
                ring.append(track, progress);
                const value = addText(card, 'strong', item.display, 'sm-print-resource-value');
                card.append(ring, value);
                addText(card, 'h3', item.label, 'sm-print-resource-label');
                if (item.details) addText(card, 'p', item.details, 'sm-print-resource-detail');
                grid.appendChild(card);
            });
            capacity.appendChild(grid);
            section.appendChild(capacity);
        }

        const services = document.createElement('section');
        services.className = 'sm-print-services';
        const serviceHeading = document.createElement('div');
        serviceHeading.className = 'sm-print-section-heading';
        addText(serviceHeading, 'span', '02 / SERVICE MAP', 'sm-print-section-index');
        addText(serviceHeading, 'h2', t('Service inventory', 'Servis envanteri'));
        addText(serviceHeading, 'p', t('Component-by-component status at the time of this report', 'Rapor anında bileşen bazında durum dökümü'));
        services.appendChild(serviceHeading);
        const serviceGrid = document.createElement('div');
        serviceGrid.className = 'sm-print-service-grid';
        report.metrics.forEach(metric => {
            const state = statusFor(metric);
            const card = document.createElement('article');
            card.className = 'sm-print-service-card';
            card.dataset.state = state;
            const top = document.createElement('div');
            top.className = 'sm-print-service-top';
            addText(top, 'h3', metric.section || t('Unnamed component', 'Adsız bileşen'));
            const badge = addText(top, 'span', statusLabel(state), 'sm-print-service-state');
            badge.dataset.state = state;
            card.appendChild(top);
            addText(card, 'strong', metric.value || '—', 'sm-print-service-value');
            if (metric.details) addText(card, 'p', metric.details, 'sm-print-service-detail');
            serviceGrid.appendChild(card);
        });
        services.appendChild(serviceGrid);
        section.appendChild(services);

        const note = document.createElement('aside');
        note.className = 'sm-print-note';
        addText(note, 'strong', t('READING THIS REPORT', 'RAPOR HAKKINDA'));
        addText(note, 'p', t('This document records the values visible in the dashboard at the moment it was generated. It is a snapshot, not historical monitoring data.', 'Bu belge, oluşturulduğu anda kontrol panelinde görünen değerleri kaydeder. Geçmişe dönük izleme verisi değil, anlık durum raporudur.'));
        section.appendChild(note);
        const footer = document.createElement('footer');
        addText(footer, 'span', 'LARAVEL SYSTEM MONITOR');
        addText(footer, 'span', t('CONFIDENTIAL · INTERNAL OPERATIONS', 'KURUM İÇİ · SİSTEM OPERASYONLARI'));
        section.appendChild(footer);

        root.appendChild(section);
        const previousTitle = document.title;
        document.title = 'system-monitor-overview-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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
    const openFormatPicker = () => {
        if (document.querySelector('[data-sm-export-dialog]')) return;
        const isTurkish = (document.documentElement.lang || '').toLowerCase().startsWith('tr');
        const text = (english, turkish) => isTurkish ? turkish : english;
        const overlay = document.createElement('div');
        overlay.className = 'sm-export-overlay';
        overlay.dataset.smExportDialog = 'true';
        const dialog = document.createElement('section');
        dialog.className = 'sm-export-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'sm-export-title');
        dialog.setAttribute('aria-describedby', 'sm-export-description');
        const head = document.createElement('div');
        head.className = 'sm-export-dialog-head';
        const heading = addText(head, 'h2', text('Export system report', 'Sistem raporunu dışa aktar'));
        heading.id = 'sm-export-title';
        const close = document.createElement('button');
        close.type = 'button'; close.className = 'sm-export-close';
        close.textContent = '×';
        close.setAttribute('aria-label', text('Close', 'Kapat'));
        head.appendChild(close); dialog.appendChild(head);
        const description = addText(dialog, 'p', text('Choose how you want to save the current dashboard snapshot.', 'Mevcut kontrol paneli verilerini hangi formatta kaydetmek istediğinizi seçin.'), 'sm-export-description');
        description.id = 'sm-export-description';
        const choices = document.createElement('div'); choices.className = 'sm-export-choices';
        const options = [
            {format:'pdf',icon:'▤',title:text('PDF report', 'PDF raporu'),detail:text('A formatted report with resource charts and system status.', 'Kaynak kullanım grafikleri ve sistem durumunu içeren düzenli rapor.')},
            {format:'json',icon:'{ }',title:text('Structured data', 'Yapılandırılmış veri'),detail:text('Current metrics in a machine-readable format.', 'Mevcut ölçümleri uygulamalarla işlenebilir veri biçiminde kaydeder.')},
            {format:'txt',icon:'≡',title:text('Plain text', 'Metin belgesi'),detail:text('A lightweight summary that is easy to read anywhere.', 'Her yerde kolayca açılabilen, okunabilir metin özeti.')}
        ];
        let dismissed = false;
        const finish = () => { if (dismissed) return; dismissed = true; overlay.remove(); document.removeEventListener('keydown', onKeydown); button.focus(); };
        const choose = format => {
            const report = collectReport(); finish();
            if (format === 'json') download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', 'json');
            else if (format === 'txt') {
                const lines = [text('SYSTEM MONITOR REPORT', 'SİSTEM İZLEME RAPORU'), text('Generated: ', 'Oluşturulma: ') + report.generated_at, text('Last checked: ', 'Son kontrol: ') + report.last_checked, text('Overall health: ', 'Genel durum: ') + report.overall_health, '', ...report.metrics.flatMap(metric => [metric.section, metric.value, metric.details, ''])];
                download(lines.join('\\n'), 'text/plain;charset=utf-8', 'txt');
            } else exportPdf(report);
        };
        options.forEach(option => {
            const item = document.createElement('button'); item.type = 'button';
            item.className = 'sm-export-option' + (option.format === 'pdf' ? ' is-featured' : '');
            item.dataset.exportFormat = option.format;
            const icon = addText(item, 'span', option.icon, 'sm-export-option-icon'); icon.setAttribute('aria-hidden','true');
            const copy = document.createElement('span'); copy.className = 'sm-export-option-copy';
            addText(copy, 'strong', option.title); addText(copy, 'span', option.detail); item.appendChild(copy);
            const arrow = addText(item, 'span', '›', 'sm-export-option-arrow'); arrow.setAttribute('aria-hidden','true');
            item.addEventListener('click', () => choose(option.format)); choices.appendChild(item);
        });
        dialog.appendChild(choices);
        addText(dialog, 'p', text('Includes the latest values currently shown on this dashboard.', 'Rapor, kontrol panelinde o anda görünen en güncel değerleri içerir.'), 'sm-export-footnote');
        overlay.appendChild(dialog); document.body.appendChild(overlay);
        const onKeydown = event => {
            if (event.key === 'Escape') finish();
            if (event.key === 'Tab') {
                const focusable = [...dialog.querySelectorAll('button:not(:disabled)')];
                if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
                else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
            }
        };
        document.addEventListener('keydown', onKeydown);
        close.addEventListener('click', finish);
        overlay.addEventListener('click', event => { if (event.target === overlay) finish(); });
        close.focus();
    };
    button.addEventListener('click', openFormatPicker);
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

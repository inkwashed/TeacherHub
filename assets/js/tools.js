/* Shared tool registry and My tools preferences. No writes occur during initialization. */
(() => {
    'use strict';
    if(window.TeacherToolsTools)return;
    const icons = Object.freeze({
    "coin-standard": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9 8v8m6-8v8M9 12h6\"/>",
    "cat-head": "<path d=\"M4 5 8 8q4-2 8 0l4-3v9a8 8 0 0 1-16 0V5Z\"/><g fill=\"currentColor\" stroke=\"none\"><circle cx=\"8.5\" cy=\"12.5\" r=\"1.2\"/><circle cx=\"15.5\" cy=\"12.5\" r=\"1.2\"/><ellipse cx=\"12\" cy=\"15.5\" rx=\"1.5\" ry=\"1\"/></g>",
    "dog-head": "<path d=\"M5 14H4c-2 0-2-2-2-3a10 10 0 0 1 10-9 10 10 0 0 1 10 9c0 1 0 3-2 3h-1M5 8v7a7 7 0 0 0 14 0V8\"/><g fill=\"currentColor\" stroke=\"none\"><circle cx=\"8.5\" cy=\"11.5\" r=\"1.2\"/><circle cx=\"15.5\" cy=\"11.5\" r=\"1.2\"/><ellipse cx=\"12\" cy=\"16\" rx=\"1.7\" ry=\"1.2\"/></g>",
    "die": "<path d=\"M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z\"/><g fill=\"currentColor\" stroke=\"none\"><circle cx=\"8\" cy=\"8\" r=\"1.3\"/><circle cx=\"12\" cy=\"12\" r=\"1.3\"/><circle cx=\"16\" cy=\"16\" r=\"1.3\"/></g>",
    "dice": "<path d=\"M14 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3M12 10h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z\"/><g fill=\"currentColor\" stroke=\"none\"><circle cx=\"6.5\" cy=\"6.5\" r=\"1.1\"/><circle cx=\"10.5\" cy=\"6.5\" r=\"1.1\"/><circle cx=\"6.5\" cy=\"10.5\" r=\"1.1\"/><circle cx=\"14\" cy=\"14\" r=\"1.2\"/><circle cx=\"18\" cy=\"18\" r=\"1.2\"/></g>",
    "rotate-right": "<path d=\"M20 10A8 8 0 1 0 19 17M20 4V10H14\"/>",
    "settings": "<path d=\"M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z\" />",
    "presentation": "<path d=\"M8.5 4.5h-4v4M15.5 4.5h4v4M19.5 15.5v4h-4M8.5 19.5h-4v-4\" />",
    "chevron": "<path d=\"m5 7.5 5 5 5-5\" />",
    "edit": "<path d=\"m4 16-1 5 5-1L21 7l-4-4L4 16Zm10-10 4 4M4 16l4 4\"/>",
    "confirm": "<path d=\"m5 12 4 4L19 6\"/>",
    "cancel": "<path d=\"m6 6 12 12M18 6 6 18\"/>",
    "download": "<path d=\"M12 3v10M8 9l4 4 4-4M5 16.5v3h14v-3\"/>"
});
    const catalog = [
    {
        "id": "calendar",
        "href": "calendar/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><path class=\"icon-cell\" d=\"M11.2 12h5.6v5.25h-5.6z\"/><path d=\"M5.5 7.5h17v15h-17zM9 4.5v6M19 4.5v6M5.5 12h17M11.2 12v10.5M16.8 12v10.5M5.5 17.25h17\"/></svg>",
        "short": "Calendar",
        "ja": "カレンダー",
        "title": "Class Calendar"
    },
    {
        "id": "tracker",
        "href": "tracker/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><rect x=\"5.5\" y=\"5.5\" width=\"17\" height=\"17\" rx=\"3\"/><path d=\"m9.5 14 3 3 6-7\"/></svg>",
        "short": "Tracker",
        "ja": "トラッカー",
        "title": "Class Tracker"
    },
    {
        "id": "tricks",
        "href": "tricks/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><path d=\"M8 9.5h12l2 13H6Z\"/><path d=\"M10.5 9.5V7a3.5 3.5 0 0 1 7 0v2.5\"/><path class=\"icon-star\" d=\"m14 13 .8 1.8 2 .2-1.5 1.4.4 2-1.7-1-1.7 1 .4-2-1.5-1.4 2-.2Z\"/></svg>",
        "short": "Bag of Tricks",
        "ja": "お楽しみツール",
        "title": "Bag of Tricks"
    },
    {
        "id": "timer",
        "href": "timer/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><circle cx=\"14\" cy=\"16\" r=\"7.5\"/><path d=\"M11.5 5h5v2h-5zM14 7v1.5M19.5 9l2-2M20.5 6l1.5 1.5M14 12v4l3 1.8\"/></svg>",
        "short": "Timer",
        "ja": "タイマー",
        "title": "Class Timer"
    },
    {
        "id": "spinner",
        "href": "spinner/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><path class=\"icon-fill\" d=\"M14 14V5a9 9 0 0 1 6.36 2.64ZM14 14h9a9 9 0 0 1-2.64 6.36ZM14 14v9a9 9 0 0 1-6.36-2.64ZM14 14H5a9 9 0 0 1 2.64-6.36Z\"/><circle cx=\"14\" cy=\"14\" r=\"9\"/><path d=\"M14 5v18M5 14h18M7.64 7.64l12.72 12.72M20.36 7.64 7.64 20.36\"/></svg>",
        "short": "Spinner",
        "ja": "スピナー",
        "title": "Spinner Wheel"
    },
    {
        "id": "scheduler",
        "href": "scheduler/index.html",
        "icon": "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><path d=\"M5.5 7.5h17v15h-17zM9 4.5v6M19 4.5v6M5.5 12h17\"/><path d=\"m10 17 2.2 2.2L18 14.7\"/></svg>",
        "short": "Scheduler",
        "ja": "スケジューラー",
        "title": "Google Class Scheduler"
    }
];
    const key = 'teacherTools.sitePreferences.v1';
    const legacyKey = 'teacherTools.home.appPanel.v1';
    const ids = catalog.map(tool => tool.id);
    const defaults = ids.filter(id => id !== 'scheduler');
    const known = id => ids.includes(id);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const strings = value => Array.isArray(value) && value.every(id => typeof id === 'string');
    const unique = values => [...new Set(values)];
    function preferences() {
        const raw = localStorage.getItem(key);
        if (raw === null) return {};
        const value = JSON.parse(raw);
        if (!object(value) || (value.version !== undefined && value.version !== 1)) throw Error('Unreadable preferences');
        return value;
    }
    function read() {
        let saved;
        try {
            saved = preferences().appPanel;
            if (!object(saved)) {
                try { saved = JSON.parse(localStorage.getItem(legacyKey)); } catch {}
            }
        } catch {}
        return {
            order: unique([...(strings(saved?.order) ? saved.order.filter(known) : []), ...ids]),
            visible: unique(strings(saved?.visible) ? saved.visible.filter(known) : defaults.slice())
        };
    }
    function save(next) {
        try {
            const previous = preferences();
            if(previous.appPanel!==undefined&&(!object(previous.appPanel)||!strings(previous.appPanel.order)||!strings(previous.appPanel.visible)))throw Error('Unreadable toolbar settings');
            const old = object(previous.appPanel) ? previous.appPanel : {};
            if (old.version !== undefined && old.version !== 1) throw Error('Unsupported toolbar settings');
            const order = unique([...next.order.filter(known), ...ids, ...(strings(old.order) ? old.order.filter(id => !known(id)) : [])]);
            const visible = unique([...next.visible.filter(known), ...(strings(old.visible) ? old.visible.filter(id => !known(id)) : [])]);
            localStorage.setItem(key, JSON.stringify({...previous,version:1,
                theme:previous.theme || document.documentElement.dataset.theme || 'modern-blue',
                appPanel:{...old,version:1,order,visible}}));
            window.dispatchEvent(new Event('teacher-tools:toolschange'));
            return true;
        } catch { return false; }
    }
    const root = new URL('../../', document.currentScript.src);
    const href = tool => new URL(tool.href, root).href;
    const name = tool => document.documentElement.lang === 'ja' ? tool.ja : tool.short;
    window.TeacherToolsTools = Object.freeze({catalog:Object.freeze(catalog.map(Object.freeze)), icons, read, save, name, href,
        defaults:() => ({order:ids.slice(),visible:defaults.slice()})});
    function initialize() {
        document.querySelectorAll('svg[data-shared-icon]').forEach(svg => {
            const artwork = icons[svg.dataset.sharedIcon];
            if (artwork) svg.innerHTML = artwork;
        });
        document.querySelectorAll('[data-tool-icon]').forEach(holder => {
            const tool = catalog.find(tool => tool.id === holder.dataset.toolIcon);
            if (tool) holder.innerHTML = tool.icon;
        });
        const ui = window.TeacherToolsUI;
        if (!ui) return;
        ui.registerTranslations({en:{
            'toolbar.edit':'Edit My tools', 'toolbar.done':'Save', 'toolbar.dragHelp':'Drag the handles to reorder. Use ↑ / ↓ on a handle with a keyboard.', 'toolbar.move':'Reorder {tool}', 'toolbar.preview':'Selected shortcuts', 'toolbar.none':'No shortcuts selected',
            'toolbar.settings':'My tools', 'toolbar.settingsHelp':'Choose and order your toolbar and Home shortcuts. All apps remain available on Home.',
            'toolbar.reset':'Defaults', 'toolbar.saved':'My tools saved.',
            'toolbar.failed':'Could not save My tools. Your existing settings were kept.',
            'toolbar.empty':'No shortcuts selected. Add tools in Profile → My tools.',
            'toolbar.earlier':'Move {tool} earlier', 'toolbar.later':'Move {tool} later'
        },ja:{
            'toolbar.edit':'マイツールを編集', 'toolbar.done':'保存', 'toolbar.dragHelp':'左のハンドルをドラッグして並べ替えます。キーボードではハンドル上で↑・↓キーを使えます。', 'toolbar.move':'{tool}の順番を変更', 'toolbar.preview':'選択したショートカット', 'toolbar.none':'ショートカットが選択されていません',
            'toolbar.settings':'マイツール', 'toolbar.settingsHelp':'ツールバーとホームのショートカットを選び、順番を変更できます。すべてのアプリはホームから開けます。',
            'toolbar.reset':'初期設定', 'toolbar.saved':'マイツールを保存しました。',
            'toolbar.failed':'マイツールを保存できませんでした。以前の設定は変更されていません。',
            'toolbar.empty':'ショートカットがありません。プロフィールの「マイツール」から追加できます。',
            'toolbar.earlier':'{tool}を前へ移動', 'toolbar.later':'{tool}を後ろへ移動'
        }});
        const list = document.getElementById('siteNavigationList');
        const status = document.getElementById('siteNavigationStatus');
        const grid = document.getElementById('appPanelGrid');
        let statusKey = '', draft = null;
        const editingState = () => draft ? {...draft, order: draft.order.slice(), visible: draft.visible.slice()} : read();
        function renderHome() {
            if (!grid) return;
            const state = read(); grid.replaceChildren();
            for (const id of state.order.filter(id => state.visible.includes(id))) {
                const tool = catalog.find(tool => tool.id === id);
                const link = document.createElement('a'); link.className = 'app-shortcut'; link.href = href(tool); link.dataset.toolId = id;
                link.innerHTML = `<span class="app-shortcut-icon" aria-hidden="true">${tool.icon}</span>`;
                link.setAttribute('aria-label', name(tool)); link.title = name(tool); grid.append(link);
            }
            if (!grid.children.length) {const empty=document.createElement('p');empty.className='dashboard-empty';empty.textContent=ui.translate('toolbar.empty');grid.append(empty);}
        }
        function renderEditor() {
            if (!list) return;
            const focused = document.activeElement?.closest('[data-nav-tool]');
            const focusId = focused?.dataset.navTool, action = document.activeElement?.dataset.navAction;
            const state = editingState(); list.replaceChildren();
            state.order.forEach((id,index) => {
                const tool = catalog.find(tool => tool.id === id);
                const row = document.createElement('div');row.className='site-navigation-row';row.dataset.navTool=id;
                const label=document.createElement('label');label.className='site-navigation-choice';
                const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=state.visible.includes(id);checkbox.dataset.navAction='show';
                checkbox.addEventListener('change',()=>commit({...state,visible:checkbox.checked?[...state.visible,id]:state.visible.filter(value=>value!==id)}));
                const text=document.createElement('span');text.textContent=name(tool);
                const icon=document.createElement('span');icon.className='site-navigation-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=tool.icon;
                label.append(icon,text,checkbox);
                const handle=document.createElement('button');handle.type='button';handle.className='site-navigation-handle';handle.dataset.navAction='move';
                handle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h1M15 5h1M8 12h1M15 12h1M8 19h1M15 19h1"/></svg>';
                handle.setAttribute('aria-label',ui.translate('toolbar.move').replace('{tool}',name(tool)));
                handle.addEventListener('keydown',event=>{
                    if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
                    event.preventDefault();event.stopPropagation();
                    const next=editingState(), from=next.order.indexOf(id), to=event.key==='Home'?0:event.key==='End'?next.order.length-1:Math.max(0,Math.min(next.order.length-1,from+(event.key==='ArrowUp'?-1:1)));
                    next.order.splice(from,1);next.order.splice(to,0,id);commit(next);
                });
                handle.addEventListener('pointerdown',event=>{
                    if(event.button!==0)return;
                    event.preventDefault();handle.focus();list.setPointerCapture(event.pointerId);
                    let moved=false;
                    row.classList.add('is-dragging');
                    const move=e=>{
                        if(e.pointerId!==event.pointerId)return;
                        const other=[...list.children].find(item=>item!==row&&e.clientY>=item.getBoundingClientRect().top&&e.clientY<=item.getBoundingClientRect().bottom);
                        if(other){const box=other.getBoundingClientRect();list.insertBefore(row,e.clientY<box.top+box.height/2?other:other.nextSibling);moved=true;}
                        const dialog=list.closest('.site-profile-scroll'),box=dialog.getBoundingClientRect();
                        if(e.clientY>box.bottom-60)dialog.scrollTop+=12;else if(e.clientY<box.top+60)dialog.scrollTop-=12;
                    };
                    const finish=e=>{
                        if(e.pointerId!==event.pointerId)return;
                        list.removeEventListener('pointermove',move);list.removeEventListener('pointerup',finish);list.removeEventListener('pointercancel',cancel);list.removeEventListener('lostpointercapture',cancel);
                        row.classList.remove('is-dragging');
                        if(e.type==='pointerup'&&moved){const next=editingState();next.order=[...list.children].map(row=>row.dataset.navTool);commit(next);}else renderEditor();
                        list.querySelector(`[data-nav-tool="${id}"] .site-navigation-handle`)?.focus();
                    };
                    const cancel=e=>finish(e);
                    list.addEventListener('pointermove',move);list.addEventListener('pointerup',finish);list.addEventListener('pointercancel',cancel);list.addEventListener('lostpointercapture',cancel);
                });
                row.append(handle,label);list.append(row);
            });
            if(focusId){const row=[...list.children].find(row=>row.dataset.navTool===focusId);const control=row?.querySelector(`[data-nav-action="${action}"]`);(control&&!control.disabled?control:row?.querySelector('input'))?.focus();}
            const preview=document.getElementById('siteNavigationPreview');preview.replaceChildren();
            preview.setAttribute('role','img');
            const selected=state.order.filter(id=>state.visible.includes(id)).map(id=>catalog.find(tool=>tool.id===id));
            preview.setAttribute('aria-label',selected.length?ui.translate('toolbar.preview')+': '+selected.map(name).join(', '):ui.translate('toolbar.none'));
            for(const tool of selected){const icon=document.createElement('span');icon.className='site-navigation-icon';icon.setAttribute('aria-hidden','true');icon.title=name(tool);icon.innerHTML=tool.icon;preview.append(icon);}
            status.textContent=statusKey?ui.translate(statusKey):'';status.classList.toggle('error',statusKey==='toolbar.failed');
        }
        function commit(next) {draft=next;statusKey='';renderEditor();}
        const editor=document.getElementById('siteNavigationEditor'),display=document.getElementById('siteNavigationDisplay'),edit=document.getElementById('siteNavigationEdit');
        function setEditing(active,focus=true){draft=active?read():null;statusKey='';renderEditor();editor.hidden=!active;display.hidden=active;edit.setAttribute('aria-expanded',String(active));if(focus)(active?list.querySelector('button'):edit)?.focus();}
        edit.addEventListener('click',()=>setEditing(true));
        document.getElementById('siteNavigationDone').addEventListener('click',()=>{if(save(editingState())){setEditing(false);}else{statusKey='toolbar.failed';renderEditor();}});
        document.getElementById('siteNavigationCancel').addEventListener('click',()=>setEditing(false));
        const dialog=document.getElementById('siteThemePanel');
        dialog.addEventListener('keydown',event=>{if(event.key==='Escape'&&!editor.hidden){event.preventDefault();event.stopImmediatePropagation();setEditing(false);}},true);
        dialog.addEventListener('close',()=>setEditing(false,false));
        document.getElementById('homeToolsSettings')?.addEventListener('click',event=>{event.stopPropagation();window.TeacherToolsProfile.openNavigation();});
        const render=()=>{renderHome();renderEditor();};
        window.addEventListener('teacher-tools:toolschange',render);
        window.addEventListener('teacher-tools:languagechange',render);
        window.addEventListener('storage',event=>{if(event.key===key||event.key===legacyKey||event.key===null)render();});
        render();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();

/* teacher-tools-release: teacher-tools-2026-11-13-standard-utility-icons-1 */

/* One inserted toolbar. Registry, identity, shortcuts and local paths are shared. */
(() => {
    'use strict';
    const mount=document.currentScript, tools=window.TeacherToolsTools;
    if(!mount||!tools||document.querySelector('[data-teacher-tools-header]'))return;
    const pageId=mount.dataset.page || 'home';
    const tool=tools.catalog.find(tool=>tool.id===pageId);
    const root=new URL('../../',mount.src);
    const home=new URL('index.html',root).href;
    const header=document.createElement('header');header.className='site-header';header.dataset.teacherToolsHeader='';header.dataset.page=pageId;
    header.innerHTML=`<div class="site-header-inner">
        <div class="site-identity">
            ${pageId!=='home'?`<a class="site-back" href="${home}" aria-label="Home" title="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12"/></svg></a>`:''}
            <a class="site-brand" href="${home}" aria-label="Home">
                <span class="site-brand-mark" aria-hidden="true">${tool?tool.icon:'<img alt="" width="42" height="42">'}</span>
                <span class="site-brand-copy">${tool?'<h1 id="siteAppName" class="site-brand-title"></h1>':'<span id="siteAppName" class="site-brand-title"></span>'}<span id="siteAppVersion" class="site-app-version" hidden></span>${pageId==='home'?'<span class="site-brand-domain">tools.letseigo.com</span>':''}</span>
            </a>
        </div>
        <nav id="sitePinnedTools" class="site-pinned-tools" aria-label="My tools"></nav>
        <div class="site-header-actions"><button type="button" id="siteLanguageButton" class="site-language-button" aria-label="Open language settings" aria-expanded="false" aria-controls="siteLanguagePanel" title="Language" data-i18n-aria-label="language.open" data-i18n-title="language.title">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M16 17H9L5 20V17Q2 17 2 14V5Q2 2 5 2H16Q19 2 19 5V11" />
                        <path d="M17 13H27Q30 13 30 16V25Q30 28 27 28H26L22 31V28H17Q14 28 14 25V16Q14 13 17 13Z" fill="var(--bg)" />
                        <path d="M6 7H15M10.5 5V7M8 7Q9 11 13 13M14 7Q12 12 6 14M18 24L22 16L26 24M20 21H24" />
                    </svg>
                </button>

                 <button type="button" id="siteSettingsButton" class="site-settings-button" aria-label="Open profile settings" aria-haspopup="dialog" aria-expanded="false" aria-controls="siteThemePanel" title="Profile" data-i18n-aria-label="profile.open" data-i18n-title="profile.title">
                    <span id="siteProfileHeaderAvatar" class="site-profile-header-avatar" aria-hidden="true"></span>
                </button>
                 <button type="button" id="siteMobileMenuButton" class="site-mobile-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="siteToolsMenu" data-i18n-aria-label="nav.open">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 7h14M5 12h14M5 17h14" />
                    </svg>
                </button>
</div>
        <nav id="siteToolsMenu" class="site-tools-menu" aria-label="My tools" hidden></nav>
<section id="siteLanguagePanel" class="site-language-panel" role="dialog" aria-labelledby="siteLanguageTitle" hidden>
                <div class="site-language-header">
                    <h2 id="siteLanguageTitle" class="site-language-title" data-i18n="language.title">Language</h2>
                    <button type="button" id="siteLanguageCloseButton" class="site-language-close" aria-label="Close language settings" data-i18n-aria-label="language.close">×</button>
                </div>
                <p class="site-language-help" data-i18n="language.help">Choose the language used for Teacher Tools interface text. Your own entries are never translated or changed.</p>
                <label class="site-language-label" for="siteLanguageChoice" data-i18n="language.label">Display language</label>
                <select id="siteLanguageChoice" class="site-language-select">
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                </select>
                <p class="site-language-note" data-i18n="language.progress">English and Japanese are available across all current Teacher Tools pages.</p>
            </section></div>`;
    mount.before(header);
    header.querySelector('.site-brand-mark img')?.setAttribute('src',new URL('assets/pwa/teacher-tools-icon.svg',root).href);
    function initialize() {
        const ui=window.TeacherToolsUI;
        ui.registerTranslations({en:{'toolbar.home':'Home','toolbar.all':'All tools on Home','toolbar.customize':'Customize My tools','toolbar.menu':'My tools','toolbar.offline':'Offline'},ja:{'toolbar.home':'ホーム','toolbar.all':'ホームですべてのツールを見る','toolbar.customize':'マイツールを設定','toolbar.menu':'マイツール','toolbar.offline':'オフライン'}});
        const originalHeader=document.querySelector('.app-shell .app-header');
        const version=document.querySelector('.app-shell[data-app-version]')?.dataset.appVersion || originalHeader?.querySelector('.version-badge')?.textContent?.trim();
        if(tool&&version){document.body.classList.add('has-toolbar-identity');const badge=header.querySelector('#siteAppVersion');badge.textContent=version;badge.hidden=false;}
        function render() {
            header.querySelector('#siteAppName').textContent=tool?tools.name(tool):pageId==='home'?'Teacher Tools':ui.translate('toolbar.offline');
            header.querySelector('.site-brand').setAttribute('aria-label',ui.translate('toolbar.home'));
            header.querySelector('#siteAppName').title=tool?tools.name(tool):pageId==='home'?'Teacher Tools':ui.translate('toolbar.offline');
            if(pageId==='home')header.querySelector('.site-brand').setAttribute('aria-current','page');
            const back=header.querySelector('.site-back');if(back){back.title=ui.translate('toolbar.home');back.setAttribute('aria-label',ui.translate('toolbar.home'));}
            const state=tools.read(), selected=state.order.filter(id=>state.visible.includes(id)).map(id=>tools.catalog.find(tool=>tool.id===id));
            const pinned=header.querySelector('#sitePinnedTools'),menu=header.querySelector('#siteToolsMenu');
            const focused=document.activeElement,focusId=focused?.closest('[data-tool-id]')?.dataset.toolId;
            const focusZone=pinned.contains(focused)?pinned:menu.contains(focused)?menu:null;
            pinned.replaceChildren();menu.replaceChildren();
            pinned.setAttribute('aria-label',ui.translate('toolbar.menu'));menu.setAttribute('aria-label',ui.translate('toolbar.menu'));
            function link(item,compact=false) {
                const a=document.createElement('a');a.href=tools.href(item);a.dataset.toolId=item.id;a.className=compact?'site-pinned-link':'site-menu-item site-custom-menu-item';a.title=tools.name(item);a.setAttribute('aria-label',tools.name(item));
                a.innerHTML=`<span class="site-menu-icon" aria-hidden="true">${item.icon}</span>`;
                if(item.id===pageId)a.setAttribute('aria-current','page');
                if(!compact){const label=document.createElement('span');label.textContent=tools.name(item);a.append(label);}
                return a;
            }
            selected.forEach(item=>{pinned.append(link(item,true));menu.append(link(item));});
            if(!selected.length){const text=document.createElement('p');text.className='site-menu-empty';text.textContent=ui.translate('toolbar.empty');menu.append(text);}
            const all=document.createElement('a');all.href=home;all.className='site-menu-all';all.textContent=ui.translate('toolbar.all');menu.append(all);
            const customize=document.createElement('button');customize.type='button';customize.className='site-menu-customize';customize.textContent=ui.translate('toolbar.customize');customize.addEventListener('click',event=>{event.stopPropagation();window.TeacherToolsProfile.openNavigation();});menu.append(customize);
            layout();
            if(focusZone){const target=[...focusZone.querySelectorAll('a[data-tool-id]')].find(a=>a.dataset.toolId===focusId)||focusZone.querySelector('a');(target?.getClientRects().length?target:header.classList.contains('is-compact')?header.querySelector('#siteMobileMenuButton'):header.querySelector('#siteSettingsButton')).focus();}
        }
        let pending;
        function schedule(){cancelAnimationFrame(pending);pending=requestAnimationFrame(layout);}
        function layout(){
            const inner=header.querySelector('.site-header-inner'),identity=header.querySelector('.site-identity'),actions=header.querySelector('.site-header-actions'), pinned=header.querySelector('#sitePinnedTools');
            const style=getComputedStyle(inner), toggle=header.querySelector('#siteMobileMenuButton');
            const room=inner.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-identity.getBoundingClientRect().width-actions.getBoundingClientRect().width-32+(header.classList.contains('is-compact')?toggle.getBoundingClientRect().width+4:0);
            const needed=pinned.children.length*44+Math.max(0,pinned.children.length-1)*4;
            const compact=matchMedia('(max-width: 800px)').matches||needed>room;
            const focus=document.activeElement,focusedPin=pinned.contains(focus),focusedMenu=header.querySelector('#siteToolsMenu').contains(focus);
            const focusId=focus?.closest('[data-tool-id]')?.dataset.toolId;
            if(header.classList.contains('is-compact')!==compact)header.classList.toggle('is-compact',compact);
            if(compact&&focusedPin)toggle.focus();
            if(!compact){header.querySelector('#siteToolsMenu').hidden=true;toggle.setAttribute('aria-expanded','false');if(focusedMenu)([...pinned.children].find(a=>a.dataset.toolId===focusId)||pinned.querySelector('a')||header.querySelector('#siteSettingsButton')).focus();}
        }
        window.addEventListener('teacher-tools:toolschange',render);
        window.addEventListener('teacher-tools:languagechange',render);
        window.addEventListener('storage',event=>{if(event.key==='teacherTools.sitePreferences.v1'||event.key==='teacherTools.home.appPanel.v1'||event.key===null)render();});
        window.addEventListener('resize',schedule);
        const observer=new ResizeObserver(schedule);observer.observe(header.querySelector('.site-header-inner'));observer.observe(header.querySelector('.site-identity'));observer.observe(header.querySelector('.site-header-actions'));
        render();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
/* teacher-tools-release: teacher-tools-2026-11-13-rounded-wheel-font-1 */

/* Shared Profile: markup, controls, local identity, and validated My Selfie import.
 * Load once, synchronously, at the header's data-teacher-tools-profile mount.
 * Construct local markup before the inline shared UI reads its controls; bind after
 * parsing, when the shared UI and bundled Selfie dependencies have initialized.
 */
(() => {
    'use strict';
    const mount = document.currentScript;
    if (!mount || document.getElementById('siteThemePanel')) return;
    const template = document.createElement('template');
    // Static project-owned markup only. Profile names and imported choices are
    // never interpolated into this template.
    template.innerHTML = `<dialog id="siteThemePanel" class="site-theme-panel" aria-labelledby="siteThemeTitle" hidden>
                <header class="site-theme-header">
                    <h2 id="siteThemeTitle" class="site-theme-title" data-i18n="profile.title">Profile</h2>
                    <button type="button" id="siteThemeCloseButton" class="site-theme-close" aria-label="Close profile settings" data-i18n-aria-label="profile.close">×</button>
                </header>
                <div class="site-profile-scroll themed-scroll">
                <div class="site-profile-identity">
                    <div class="site-profile-portrait">
                        <div id="siteProfileAvatar" class="site-profile-avatar" aria-hidden="true"></div>
                        <button type="button" id="siteProfileUseSelfie" class="site-profile-action"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M7 5h10v10H7z"/><circle cx="10" cy="8" r="1"/><path d="m7 14 3-3 2 2 2-3 3 4M10 18.5h4"/></svg><span id="siteProfileSelfieLabel" data-i18n="profile.useSelfie">Use Selfie</span></button>

                        <button type="button" id="siteProfileCancelSelfie" class="site-profile-action" data-i18n="profile.cancelSelfie" hidden>Cancel import</button>

                        <button type="button" id="siteProfileRemove" class="site-profile-action" data-i18n="profile.remove" hidden>Remove avatar</button>

                    </div>
                    <div class="site-profile-details">
                        <div class="site-profile-name-field">
                            <span id="siteProfileNameLabel" class="site-profile-name-label" data-i18n="profile.name">Name</span>
                            <div id="siteProfileNameDisplay">
                                <span id="siteProfileNameText"></span>
                                <button type="button" id="siteProfileNameEdit" class="site-profile-name-edit" aria-label="Edit name" data-i18n-aria-label="profile.editName" aria-controls="siteProfileNameForm" aria-expanded="false">
                                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-shared-icon="edit"></svg>
                                </button>
                            </div>
                            <form id="siteProfileNameForm" hidden>
                                <input id="siteProfileName" type="text" aria-labelledby="siteProfileNameLabel" autocomplete="given-name" maxlength="80">
                                <div class="site-profile-name-actions">
                                    <button type="submit" class="site-profile-action" ><svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="confirm"></svg><span data-i18n="profile.save">Save</span></button>
                                    <button type="button" id="siteProfileNameCancel" class="site-profile-action" ><svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="cancel"></svg><span data-i18n="profile.cancelName">Cancel</span></button>
                                </div>
                            </form>
                        </div>


                        <section class="site-profile-themes" aria-labelledby="siteProfileThemeTitle">
<h3 id="siteProfileThemeTitle" class="site-profile-theme-title" data-i18n="profile.colors">Color theme</h3>

                 <div class="site-theme-options" role="radiogroup" aria-label="Site color theme" data-i18n-aria-label="appearance.groupAria">
                    <label class="site-theme-option" data-theme-option="modern-blue" title="Modern Blue" data-i18n-title="theme.modernBlue">
                        <input type="radio" name="siteThemeChoice" value="modern-blue" aria-label="Modern Blue" data-i18n-aria-label="theme.modernBlue">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.modernBlue">Modern Blue</span>
                    </label>
                    <label class="site-theme-option" data-theme-option="ocean-blue" title="Ocean Blue" data-i18n-title="theme.oceanBlue">
                        <input type="radio" name="siteThemeChoice" value="ocean-blue" aria-label="Ocean Blue" data-i18n-aria-label="theme.oceanBlue">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.oceanBlue">Ocean Blue</span>
                    </label>
                    <label class="site-theme-option" data-theme-option="color-pop" title="Color Pop" data-i18n-title="theme.colorPop">
                        <input type="radio" name="siteThemeChoice" value="color-pop" aria-label="Color Pop" data-i18n-aria-label="theme.colorPop">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.colorPop">Color Pop</span>
                    </label>
                    <label class="site-theme-option" data-theme-option="pretty-in-pink" title="Pretty in Pink" data-i18n-title="theme.prettyInPink">
                        <input type="radio" name="siteThemeChoice" value="pretty-in-pink" aria-label="Pretty in Pink" data-i18n-aria-label="theme.prettyInPink">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.prettyInPink">Pretty in Pink</span>
                    </label>
                    <label class="site-theme-option" data-theme-option="true-dark" title="True Dark" data-i18n-title="theme.trueDark">
                        <input type="radio" name="siteThemeChoice" value="true-dark" aria-label="True Dark" data-i18n-aria-label="theme.trueDark">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.trueDark">True Dark</span>
                    </label>
                    <label class="site-theme-option" data-theme-option="custom" title="Custom" data-i18n-title="theme.custom">
                        <input type="radio" name="siteThemeChoice" value="custom" aria-label="Custom" data-i18n-aria-label="theme.custom">
                        <span class="site-theme-preview" aria-hidden="true"></span>
                        <span class="site-theme-name" data-i18n="theme.custom">Custom</span>
                    </label>
                </div>
                <div id="siteCustomThemeControls" class="site-custom-theme-controls" hidden>
                    <div class="site-custom-theme-pickers">
                        <label><span data-i18n="appearance.primary">Primary</span><input id="siteCustomPrimary" type="color" value="#2563eb"></label>
                        <label><span data-i18n="appearance.secondary">Secondary</span><input id="siteCustomSecondary" type="color" value="#7c3aed"></label>
                        <label><span data-i18n="appearance.background">Background</span><input id="siteCustomBackground" type="color" value="#f5f8ff"></label>
                    </div>
                    <button type="button" id="siteCustomThemeReset" class="site-custom-theme-reset" data-i18n="appearance.resetCustom">Reset custom colors</button>
                    <p class="site-custom-theme-note" data-i18n="appearance.customNote">Text, panels, and borders are adjusted automatically for readability.</p>
                </div>
                        </section>
                        <p id="siteProfileStatus" class="site-profile-status" role="status"></p>
                        <section id="siteNavigationSettings" class="site-navigation-settings" aria-labelledby="siteNavigationTitle">
                            <h3 id="siteNavigationTitle" class="site-navigation-title" data-i18n="toolbar.settings">My tools</h3>
                            <div id="siteNavigationDisplay" class="site-navigation-display">
                                <div id="siteNavigationPreview" class="site-navigation-preview"></div>
                                <button id="siteNavigationEdit" type="button" class="site-profile-name-edit" aria-label="Edit My tools" data-i18n-aria-label="toolbar.edit" aria-expanded="false" aria-controls="siteNavigationEditor"><svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="edit"></svg></button>
                            </div>
                            <div id="siteNavigationEditor" hidden>
                                <p class="site-navigation-help" data-i18n="toolbar.dragHelp">Drag the handles to reorder. Use ↑ / ↓ on a handle with a keyboard.</p>
                                <div id="siteNavigationList" class="site-navigation-list"></div>
                                <div class="site-profile-name-actions">
                                    <button type="button" id="siteNavigationDone" class="site-profile-action"><svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="confirm"></svg><span data-i18n="toolbar.done">Save</span></button>
                                    <button type="button" id="siteNavigationCancel" class="site-profile-action"><svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="cancel"></svg><span data-i18n="profile.cancelName">Cancel</span></button>
                                </div>
                            </div>
                            <p id="siteNavigationStatus" class="site-profile-status" role="status"></p>
                        </section>
                        <a id="siteInstallButton" class="site-profile-action site-profile-install" href="offline/index.html" data-i18n-aria-label="offline.open" aria-label="Install Teacher Tools or manage offline use">
                            <svg viewBox="0 0 24 24" aria-hidden="true" data-shared-icon="download"></svg>
                            <span data-i18n="offline.title">Install &amp; offline use</span>
                        </a>
                    </div>
                    <section id="siteProfileSync" class="site-profile-sync" aria-labelledby="siteProfileSyncTitle">
                        <h3 id="siteProfileSyncTitle" class="site-profile-sync-title" data-i18n="profile.sync">Sync</h3>
                <div class="site-data-tabs" role="tablist" aria-label="Backup and synchronization options" data-i18n-aria-label="backup.tabsAria">
                    <button type="button" id="siteDataExportTab" class="site-data-tab" role="tab" aria-selected="true" aria-controls="siteDataExportPanel" tabindex="0" data-site-data-tab="export" data-i18n="backup.tabExport">Export</button>
                    <button type="button" id="siteDataFileTab" class="site-data-tab" role="tab" aria-selected="false" aria-controls="siteDataFilePanel" tabindex="-1" data-site-data-tab="file" data-i18n="backup.tabFile">File sync</button>
                </div>
                <section id="siteDataExportPanel" class="site-data-tab-panel" role="tabpanel" aria-labelledby="siteDataExportTab" data-site-data-panel="export">
                    <p class="site-data-help" data-i18n="backup.help">Choose which saved data to include in one local backup file. Nothing is uploaded.</p>
                    <ul id="siteDataSummary" class="site-data-summary" aria-label="Saved Teacher Tools data" data-i18n-aria-label="backup.summaryAria"></ul>
                    <div class="site-data-actions">
                        <button type="button" id="siteDataExportButton" class="site-data-action site-data-action-primary" data-i18n="backup.exportAll">Export all data</button>
                        <button type="button" id="siteDataImportButton" class="site-data-action" data-i18n="backup.import">Import backup</button>
                    </div>
                    <input type="file" id="siteDataImportFile" hidden class="site-data-file" accept=".json,application/json">
                    <p class="site-data-note" data-i18n="backup.note">Importing replaces saved data for tools included in the file. Data for other tools remains unchanged. Older Scheduler and Spinner Wheel backup files are supported.</p>
                    <p id="siteDataStatus" class="site-data-status" role="status" aria-live="polite"></p>
                </section>
                <section id="siteDataFilePanel" class="site-data-tab-panel" role="tabpanel" aria-labelledby="siteDataFileTab" data-site-data-panel="file" hidden>
                    <div class="site-linked-data-heading">
                        <h4 id="siteLinkedDataTitle" data-i18n="linked.title">Linked data file</h4>
                        <span class="site-beta-badge" data-i18n="linked.beta">CHROME/EDGE BETA</span>
                    </div>
                    <p class="site-data-note" data-i18n="linked.help">Keep the browser's saved data connected to one JSON file. Available in desktop Chrome and Edge.</p>
                    <p id="siteLinkedDataFile" class="site-linked-data-file" data-i18n="linked.none">No file linked</p>
                    <p id="siteLinkedDataLastSaved" class="site-linked-data-last-saved" hidden></p>
                    <p id="siteLinkedDataPermissionHelp" class="site-linked-data-permission" data-i18n="linked.permissionHelp" hidden>Chrome may require one additional confirmation before automatic saving can begin.</p>
                    <div class="site-linked-data-actions">
                        <button type="button" id="siteLinkedDataCreate" class="site-data-action" data-i18n="linked.create">Create file</button>
                        <button type="button" id="siteLinkedDataLink" class="site-data-action" data-i18n="linked.link">Link existing</button>
                        <button type="button" id="siteLinkedDataLoad" class="site-data-action" data-i18n="linked.load" disabled>Pull synced data</button>
                        <button type="button" id="siteLinkedDataSave" class="site-data-action" data-i18n="linked.save" disabled>Save changes</button>
                        <button type="button" id="siteLinkedDataDisconnect" class="site-data-action site-linked-data-disconnect" data-i18n="linked.disconnect" disabled>Disconnect</button>
                    </div>
                    <p id="siteLinkedDataStatus" class="site-data-status" role="status" aria-live="polite"></p>
                </section>
                    </section>
                </div>

                </div>
            </dialog>`;
    template.content.querySelector('#siteInstallButton').href = new URL('../../offline/index.html', mount.src).href;
    mount.before(template.content);
    function initializeProfile() {
        const ui = window.TeacherToolsUI;
        const dialog = document.getElementById('siteThemePanel');
        if (!ui || !dialog) return;
        const key = 'teacherTools.sitePreferences.v1';
        const en = {
            'profile.title': 'Profile', 'profile.open': 'Open profile settings', 'profile.close': 'Close profile settings',
            'profile.sync': 'Sync', 'profile.name': 'Name', 'profile.save': 'Save', 'profile.remove': 'Remove avatar',
            'profile.colors': 'Color theme', 'profile.saved': 'Name saved.',
            'profile.removed': 'Profile avatar removed.', 'profile.failed': 'Could not save your profile on this device. Your previous profile has been kept.',
        };
        const ja = {
            'profile.title': 'プロフィール', 'profile.open': 'プロフィール設定を開く', 'profile.close': 'プロフィール設定を閉じる',
            'profile.sync': '同期', 'profile.name': '名前', 'profile.save': '保存', 'profile.remove': 'アバターを削除',
            'profile.colors': 'カラーテーマ', 'profile.saved': '名前を保存しました。',
            'profile.removed': 'プロフィール画像を削除しました。', 'profile.failed': 'この端末に保存できませんでした。以前のプロフィールは変更されていません。',
        };
        Object.assign(en, {
            'profile.useSelfie':'Use Selfie', 'profile.updateSelfie':'Update Selfie',
            'profile.cancelSelfie':'Cancel import',
            'profile.selfieWaiting':'Confirm your avatar in the My Selfie window.',
            'profile.selfieImported':'My Selfie copied to your profile.',
            'profile.selfieCancelled':'Import cancelled. Your profile image is unchanged.',
            'profile.selfieBlocked':'The My Selfie window was blocked. Allow popups for Teacher Tools, then try Use Selfie again.',
            'profile.selfieTimedOut':'The import timed out. Your profile image is unchanged. Try Use My Selfie again.',
            'profile.selfieInvalid':'That selfie is not supported. Your profile image is unchanged.',
            'profile.selfieUnsupported':'That version of My Selfie is not supported yet. Your profile image is unchanged.',
            'profile.selfieUnavailable':'My Selfie transfer is unavailable here. Open Teacher Tools at its website or http://localhost:8765.',
        });
        Object.assign(ja, {
            'profile.useSelfie':'セルフィーを使用', 'profile.updateSelfie':'セルフィーを更新',
            'profile.cancelSelfie':'読み込みをキャンセル',
            'profile.selfieWaiting':'My Selfieのウィンドウでアバターを確認してください。',
            'profile.selfieImported':'My Selfieをプロフィールにコピーしました。',
            'profile.selfieCancelled':'キャンセルしました。プロフィール画像は変更されていません。',
            'profile.selfieBlocked':'My Selfieのウィンドウがブロックされました。Teacher Toolsのポップアップを許可して、もう一度お試しください。',
            'profile.selfieTimedOut':'読み込みがタイムアウトしました。画像は変更されていません。もう一度お試しください。',
            'profile.selfieInvalid':'このセルフィーには対応していません。プロフィール画像は変更されていません。',
            'profile.selfieUnsupported':'このバージョンのMy Selfieにはまだ対応していません。画像は変更されていません。',
            'profile.selfieUnavailable':'ここではMy Selfieの転送を利用できません。Teacher Toolsのサイトかhttp://localhost:8765で開いてください。',
        });
        Object.assign(en, {
            'profile.editName':'Edit name', 'profile.cancelName':'Cancel', 'profile.addName':'Add your name',
        });
        Object.assign(ja, {
            'profile.editName':'名前を編集', 'profile.cancelName':'キャンセル', 'profile.addName':'名前を追加',
        });
        ui.registerTranslations({en, ja});
        const name = document.getElementById('siteProfileName');
        const nameDisplay = document.getElementById('siteProfileNameDisplay');
        const nameText = document.getElementById('siteProfileNameText');
        const nameEditor = document.getElementById('siteProfileNameForm');
        const editName = document.getElementById('siteProfileNameEdit');
        const remove = document.getElementById('siteProfileRemove');
        const status = document.getElementById('siteProfileStatus');
        const trigger = document.getElementById('siteSettingsButton');
        function setProfileOpen(open) {
            if (open) {
                if (!dialog.open) ui.closeSiteOverlays();
                ui.refreshSiteData();
            }
            dialog.hidden = !open;
            if (open && !dialog.open) dialog.showModal();
            if (!open && dialog.open) dialog.close();
            trigger.setAttribute('aria-expanded', String(open));
            if (open) document.getElementById('siteThemeCloseButton').focus();
        }
        trigger.addEventListener('click', event => {
            event.stopPropagation();
            setProfileOpen(!dialog.open);
        });
        document.getElementById('siteThemeCloseButton').addEventListener('click', () => setProfileOpen(false));
        const customColorsFromInputs = () => ({
            primary: document.getElementById('siteCustomPrimary').value,
            secondary: document.getElementById('siteCustomSecondary').value,
            background: document.getElementById('siteCustomBackground').value
        });
        dialog.querySelectorAll('input[name="siteThemeChoice"]').forEach(input => {
            input.addEventListener('change', () => {
                if (input.checked) ui.applyGlobalTheme(input.value, true, input.value === 'custom' ? customColorsFromInputs() : null);
            });
        });
        dialog.querySelectorAll('.site-custom-theme-pickers input').forEach(input => {
            input.addEventListener('input', () => ui.applyGlobalTheme('custom', true, customColorsFromInputs()));
        });
        document.getElementById('siteCustomThemeReset').addEventListener('click', ui.resetCustomTheme);
        let statusKey = '', statusError = false, editingName = false, successTimer;
        const schema = window.TeacherToolsSelfieSchema;
        const useSelfie = document.getElementById('siteProfileUseSelfie');
        const cancelSelfie = document.getElementById('siteProfileCancelSelfie');
        function preferences() {
            const raw = ui.storageGet(key);
            if (!raw) return {};
            const value = JSON.parse(raw);
            if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unreadable preferences');
            return value;
        }
        function read() {
            try {
                const value = preferences().profile;
                const clean = {...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}), name: typeof value?.name === 'string' ? value.name.slice(0, 80) : ''};
                delete clean.avatar;
                return clean;
            } catch { return {name: ''}; }
        }
        function message(text = '', error = false) {
            clearTimeout(successTimer);
            statusKey = text; statusError = error;
            if (text === 'profile.selfieImported') successTimer = setTimeout(() => message(), 6000);
            status.textContent = text ? ui.translate(text) : '';
            status.classList.toggle('error', error);
        }
        function localSelfie(avatar) {
            const clean = schema.normalize(avatar);
            if (!clean || typeof window.TeacherToolsRenderSelfie !== 'function') throw new Error('Unsupported renderer');
            // Markup is produced only by the bundled renderer from strict, normalized choices.
            const markup = window.TeacherToolsRenderSelfie(clean.choices);
            const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
            if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Renderer failed');
            parsed.documentElement.setAttribute('data-selfie', 'true');
            return parsed.documentElement;
        }
        function picture(slot, selfie) {
            if (schema.normalize(selfie)) {
                try { slot.replaceChildren(document.importNode(localSelfie(selfie), true)); return; } catch {}
            }
            slot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>';
        }
        function render() {
            const value = read();
            picture(document.getElementById('siteProfileHeaderAvatar'), value.selfie);
            picture(document.getElementById('siteProfileAvatar'), value.selfie);
            if (!editingName) name.value = value.name;
            nameText.textContent = value.name || ui.translate('profile.addName');
            nameText.classList.toggle('is-empty', !value.name);
            remove.hidden = !schema.normalize(value.selfie);
            const label = document.getElementById('siteProfileSelfieLabel');
            label.dataset.i18n = schema.normalize(value.selfie) ? 'profile.updateSelfie' : 'profile.useSelfie';
            label.textContent = ui.translate(label.dataset.i18n);
        }
        function save(value, success) {
            try {
                const previous = preferences();
                value = {...value}; delete value.avatar;
                const theme = document.querySelector('input[name="siteThemeChoice"]:checked')?.value || 'modern-blue';
                if (!ui.storageSet(key, JSON.stringify({...previous, version: 1, theme, profile: value}))) throw new Error('Storage full');
                render(); message(success); return true;
            } catch { message('profile.failed', true); return false; }
        }
        function finishNameEditing(focus = true) {
            editingName = false; nameEditor.hidden = true; nameDisplay.hidden = false;
            editName.setAttribute('aria-expanded', 'false');
            name.value = read().name; render();
            if (focus) editName.focus();
        }
        editName.addEventListener('click', () => {
            editingName = true; message(); name.value = read().name;
            nameDisplay.hidden = true; nameEditor.hidden = false;
            editName.setAttribute('aria-expanded', 'true'); name.focus(); name.select();
        });
        document.getElementById('siteProfileNameCancel').addEventListener('click', () => { message(); finishNameEditing(); });
        nameEditor.addEventListener('submit', event => {
            event.preventDefault();
            if (save({...read(), name: name.value.trim().slice(0, 80)}, 'profile.saved')) finishNameEditing();
        });
        const transfer = window.TeacherToolsSelfieTransfer.create({
            validate: schema.normalize,
            save: avatar => {
                // Verify rendering before any write. Merge with the latest profile and preferences.
                localSelfie(avatar);
                const before = ui.storageGet(key);
                if (!save({...read(), selfie:avatar}, 'profile.selfieImported')) return null;
                const committed = ui.storageGet(key);
                return {rollback() {
                    // Only roll back our own synchronous commit if acknowledgement throws.
                    if (ui.storageGet(key) !== committed) return;
                    if (before === null) { try { localStorage.removeItem(key); } catch {} }
                    else ui.storageSet(key, before);
                    render();
                }};
            },
            status: message,
            busy: value => {
                useSelfie.disabled = value;
                cancelSelfie.hidden = !value;
                remove.disabled = value;
            }
        });
        useSelfie.addEventListener('click', transfer.start);
        cancelSelfie.addEventListener('click', transfer.cancel);
        remove.addEventListener('click', () => {
            const value = read(); delete value.selfie;
            save(value, 'profile.removed');
        });
        dialog.addEventListener('keydown', event => {
            if (event.key === 'Escape' && editingName) {
                event.preventDefault(); event.stopPropagation(); message(); finishNameEditing(); return;
            }
            if (event.key !== 'Tab') return;
            const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
                .filter(e => !e.disabled && e.tabIndex >= 0 && e.getClientRects().length && !e.closest('[hidden]') && (e.type !== 'radio' || e.checked));
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        });
        dialog.addEventListener('cancel', event => {
            if (editingName) { event.preventDefault(); message(); finishNameEditing(); }
        });
        dialog.addEventListener('close', () => {
            // A queued close event may belong to the previous opening of this dialog.
            if (dialog.open) return;
            transfer.cancel();
            finishNameEditing(false);
            dialog.hidden = true; trigger.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('site-profile-open'); message(); trigger.focus();
        });
        dialog.addEventListener('click', event => {
            event.stopPropagation();
            if (event.target !== dialog) return;
            const box = dialog.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
        });
        new MutationObserver(() => {
            document.body.classList.toggle('site-profile-open', dialog.open);
            if (dialog.open) render();
        }).observe(dialog, {attributes: true, attributeFilter: ['open']});
        window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
        window.addEventListener('teacher-tools:languagechange', () => { render(); message(statusKey, statusError); });
        // Backup imports update preferences in the same tab without a storage event.
        window.addEventListener('focus', render);
        try {
            const previous = preferences();
            if (previous.profile && typeof previous.profile === 'object' && !Array.isArray(previous.profile) && Object.prototype.hasOwnProperty.call(previous.profile, 'avatar')) {
                const profile = {...previous.profile}; delete profile.avatar;
                if (!ui.storageSet(key, JSON.stringify({...previous, profile}))) message('profile.failed', true);
            }
        } catch { /* Never replace an unreadable preferences record. */ }
        render();
        // Entry point used by the offline page's data-protection shortcut.
        window.TeacherToolsProfile = Object.freeze({
            open: () => setProfileOpen(true),
            openNavigation: () => {
                setProfileOpen(true);
                const settings = document.getElementById('siteNavigationSettings');
                document.getElementById('siteNavigationEdit').click();
                settings.querySelector('.site-navigation-handle')?.focus();
                settings.scrollIntoView({block:'nearest'});
            },
            openSync: () => {
                setProfileOpen(true);
                document.getElementById('siteDataExportTab').click();
                document.getElementById('siteDataExportTab').focus();
                document.getElementById('siteProfileSync').scrollIntoView({block:'nearest'});
            }
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProfile, {once:true});
    } else {
        initializeProfile();
    }
})();

/* teacher-tools-release: teacher-tools-2026-11-13-calendar-round-add-1 */

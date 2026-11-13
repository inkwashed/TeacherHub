/* Shared school-data model; storage/recovery adapters remain tool-owned. */
(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.TeacherToolsSchoolSettingsModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
    "use strict";

    const clone = value => JSON.parse(JSON.stringify(value));
    const validId = value => typeof value === "string" && value.trim();
    const validName = value => typeof value === "string" && value.trim();

    const normalizePeriods = value => Array.isArray(value) ? value.map((period, index) => ({
        ...(period && typeof period === "object" ? period : {}),
        number: Number.isInteger(Number(period?.number)) ? Number(period.number) : index + 1,
        start: typeof period?.start === "string" ? period.start : "",
        duration: Number(period?.duration) > 0 ? Number(period.duration) : 45
    })) : [];

    const normalizeLunch = (value, fallback = {}) => ({
        ...(value && typeof value === "object" ? value : {}),
        enabled: !!value?.enabled,
        start: typeof value?.start === "string" ? value.start : (typeof fallback.start === "string" ? fallback.start : "12:00"),
        duration: Number(value?.duration) > 0 ? Number(value.duration) : (Number(fallback.duration) > 0 ? Number(fallback.duration) : 45)
    });

    const normalizeAlternate = (value, index, regularLunch = {}) => ({
        ...(value && typeof value === "object" ? value : {}),
        id: validId(value?.id) ? value.id.trim() : `alternate-${index + 1}`,
        name: validName(value?.name) ? value.name.trim() : `Alternate Schedule ${index + 1}`,
        periods: normalizePeriods(value?.periods),
        lunch: normalizeLunch(value?.lunch, regularLunch)
    });

    function migrateSchool(value) {
        const school = value && typeof value === "object" ? clone(value) : {};
        const regularLunch = school.lunch || {};
        let alternateSchedules;
        if (Array.isArray(school.alternateSchedules)) {
            alternateSchedules = school.alternateSchedules.map((item, index) => normalizeAlternate(item, index, regularLunch));
        } else if (school.irregular?.enabled) {
            alternateSchedules = [normalizeAlternate({
                id: "alternate-legacy",
                name: school.irregular.name,
                periods: school.irregular.periods,
                lunch: school.irregular.lunch
            }, 0, regularLunch)];
        } else {
            alternateSchedules = [];
        }

        const first = alternateSchedules[0];
        school.periods = normalizePeriods(school.periods);
        school.alternateSchedules = alternateSchedules;
        school.irregular = first ? {
            ...(school.irregular && typeof school.irregular === "object" ? school.irregular : {}),
            enabled: true,
            periods: clone(first.periods),
            lunch: clone(first.lunch)
        } : {
            ...(school.irregular && typeof school.irregular === "object" ? school.irregular : {}),
            enabled: false,
            periods: normalizePeriods(school.irregular?.periods),
            lunch: normalizeLunch(school.irregular?.lunch, regularLunch)
        };
        return school;
    }

    // Temporary bridge used while the visible editor still changes `irregular`.
    // It keeps the first alternate compatible without discarding additional entries.
    function reconcileLegacyEditor(value) {
        const school = value && typeof value === "object" ? clone(value) : {};
        const existing = Array.isArray(school.alternateSchedules) ? school.alternateSchedules : [];
        if (!school.irregular?.enabled) {
            school.alternateSchedules = [];
            return migrateSchool(school);
        }
        const first = normalizeAlternate({
            ...(existing[0] || {}),
            periods: school.irregular.periods,
            lunch: school.irregular.lunch
        }, 0, school.lunch || {});
        school.alternateSchedules = [first, ...existing.slice(1).map((item, index) => normalizeAlternate(item, index + 1, school.lunch || {}))];
        return migrateSchool(school);
    }

    function migrateRecord(value) {
        const record = value && typeof value === "object" ? clone(value) : {};
        record.version = Number(record.version) || 3;
        record.schools = Array.isArray(record.schools) ? record.schools.map(migrateSchool) : [];
        record.schedule = record.schedule && typeof record.schedule === "object" && !Array.isArray(record.schedule) ? record.schedule : {};
        record.preferences = record.preferences && typeof record.preferences === "object" && !Array.isArray(record.preferences) ? record.preferences : {};
        return record;
    }

    return Object.freeze({ normalizePeriods, normalizeAlternate, migrateSchool, reconcileLegacyEditor, migrateRecord });
});

/* Shared Schools / Schedule / Periods controller. */
(() => {
    "use strict";
    const translations = {
        en: {
            "schoolSettings.defaultAlternateName":"Alternate Schedule {number}",
            "schoolSettings.aria":"Shared school settings","schoolSettings.schools":"Schools","schoolSettings.schedule":"Schedule","schoolSettings.periods":"Periods","schoolSettings.schoolInfo":"School Information","schoolSettings.editSchool":"Edit School","schoolSettings.addSchool":"＋ Add School","schoolSettings.deleteSchool":"− Delete School","schoolSettings.schoolName":"School Name","schoolSettings.location":"Location (optional)","schoolSettings.classes":"Classes","schoolSettings.sort":"Sort A–Z","schoolSettings.classPlaceholder":"e.g. ４−１","schoolSettings.newClassAria":"New class name","schoolSettings.addClass":"＋ Add Class","schoolSettings.editSchedule":"Edit Schedule For","schoolSettings.workingHours":"Working Hours","schoolSettings.start":"Start","schoolSettings.end":"End","schoolSettings.color":"Color","schoolSettings.workingHelp":"Working hours and color are shared across Teacher Tools.","schoolSettings.teachingDates":"Teaching Dates","schoolSettings.addDate":"Add Date","schoolSettings.addDateButton":"＋ Add Date","schoolSettings.previousMonth":"Previous saved dates month","schoolSettings.nextMonth":"Next saved dates month","schoolSettings.savedDates":"Saved Dates","schoolSettings.periodsTitle":"Periods & Bell Times","schoolSettings.editPeriods":"Edit Periods For","schoolSettings.irregular":"Irregular Schedule","schoolSettings.irregularEnable":"Enable alternate period times","schoolSettings.lunch":"Lunch / 給食","schoolSettings.lunchEnable":"Enable lunch period","schoolSettings.lunchMode":"Lunch Mode","schoolSettings.lunchClass":"Use selected class","schoolSettings.lunchGeneral":"General lunch","schoolSettings.duration":"Duration","schoolSettings.irregularLunch":"Irregular Lunch","schoolSettings.irregularLunchEnable":"Use alternate lunch times","schoolSettings.generalLunchTitle":"General Lunch Title","schoolSettings.alternateSchedules":"Alternate Schedules","schoolSettings.addAlternate":"＋ Add Alternate Schedule","schoolSettings.noAlternates":"No alternate schedules added. The main periods above will be used.","schoolSettings.previousAlternate":"Previous alternate schedule","schoolSettings.nextAlternate":"Next alternate schedule","schoolSettings.scheduleName":"Schedule Name","schoolSettings.deleteAlternate":"− Delete","schoolSettings.alternateLunch":"Alternate Lunch","schoolSettings.alternateLunchEnable":"Use alternate lunch time for this schedule","schoolSettings.alternatePosition":"{current} of {total}","schoolSettings.alternateAdded":"Alternate schedule added.","schoolSettings.alternateDeleted":"Alternate schedule deleted.","schoolSettings.deleteAlternateConfirm":"Delete {name}?","schoolSettings.saved":"Changes save automatically to this browser.","schoolSettings.period":"Period","schoolSettings.name":"Name","schoolSettings.className":"Class name","schoolSettings.teacher":"Teacher","schoolSettings.students":"Students","schoolSettings.moveUp":"Move {name} up","schoolSettings.moveDown":"Move {name} down","schoolSettings.teacherFor":"Teacher for {name}","schoolSettings.studentsFor":"Students for {name}","schoolSettings.removeClass":"Remove {name}","schoolSettings.noClasses":"No classes added yet.","schoolSettings.monthCount":"{monthCount} this month • {totalCount} total saved","schoolSettings.removeDate":"Remove teaching date {date}","schoolSettings.noDates":"No saved dates in this month.","schoolSettings.classUpdated":"Class name updated.","schoolSettings.classRemoved":"Class removed.","schoolSettings.newSchool":"New School","schoolSettings.schoolAdded":"New school added.","schoolSettings.deleteConfirm":"Delete {name} and its saved teaching dates?","schoolSettings.schoolDeleted":"School deleted.","schoolSettings.classAdded":"Class added.","schoolSettings.classesSorted":"Classes sorted."
        },
        ja: {
            "schoolSettings.defaultAlternateName":"代替スケジュール {number}",
            "schoolSettings.aria":"共通の学校設定","schoolSettings.schools":"学校","schoolSettings.schedule":"スケジュール","schoolSettings.periods":"時限","schoolSettings.schoolInfo":"学校情報","schoolSettings.editSchool":"編集する学校","schoolSettings.addSchool":"＋ 学校を追加","schoolSettings.deleteSchool":"− 学校を削除","schoolSettings.schoolName":"学校名","schoolSettings.location":"場所（任意）","schoolSettings.classes":"クラス","schoolSettings.sort":"五十音・A–Z順","schoolSettings.classPlaceholder":"例：４−１","schoolSettings.newClassAria":"新しいクラス名","schoolSettings.addClass":"＋ クラスを追加","schoolSettings.editSchedule":"スケジュールを編集する学校","schoolSettings.workingHours":"勤務時間","schoolSettings.start":"開始","schoolSettings.end":"終了","schoolSettings.color":"色","schoolSettings.workingHelp":"勤務時間と色はTeacher Tools全体で共有されます。","schoolSettings.teachingDates":"授業日","schoolSettings.addDate":"日付を追加","schoolSettings.addDateButton":"＋ 日付を追加","schoolSettings.previousMonth":"保存済み日付の前月","schoolSettings.nextMonth":"保存済み日付の翌月","schoolSettings.savedDates":"保存済み日付","schoolSettings.periodsTitle":"時限とチャイム時間","schoolSettings.editPeriods":"時限を編集する学校","schoolSettings.irregular":"変則スケジュール","schoolSettings.irregularEnable":"別の時限時間を有効にする","schoolSettings.lunch":"給食 / Lunch","schoolSettings.lunchEnable":"給食時間を有効にする","schoolSettings.lunchMode":"給食モード","schoolSettings.lunchClass":"選択中のクラスを使う","schoolSettings.lunchGeneral":"共通の給食","schoolSettings.duration":"長さ（分）","schoolSettings.irregularLunch":"変則日の給食","schoolSettings.irregularLunchEnable":"別の給食時間を使う","schoolSettings.generalLunchTitle":"共通の給食タイトル","schoolSettings.alternateSchedules":"代替スケジュール","schoolSettings.addAlternate":"＋ 代替スケジュールを追加","schoolSettings.noAlternates":"代替スケジュールはありません。上の通常時限が使用されます。","schoolSettings.previousAlternate":"前の代替スケジュール","schoolSettings.nextAlternate":"次の代替スケジュール","schoolSettings.scheduleName":"スケジュール名","schoolSettings.deleteAlternate":"− 削除","schoolSettings.alternateLunch":"代替日の給食","schoolSettings.alternateLunchEnable":"このスケジュールで別の給食時間を使う","schoolSettings.alternatePosition":"{current} / {total}","schoolSettings.alternateAdded":"代替スケジュールを追加しました。","schoolSettings.alternateDeleted":"代替スケジュールを削除しました。","schoolSettings.deleteAlternateConfirm":"{name}を削除しますか？","schoolSettings.saved":"変更はこのブラウザに自動保存されます。","schoolSettings.period":"時限","schoolSettings.name":"名前","schoolSettings.className":"クラス名","schoolSettings.teacher":"先生","schoolSettings.students":"生徒数","schoolSettings.moveUp":"{name}を上へ移動","schoolSettings.moveDown":"{name}を下へ移動","schoolSettings.teacherFor":"{name}の先生","schoolSettings.studentsFor":"{name}の生徒数","schoolSettings.removeClass":"{name}を削除","schoolSettings.noClasses":"クラスはまだ追加されていません。","schoolSettings.monthCount":"今月{monthCount}件 • 保存済み合計{totalCount}件","schoolSettings.removeDate":"授業日{date}を削除","schoolSettings.noDates":"今月の保存済み日付はありません。","schoolSettings.classUpdated":"クラス名を更新しました。","schoolSettings.classRemoved":"クラスを削除しました。","schoolSettings.newSchool":"新しい学校","schoolSettings.schoolAdded":"新しい学校を追加しました。","schoolSettings.deleteConfirm":"{name}と保存済みの授業日を削除しますか？","schoolSettings.schoolDeleted":"学校を削除しました。","schoolSettings.classAdded":"クラスを追加しました。","schoolSettings.classesSorted":"クラスを並べ替えました。"
        }
    };
    window.TeacherToolsUI?.registerTranslations(translations);
    const t = (key, fallback, replacements = {}) => { const translated = window.TeacherToolsUI?.translate(key, fallback, replacements); if (translated != null) return translated; return Object.entries(replacements).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), fallback); };
    const locale = () => document.documentElement.lang === "ja" ? "ja-JP" : "en";
    const clone = value => JSON.parse(JSON.stringify(value));
    const validColor = value => /^#[0-9a-f]{6}$/i.test(value || "");
    const today = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
    const model = window.TeacherToolsSchoolSettingsModel;
    if (!model) throw new Error("Shared school settings model must load before its controller.");
    const normalizePeriods = model.normalizePeriods;
    const defaults = value => {
        const school = model.migrateSchool(value);
        return ({
        ...school,
        location: school.location || "",
        calendarColor: validColor(school.calendarColor) ? school.calendarColor : "#43877d",
        workingHours: { start: school.workingHours?.start || "", end: school.workingHours?.end || "" },
        classes: Array.isArray(school.classes) ? school.classes : [],
        teachersByClass: school.teachersByClass && typeof school.teachersByClass === "object" ? school.teachersByClass : {},
        studentCounts: school.studentCounts && typeof school.studentCounts === "object" ? school.studentCounts : {},
        periods: normalizePeriods(school.periods),
        irregular: { enabled: !!school.irregular?.enabled, periods: normalizePeriods(school.irregular?.periods), lunch: { enabled: !!school.irregular?.lunch?.enabled, start: school.irregular?.lunch?.start || school.lunch?.start || "12:00", duration: Number(school.irregular?.lunch?.duration || school.lunch?.duration || 45) } },
        lunch: { enabled: !!school.lunch?.enabled, mode: school.lunch?.mode === "class" ? "class" : "general", start: school.lunch?.start || "12:00", duration: Number(school.lunch?.duration || 45), generalTitle: school.lunch?.generalTitle || "Lunch" }
        });
    };

    function create({ root, adapter, appletId = "applet", initialTab = "schools", extraTabs = [] }) {
        if (!(root instanceof Element)) throw new TypeError("Shared school settings requires a root element.");
        if (!adapter || typeof adapter.read !== "function" || typeof adapter.write !== "function") throw new TypeError("Adapter requires read() and write(state).");
        root.style.setProperty("--shared-settings-tab-count", String(3 + extraTabs.length));
        const all = selector => [...root.querySelectorAll(selector)];
        const one = selector => root.querySelector(selector);
        let state, selectedSchoolId = "", month = today().slice(0, 7);
        const uiKey = `teacherTools.${appletId}.sharedSchoolSettings.ui.v1`;
        const readUi = () => { try { return JSON.parse(localStorage.getItem(uiKey)) || {}; } catch { return {}; } };
        const writeUi = value => { try { localStorage.setItem(uiKey, JSON.stringify(value)); } catch {} };
        const school = () => state.schools.find(item => item.id === selectedSchoolId) || state.schools[0];
        const commonTabs = () => all("[data-school-settings-tab]");
        const tabRecords = () => [...commonTabs().map(button => ({ name: button.dataset.schoolSettingsTab, button, panel: one(`[data-school-settings-panel="${button.dataset.schoolSettingsTab}"]`) })), ...extraTabs];
        const commit = (message, detail = {}, refresh = true) => { state = { ...state, schools: state.schools.map(model.migrateSchool) }; if (adapter.write(clone(state), detail) === false) { one("[data-settings-status]").textContent = adapter.writeError?.() || t("schoolSettings.saveFailed", "Could not save. Existing stored data was kept."); return; } one("[data-settings-status]").textContent = message || t("schoolSettings.saved", "Changes saved automatically to this browser."); if (refresh) render(); };
        const alternate = current => { const items = current.alternateSchedules || [], remembered = readUi().alternateBySchool?.[current.id]; return items.find(item => item.id === remembered) || items[0] || null; };
        const rememberAlternate = (current, id) => { const ui = readUi(); writeUi({ ...ui, alternateBySchool: { ...(ui.alternateBySchool || {}), [current.id]: id } }); };

        function showTab(name, focus = false) {
            const records = tabRecords(); if (!records.some(record => record.name === name)) name = "schools";
            records.forEach(record => { const active = record.name === name; record.button.classList.toggle("active", active); record.button.setAttribute("aria-selected", String(active)); record.button.tabIndex = active ? 0 : -1; record.panel.classList.toggle("active", active); record.panel.hidden = !active; if (active && focus) record.button.focus(); if (active) record.onShow?.(); });
            writeUi({ ...readUi(), tab: name, schoolId: selectedSchoolId });
        }
        function selectSchool(id) { if (state.schools.some(item => item.id === id)) selectedSchoolId = id; writeUi({ ...readUi(), schoolId: selectedSchoolId }); render(); }
        function renderPeriods(target, getPeriods) { const periods = getPeriods(); target.replaceChildren(); const table = document.createElement("table"); table.className = "period-table"; const head = document.createElement("thead"); const headerRow = document.createElement("tr"); [t("schoolSettings.period", "Period"), t("schoolSettings.start", "Start"), t("schoolSettings.duration", "Duration")].forEach(label => { const th = document.createElement("th"); th.textContent = label; headerRow.append(th); }); head.append(headerRow); const body = document.createElement("tbody"); periods.forEach(period => { const row = document.createElement("tr"); row.innerHTML = `<td>${period.number}</td><td><input type="time" value="${period.start || ""}"></td><td><input type="number" min="1" max="180" step="1" value="${period.duration || 45}"></td>`; const inputs = row.querySelectorAll("input"); // Native time controls fire change after each digit. Save without replacing the focused input.
                const saveField = (key, value) => { const latest = getPeriods().find(item => item.number === period.number); if (!latest || latest[key] === value) return; latest[key] = value; commit(undefined, {}, false); };
                inputs[0].onchange = () => { if (inputs[0].validity.badInput) return; saveField("start", inputs[0].value); };
                inputs[1].onchange = () => { if (inputs[1].value && inputs[1].validity.valid) saveField("duration", Number(inputs[1].value)); }; body.append(row); }); table.append(head, body); target.append(table); }
        function renderClasses(current) { const list = one("[data-class-list]"); list.replaceChildren(); current.classes.forEach((name, index) => { const row = document.createElement("div"); row.className = "class-edit-row"; const order = document.createElement("div"); order.className = "class-order-controls"; for (const [label, delta] of [["↑", -1], ["↓", 1]]) { const button = document.createElement("button"); button.type = "button"; button.className = "class-order-button"; button.textContent = label; button.disabled = index + delta < 0 || index + delta >= current.classes.length; const moveKey = delta < 0 ? "schoolSettings.moveUp" : "schoolSettings.moveDown"; button.setAttribute("aria-label", t(moveKey, translations.en[moveKey], { name })); button.onclick = () => { [current.classes[index], current.classes[index + delta]] = [current.classes[index + delta], current.classes[index]]; commit(); }; order.append(button); } const nameField = document.createElement("label"); nameField.className = "form-group class-name-field"; const nameLabel = document.createElement("span"); nameLabel.textContent = t("schoolSettings.name", "Name"); const nameInput = document.createElement("input"); nameInput.value = name; nameInput.setAttribute("aria-label", t("schoolSettings.className", "Class name")); nameInput.onchange = () => { const next = nameInput.value.trim(); if (!next || current.classes.some((item, other) => other !== index && item === next)) { render(); return; } current.classes[index] = next; if (Object.hasOwn(current.teachersByClass, name)) { current.teachersByClass[next] = current.teachersByClass[name]; delete current.teachersByClass[name]; } if (Object.hasOwn(current.studentCounts, name)) { current.studentCounts[next] = current.studentCounts[name]; delete current.studentCounts[name]; } commit(t("schoolSettings.classUpdated", "Class name updated."), { classRename: { schoolId: current.id, from: name, to: next } }); }; nameField.append(nameLabel, nameInput); const details = document.createElement("div"); details.className = "class-details"; for (const [key, type, value, save] of [["teacher", "text", current.teachersByClass[name] || "", value => current.teachersByClass[name] = value], ["students", "number", current.studentCounts[name] ?? "", value => { if (value === "") delete current.studentCounts[name]; else current.studentCounts[name] = Number(value); }]]) { const field = document.createElement("label"); field.className = "form-group"; const copy = document.createElement("span"); const labelKey = `schoolSettings.${key}`; copy.textContent = t(labelKey, translations.en[labelKey]); const input = document.createElement("input"); input.type = type; input.value = value; const ariaKey = key === "teacher" ? "schoolSettings.teacherFor" : "schoolSettings.studentsFor"; input.setAttribute("aria-label", t(ariaKey, translations.en[ariaKey], { name })); input.onchange = () => { save(input.value.trim()); commit(); }; field.append(copy, input); details.append(field); } const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-button"; remove.textContent = "×"; remove.setAttribute("aria-label", t("schoolSettings.removeClass", "Remove {name}", { name })); remove.onclick = () => { current.classes.splice(index, 1); delete current.teachersByClass[name]; delete current.studentCounts[name]; commit(t("schoolSettings.classRemoved", "Class removed."), { classRemoved: { schoolId: current.id, name } }); }; row.append(order, nameField, details, remove); list.append(row); }); if (!current.classes.length) list.textContent = t("schoolSettings.noClasses", "No classes added yet."); }
        function renderDates(current) { const dates = [...(state.schedule[current.id] || [])].sort(), shown = dates.filter(date => date.startsWith(month)), list = one("[data-teaching-date-list]"); one("[data-month-label]").textContent = new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01T12:00:00Z")); one("[data-teaching-date-count]").textContent = t("schoolSettings.monthCount", "{monthCount} this month • {totalCount} total saved", { monthCount: shown.length, totalCount: dates.length }); list.replaceChildren(); shown.forEach(date => { const row = document.createElement("div"); row.className = "schedule-date-row"; const label = document.createElement("span"); label.textContent = new Intl.DateTimeFormat(locale(), { weekday: "short", year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z")); const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-button"; remove.textContent = "×"; remove.setAttribute("aria-label", t("schoolSettings.removeDate", "Remove teaching date {date}", { date })); remove.onclick = () => { state.schedule[current.id] = dates.filter(item => item !== date); commit(); }; row.append(label, remove); list.append(row); }); if (!shown.length) list.textContent = t("schoolSettings.noDates", "No saved dates in this month."); }
        function render() {
            state = clone(adapter.read()); state.schools = state.schools.map(defaults); state.schedule ||= {};
            if (!state.schools.some(item => item.id === selectedSchoolId)) selectedSchoolId = state.schools[0]?.id || "";
            const current = school(); if (!current) return;
            all("[data-school-select]").forEach(select => { select.replaceChildren(...state.schools.map(item => new Option(item.name, item.id))); select.value = current.id; });
            all("[data-school-field]").forEach(input => input.value = current[input.dataset.schoolField] || "");
            renderClasses(current); one("[data-delete-school]").disabled = state.schools.length <= 1; one("[data-sort-classes]").disabled = current.classes.length < 2;
            one("[data-working-start]").value = current.workingHours.start; one("[data-working-end]").value = current.workingHours.end; one("[data-working-color]").value = current.calendarColor; one("[data-working-color]").style.setProperty("--working-color", current.calendarColor);
            if (!one("[data-teaching-date]").value) one("[data-teaching-date]").value = today(); renderDates(current);
            renderPeriods(one("[data-regular-periods]"), () => school().periods);
            one("[data-lunch-enabled]").checked = current.lunch.enabled; one("[data-lunch-panel]").hidden = !current.lunch.enabled; one("[data-lunch-mode]").value = current.lunch.mode; one("[data-lunch-start]").value = current.lunch.start; one("[data-lunch-duration]").value = current.lunch.duration; one("[data-general-lunch-title]").value = current.lunch.generalTitle; one("[data-general-lunch-title-field]").hidden = current.lunch.mode !== "general";
            const activeAlternate = alternate(current), alternateCount = current.alternateSchedules.length, alternateIndex = activeAlternate ? current.alternateSchedules.indexOf(activeAlternate) : -1;
            one("[data-alternate-empty]").hidden = !!activeAlternate; one("[data-alternate-editor]").hidden = !activeAlternate;
            if (activeAlternate) { one("[data-alternate-title]").textContent = activeAlternate.name; one("[data-alternate-count]").textContent = t("schoolSettings.alternatePosition", "{current} of {total}", { current: alternateIndex + 1, total: alternateCount }); one("[data-previous-alternate]").disabled = alternateCount < 2; one("[data-next-alternate]").disabled = alternateCount < 2; one("[data-alternate-name]").value = activeAlternate.name; renderPeriods(one("[data-alternate-periods]"), () => alternate(school()).periods); one("[data-alternate-lunch-enabled]").checked = activeAlternate.lunch.enabled; one("[data-alternate-lunch-panel]").hidden = !activeAlternate.lunch.enabled; one("[data-alternate-lunch-start]").value = activeAlternate.lunch.start; one("[data-alternate-lunch-duration]").value = activeAlternate.lunch.duration; }
        }
        tabRecords().forEach(record => record.button.onclick = () => showTab(record.name));
        one("[role=tablist]").onkeydown = event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; const records = tabRecords(), tabs = records.map(record => record.button), index = tabs.indexOf(document.activeElement); if (index < 0) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; showTab(records[next].name, true); };
        all("[data-school-select]").forEach(select => select.onchange = () => selectSchool(select.value));
        all("[data-school-field]").forEach(input => input.onchange = () => { school()[input.dataset.schoolField] = input.value.trim(); commit(); });
        one("[data-add-school]").onclick = () => { const created = defaults(adapter.createSchool?.() || { id: crypto.randomUUID?.() || `school-${Date.now()}`, name: t("schoolSettings.newSchool", "New School"), classes: [], periods: [], irregular: {} }); state.schools.push(created); state.schedule[created.id] = []; selectedSchoolId = created.id; commit(t("schoolSettings.schoolAdded", "New school added."), { schoolAdded: created.id }); };
        one("[data-delete-school]").onclick = () => { const current = school(); if (!current || state.schools.length <= 1 || !confirm(t("schoolSettings.deleteConfirm", "Delete {name} and its saved teaching dates?", { name: current.name }))) return; state.schools = state.schools.filter(item => item.id !== current.id); delete state.schedule[current.id]; selectedSchoolId = state.schools[0].id; commit(t("schoolSettings.schoolDeleted", "School deleted."), { schoolRemoved: current.id }); };
        one("[data-add-class]").onclick = () => { const input = one("[data-new-class]"), name = input.value.trim(), current = school(); if (!name || current.classes.includes(name)) return; current.classes.push(name); input.value = ""; commit(t("schoolSettings.classAdded", "Class added.")); };
        one("[data-sort-classes]").onclick = () => { school().classes.sort((a, b) => a.normalize("NFKC").localeCompare(b.normalize("NFKC"), locale(), { numeric: true, sensitivity: "base" })); commit(t("schoolSettings.classesSorted", "Classes sorted.")); };
        one("[data-working-start]").onchange = event => { school().workingHours.start = event.target.value; commit(); }; one("[data-working-end]").onchange = event => { school().workingHours.end = event.target.value; commit(); }; one("[data-working-color]").oninput = event => { if (validColor(event.target.value)) event.target.style.setProperty("--working-color", event.target.value); }; one("[data-working-color]").onchange = event => { if (validColor(event.target.value)) { school().calendarColor = event.target.value; commit(); } };
        one("[data-add-teaching-date]").onclick = () => { const date = one("[data-teaching-date]").value; if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return; state.schedule[school().id] = [...new Set([...(state.schedule[school().id] || []), date])].sort(); month = date.slice(0, 7); commit(); };
        for (const [selector, amount] of [["[data-previous-month]", -1], ["[data-next-month]", 1]]) one(selector).onclick = () => { const date = new Date(month + "-01T12:00:00Z"); date.setUTCMonth(date.getUTCMonth() + amount); month = date.toISOString().slice(0, 7); render(); };
        one("[data-lunch-enabled]").onchange = event => { school().lunch.enabled = event.target.checked; commit(); }; one("[data-lunch-mode]").onchange = event => { school().lunch.mode = event.target.value; commit(); }; one("[data-lunch-start]").onchange = event => { school().lunch.start = event.target.value; commit(); }; one("[data-lunch-duration]").onchange = event => { school().lunch.duration = Number(event.target.value); commit(); }; one("[data-general-lunch-title]").onchange = event => { school().lunch.generalTitle = event.target.value.trim() || "Lunch"; commit(); };
        one("[data-add-alternate]").onclick = () => { const current = school(), number = current.alternateSchedules.length + 1, created = model.normalizeAlternate({ id: crypto.randomUUID?.() || `alternate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: t("schoolSettings.defaultAlternateName", "Alternate Schedule {number}", { number }), periods: current.periods.map(period => ({ number: period.number, start: "", duration: period.duration })), lunch: { enabled: false, start: current.lunch.start || "12:00", duration: current.lunch.duration || 45 } }, current.alternateSchedules.length, current.lunch); current.alternateSchedules.push(created); rememberAlternate(current, created.id); commit(t("schoolSettings.alternateAdded", "Alternate schedule added.")); };
        for (const [selector, amount] of [["[data-previous-alternate]", -1], ["[data-next-alternate]", 1]]) one(selector).onclick = () => { const current = school(), items = current.alternateSchedules, active = alternate(current); if (items.length < 2 || !active) return; const index = (items.indexOf(active) + amount + items.length) % items.length; rememberAlternate(current, items[index].id); render(); };
        one("[data-alternate-name]").onchange = event => { const current = school(), active = alternate(current); if (!active) return; active.name = event.target.value.trim() || t("schoolSettings.defaultAlternateName", "Alternate Schedule {number}", { number: current.alternateSchedules.indexOf(active) + 1 }); commit(); };
        one("[data-delete-alternate]").onclick = () => { const current = school(), active = alternate(current); if (!active || !confirm(t("schoolSettings.deleteAlternateConfirm", "Delete {name}?", { name: active.name }))) return; const index = current.alternateSchedules.indexOf(active); current.alternateSchedules.splice(index, 1); const next = current.alternateSchedules[Math.min(index, current.alternateSchedules.length - 1)]; rememberAlternate(current, next?.id || ""); commit(t("schoolSettings.alternateDeleted", "Alternate schedule deleted.")); };
        one("[data-alternate-lunch-enabled]").onchange = event => { const active = alternate(school()); if (!active) return; active.lunch.enabled = event.target.checked; commit(); }; one("[data-alternate-lunch-start]").onchange = event => { const active = alternate(school()); if (!active) return; active.lunch.start = event.target.value; commit(); }; one("[data-alternate-lunch-duration]").onchange = event => { const active = alternate(school()); if (!active) return; active.lunch.duration = Number(event.target.value); commit(); };
        const remembered = readUi(); state = clone(adapter.read()); selectedSchoolId = remembered.schoolId || state.schools?.[0]?.id || ""; render(); showTab(remembered.tab || initialTab);
        window.addEventListener("teacher-tools:languagechange", render);
        return Object.freeze({ refresh: render, showTab, selectSchool, restoreTab: () => showTab(readUi().tab || initialTab) });
    }
    window.TeacherToolsSchoolSettings = Object.freeze({ create });
})();

/* teacher-tools-release: teacher-tools-2026-11-13-footer-layout-1 */

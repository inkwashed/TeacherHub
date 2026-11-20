/* Shared page runtime: translations, themes, dialogs, tooltips, backup and linked files. */
(() => {
    if (window.TeacherToolsUI) return;
// Shared structural contract for Calendar persistence and central backup imports.
window.TeacherToolsCalendarValidate = value => {
    const object = v => v && typeof v === "object" && !Array.isArray(v);
    const date = d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        !isNaN(Date.parse(d)) && new Date(d + "T12:00:00Z").toISOString().slice(0,10) === d;
    const time = t => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
    const scheduleMode = mode => ["regular","irregular"].includes(mode) || (typeof mode === "string" && /^alternate:[^:\s]+(?::[^:\s]+)?$/.test(mode));
    if (!object(value) || value.version !== 1 || typeof value.timeZone !== "string" ||
        !Array.isArray(value.events) || !object(value.preferences)) return false;
    try { new Intl.DateTimeFormat("en", { timeZone: value.timeZone }); } catch { return false; }
    const p = value.preferences;
    if (!["month","week","agenda","custom"].includes(p.view) ||
        !Array.isArray(p.days) || !p.days.length || p.days.length > 7 ||
        new Set(p.days).size !== p.days.length || p.days.some(d => !Number.isInteger(d) || d < 0 || d > 6) ||
        !(p.ghostMode === "off" || scheduleMode(p.ghostMode)) || typeof p.working !== "boolean" ||
        !["school","category"].every(k => typeof p[k] === "string")) return false;
    if (p.classSelection !== undefined && (!Array.isArray(p.classSelection) ||
        p.classSelection.some(k => { try { const pair = JSON.parse(k); return !Array.isArray(pair) || pair.length !== 2 || pair.some(v => typeof v !== "string"); } catch { return true; } }) || new Set(p.classSelection).size !== p.classSelection.length)) return false;
    if (p.categorySelection !== undefined && (!Array.isArray(p.categorySelection) || p.categorySelection.some(c => !["Class","Lunch","Meeting","Other","Holiday"].includes(c)) || new Set(p.categorySelection).size !== p.categorySelection.length)) return false;
    if (p.settingsSchool !== undefined && typeof p.settingsSchool !== "string") return false;
    if (p.settingsTab !== undefined && !["schools","schedule","periods","calendar"].includes(p.settingsTab)) return false;
    if (value.workingOverrides !== undefined) {
        if (!object(value.workingOverrides)) return false;
        for (const [day, blocks] of Object.entries(value.workingOverrides)) {
            if (!date(day) || !Array.isArray(blocks) || blocks.length > 24) return false;
            const blockIds = new Set();
            for (const b of blocks) {
                if (!object(b) || typeof b.id !== "string" || !b.id || /[\r\n]/.test(b.id) || blockIds.has(b.id) || typeof b.schoolId !== "string" || typeof b.location !== "string" || !b.location.trim() || !time(b.start) || !time(b.end) || b.end <= b.start || !/^#[0-9a-f]{6}$/i.test(b.color)) return false;
                blockIds.add(b.id);
            }
        }
    }
    const ids = new Set();
    return value.events.every(e => {
        if (!object(e) || !["id","title","schoolId","className","location","category","notes","created","modified"].every(k => typeof e[k] === "string") ||
            !e.id || /[\r\n]/.test(e.id) || ids.has(e.id) || !e.title.trim() || !date(e.date) ||
            !time(e.start) || !time(e.end) || (e.endDate !== undefined && !date(e.endDate)) || (e.endDate || e.date) < e.date || ((e.endDate || e.date) === e.date && e.end <= e.start) ||
            !(e.mode === "custom" || scheduleMode(e.mode)) ||
            (e.mode === "custom" ? e.period !== null : !Number.isInteger(e.period) || e.period < 0) ||
            !["Class","Lunch","Meeting","Other","Holiday"].includes(e.category) ||
            !Number.isFinite(Date.parse(e.created)) || !Number.isFinite(Date.parse(e.modified))) return false;
        if (e.allDay !== undefined && typeof e.allDay !== "boolean") return false;
        if (e.allDay && (e.mode !== "custom" || e.start !== "00:00" || e.end !== "23:59")) return false;
        ids.add(e.id); return true;
    });
};
(() => {
    "use strict";

    const SITE_PREFERENCES_KEY = "teacherTools.sitePreferences.v1";
    const SITE_LANGUAGE_KEY = "teacherTools.siteLanguage.v1";
    const ALLOWED_THEMES = ["modern-blue", "ocean-blue", "color-pop", "pretty-in-pink", "true-dark", "custom"];
    const ALLOWED_LANGUAGES = ["en", "ja"];
    const DEFAULT_CUSTOM_COLORS = Object.freeze({ primary: "#2563eb", secondary: "#7c3aed", background: "#f5f8ff" });
    const BROWSER_THEME_COLORS = Object.freeze({ "modern-blue": "#294f70", "ocean-blue": "#1e40af", "color-pop": "#8b5cf6", "pretty-in-pink": "#db2777", "true-dark": "#15191e" });
    const HEX_COLOR = /^#[0-9a-f]{6}$/i;
    let rememberedCustomColors = { ...DEFAULT_CUSTOM_COLORS };
    const SHARED_TRANSLATIONS = {
        en: {
            "nav.open": "Open navigation",
            "tool.scheduler": "Google Class Scheduler",
            "tool.schedulerDescription": "Create calendar events from bell times",
            "tool.calendar": "Class Calendar",
            "tool.calendarDescription": "Plan classes with school bell times",
            "tool.spinner": "Spinner Wheel",
            "tool.spinnerDescription": "Choose a random number or item",
            "tool.timer": "Class Timer",
            "tool.timerDescription": "Time classroom activities and games",
            "tool.tracker": "Class Tracker",
            "tool.trackerDescription": "Track lesson and textbook progress",
            "tool.tricks": "Bag of Tricks",
            "tool.tricksDescription": "Flip, roll, and draw for classroom games",
            "tool.slides": "Google Slides Automator",
            "tool.slidesDescription": "Build lesson slides from common fields",
            "offline.open": "Install Teacher Tools or manage offline use",
            "offline.title": "Install & Offline Use",
            "offlinePage.progressLabel": "Downloading Offline files...",
            "offlinePage.progressComplete": "Download complete.",
            "offlinePage.progressAria": "Offline preparation progress",
            "offlinePage.protocolWarning": "Installation and offline updates aren't available from directly opened files or unsecured HTTP addresses. Open the Teacher Tools website or use the local preview server instead.",
            "language.open": "Open language settings",
            "language.title": "Language",
            "language.close": "Close language settings",
            "language.help": "Choose the language used for Teacher Tools interface text. Your own entries are never translated or changed.",
            "language.label": "Display language",
            "language.progress": "English and Japanese are available across all current Teacher Tools pages.",
            "backup.help": "Choose which saved data to include in one local backup file. Nothing is uploaded.",
            "backup.tabsAria": "Backup and synchronization options",
            "backup.tabExport": "Export & Import",
            "backup.tabFile": "File Sync",
            "backup.summaryAria": "Saved Teacher Tools data",
            "backup.exportAll": "Export All Data",
            "backup.import": "Import Backup",
            "backup.note": "Importing replaces saved data for all tools included in the backup file.",
            "backup.saved": "Saved",
            "backup.invalid": "Needs attention",
            "backup.missing": "No saved data",
            "backup.exportCount": "Export ({count}) {items}",
            "backup.item": "item",
            "backup.items": "items",
            "backup.select": "Select data to export",
            "backup.selectError": "Select at least one saved item to export.",
            "backup.exported": "Backup exported with {count} saved {areas}.",
            "backup.area": "area",
            "backup.areas": "areas",
            "backup.readError": "The backup file could not be read.",
            "backup.siteUnsupported": "This is not a supported Teacher Tools site backup.",
            "backup.invalidRecord": "{label} data in this backup is not valid.",
            "backup.noSupportedData": "This backup does not contain any supported Teacher Tools data.",
            "backup.spinnerInvalid": "The Spinner Wheel data in this backup is not valid.",
            "backup.schedulerV1Invalid": "The Version 1 Scheduler data in this backup is not valid.",
            "backup.schedulerVersionInvalid": "The Version {version} Scheduler data in this backup is not valid.",
            "backup.unsupported": "This is not a supported Teacher Tools, Scheduler, or Spinner Wheel backup.",
            "backup.storageError": "Browser storage is unavailable or full.",
            "backup.tooLarge": "That file is too large to be a Teacher Tools backup.",
            "backup.confirm": "Import this {kind} backup? It will replace saved data for: {labels}. Other saved tool data will remain unchanged. This page will reload afterward.",
            "backup.kindOlder": "older single-tool",
            "backup.kindSite": "Teacher Tools",
            "backup.cancelled": "Import cancelled.",
            "backup.success": "Backup imported successfully. Reloading this page…",
            "backup.successAlert": "Teacher Tools backup imported successfully. This page will now reload.",
            "backup.importError": "The backup could not be imported.",
            "linked.title": "Linked data file",
            "linked.browser": "CHROME/EDGE",
            "linked.help": "Desktop Chrome/Edge can save changes to your linked JSON file about every 15 minutes while Teacher Tools is open and active with write access. Saves pause while hidden, closed or asleep and resume when you return. Use Save Changes to save sooner. File sync does not upload files or guarantee cloud delivery.",
            "linked.none": "No file linked",
            "linked.create": "Create File",
            "linked.link": "Link Existing",
            "linked.load": "Sync Data",
            "linked.save": "Save Changes",
            "linked.enable": "Allow file access",
            "linked.disconnect": "Disconnect",
            "linked.unsupported": "Linked files require desktop Chrome or Edge. In Safari and Firefox, use backup export and import instead.",
            "linked.lastSaved": "Last saved: {time}",
            "linked.linkCancelled": "Linking cancelled. Your previous connection was not changed.",
            "linked.ready": "Linked to {name}. Changed data saves about every 15 minutes while this page is active and write access is allowed.",
            "linked.permission": "Automatic saving is paused. Choose Allow file access to approve writing to {name}; access may need renewing after reopening the site.",
            "linked.permissionHelp": "A linked file is not necessarily writable. If access expires, click Allow file access to resume saving. Nothing saves while the site is closed.",
            "linked.created": "Created and linked {name}.",
            "linked.loaded": "Loaded {name}. Reloading this page…",
            "linked.saved": "Saved current Teacher Tools data to {name}.",
            "linked.automatic": "Automatically saved to {name}.",
            "linked.disconnected": "Linked file disconnected. The file itself was not deleted.",
            "linked.invalid": "The selected file is not a valid current Teacher Tools data file.",
            "linked.fileChanged": "Synced changes are waiting. Choose Sync Data to use them, or Save Changes to replace them.",
            "linked.pending": "Changes are waiting for the next automatic save to {name}. Keep Teacher Tools active with file access, or choose Save Changes now.",
            "linked.conflict": "Both this browser and the linked file changed. Choose Sync Data or Save Changes; nothing was overwritten.",
            "linked.loadConfirm": "Sync Data from {name}? This replaces the browser's supported Teacher Tools records with the file's records, then reloads the page.",
            "linked.autoPullConfirm": "New synced data was detected in {name}, possibly from another browser. Load it now? This browser's Teacher Tools data will be overwritten. Choose Cancel to review and use Sync Data or Save Changes manually.",
            "linked.saveConfirm": "The linked file changed elsewhere. Replace it with this browser's current data?",
            "linked.error": "The linked file could not be accessed.",
            "record.calendar": "Class Calendar",
            "record.appearance": "Site appearance",
            "record.language": "Site language",
            "record.scheduler": "Schools & schedules",
            "record.spinner": "Spinner Wheel",
            "record.timer": "Classroom Timer",
            "record.tracker": "Class Tracker",
            "appearance.open": "Open site appearance settings",
            "appearance.title": "Appearance",
            "appearance.close": "Close appearance settings",
            "appearance.help": "This theme is shared by Home and every Teacher Tools applet in this browser.",
            "appearance.groupAria": "Site color theme",
            "theme.modernBlue": "Modern Blue",
            "theme.oceanBlue": "Ocean Blue",
            "theme.colorPop": "Color Pop",
            "theme.prettyInPink": "Pretty in Pink",
            "theme.trueDark": "True Dark",
            "theme.custom": "Custom",
            "appearance.primary": "Primary",
            "appearance.secondary": "Secondary",
            "appearance.background": "Background",
            "appearance.resetCustom": "Reset custom colors",
            "appearance.customNote": "Text, panels, and borders are adjusted automatically for readability."
        },
        ja: {
            "nav.open": "ナビゲーションを開く",
            "tool.scheduler": "Googleクラススケジューラー",
            "tool.schedulerDescription": "時間割からカレンダー予定を作成",
            "tool.calendar": "クラスカレンダー",
            "tool.calendarDescription": "学校の時間割に合わせて授業を計画",
            "tool.spinner": "スピナーホイール",
            "tool.spinnerDescription": "数字・名前・選択肢からランダムに決定",
            "tool.timer": "教室タイマー",
            "tool.timerDescription": "授業活動やゲームの時間を計測",
            "tool.tracker": "クラストラッカー",
            "tool.trackerDescription": "授業や教科書の進捗を記録",
            "tool.tricks": "お楽しみツール",
            "tool.tricksDescription": "コイン・サイコロ・カードを授業で活用",
            "tool.slides": "Googleスライド自動作成",
            "tool.slidesDescription": "よく使う項目から授業スライドを作成",
            "offline.open": "Teacher Toolsのインストールとオフライン利用を開く",
            "offline.title": "インストールとオフライン利用",
            "offlinePage.progressLabel": "オフライン用ファイルをダウンロード中...",
            "offlinePage.progressComplete": "ダウンロードが完了しました。",
            "offlinePage.progressAria": "オフライン準備の進行状況",
            "offlinePage.protocolWarning": "直接開いたファイルや安全でないHTTPアドレスからは、インストールやオフライン用ファイルの更新ができません。Teacher Toolsのウェブサイト、またはローカルプレビューサーバーから開いてください。",
            "language.open": "言語設定を開く",
            "language.title": "言語",
            "language.close": "言語設定を閉じる",
            "language.help": "Teacher Toolsの画面に表示する言語を選択します。自分で入力した内容は翻訳も変更もされません。",
            "language.label": "表示言語",
            "language.progress": "現在のTeacher Tools全ページを英語と日本語で利用できます。",
            "backup.help": "保存済みデータを選び、1つのローカルバックアップファイルにまとめます。データはアップロードされません。",
            "backup.tabsAria": "バックアップと同期のオプション",
            "backup.tabExport": "バックアップの書き出し・読み込み",
            "backup.tabFile": "ファイル同期",
            "backup.summaryAria": "保存済みのTeacher Toolsデータ",
            "backup.exportAll": "すべてのデータを書き出す",
            "backup.import": "バックアップを読み込む",
            "backup.note": "読み込むと、バックアップファイルに含まれるすべてのツールの保存データが置き換わります。",
            "backup.saved": "保存済み",
            "backup.invalid": "確認が必要",
            "backup.missing": "保存データなし",
            "backup.exportCount": "{count}件を書き出す",
            "backup.item": "件",
            "backup.items": "件",
            "backup.select": "書き出すデータを選択",
            "backup.selectError": "書き出す保存済みデータを1件以上選択してください。",
            "backup.exported": "保存済みデータ{count}件をバックアップに書き出しました。",
            "backup.area": "件",
            "backup.areas": "件",
            "backup.readError": "バックアップファイルを読み込めませんでした。",
            "backup.siteUnsupported": "対応しているTeacher Toolsのサイトバックアップではありません。",
            "backup.invalidRecord": "バックアップ内の「{label}」データが正しくありません。",
            "backup.noSupportedData": "対応しているTeacher Toolsのデータがバックアップに含まれていません。",
            "backup.spinnerInvalid": "バックアップ内のスピナーホイールデータが正しくありません。",
            "backup.schedulerV1Invalid": "バックアップ内のバージョン1のスケジューラーデータが正しくありません。",
            "backup.schedulerVersionInvalid": "バックアップ内のバージョン{version}のスケジューラーデータが正しくありません。",
            "backup.unsupported": "対応しているTeacher Tools、スケジューラー、またはスピナーホイールのバックアップではありません。",
            "backup.storageError": "ブラウザの保存領域を利用できないか、空き容量がありません。",
            "backup.tooLarge": "Teacher Toolsのバックアップとしてはファイルサイズが大きすぎます。",
            "backup.confirm": "この{kind}バックアップを読み込みますか？ 次の保存データが置き換わります：{labels}。その他のツールのデータは変わりません。完了後、このページを再読み込みします。",
            "backup.kindOlder": "旧形式の単一ツール",
            "backup.kindSite": "Teacher Tools",
            "backup.cancelled": "読み込みをキャンセルしました。",
            "backup.success": "バックアップを読み込みました。ページを再読み込みしています…",
            "backup.successAlert": "Teacher Toolsのバックアップを読み込みました。このページを再読み込みします。",
            "backup.importError": "バックアップを読み込めませんでした。",
            "linked.title": "リンク済みデータファイル",
            "linked.browser": "CHROME/EDGE",
            "linked.help": "デスクトップ版Chrome・Edgeでは、書き込み権限がありTeacher Toolsを開いて操作できる間、変更を約15分ごとにリンク済みJSONファイルへ保存します。非表示・終了・スリープ中は停止し、戻ると再開します。すぐに保存するには「変更を保存」を使ってください。ファイルのアップロードやクラウドへの反映を保証する機能ではありません。",
            "linked.none": "ファイル未接続",
            "linked.create": "ファイルを作成",
            "linked.link": "既存ファイルを接続",
            "linked.load": "同期データを取り込む",
            "linked.save": "変更を保存",
            "linked.enable": "ファイルへのアクセスを許可",
            "linked.disconnect": "接続を解除",
            "linked.unsupported": "リンク済みファイルにはデスクトップ版ChromeまたはEdgeが必要です。SafariとFirefoxではバックアップの書き出し・読み込みを利用してください。",
            "linked.lastSaved": "最終保存：{time}",
            "linked.linkCancelled": "接続をキャンセルしました。以前の接続は変更されていません。",
            "linked.ready": "{name}に接続しています。このページがアクティブで書き込みが許可されている間、変更を約15分ごとに保存します。",
            "linked.permission": "自動保存は停止中です。「ファイルへのアクセスを許可」で{name}への書き込みを許可してください。サイトを開き直した後などに再度許可が必要になることがあります。",
            "linked.permissionHelp": "ファイルを接続しても、書き込み権限が継続するとは限りません。権限が切れたら「ファイルへのアクセスを許可」で保存を再開してください。サイトを閉じている間は保存されません。",
            "linked.created": "{name}を作成して接続しました。",
            "linked.loaded": "{name}を読み込みました。ページを再読み込みしています…",
            "linked.saved": "現在のTeacher Toolsデータを{name}に保存しました。",
            "linked.automatic": "{name}に自動保存しました。",
            "linked.disconnected": "ファイルとの接続を解除しました。ファイル自体は削除されていません。",
            "linked.invalid": "選択したファイルは、現在のTeacher Toolsデータファイルとして有効ではありません。",
            "linked.fileChanged": "同期された変更があります。「同期データを取り込む」で反映するか、「変更を保存」で置き換えてください。",
            "linked.pending": "{name}への次回の自動保存を待っています。ファイルへのアクセスを許可してTeacher Toolsをアクティブにするか、「変更を保存」を押してください。",
            "linked.conflict": "このブラウザとリンク済みファイルの両方が変更されています。「同期データを取り込む」または「変更を保存」を選んでください。データは上書きされていません。",
            "linked.loadConfirm": "{name}から同期データを取り込みますか？ ファイル内の対応データでブラウザの保存データを置き換え、ページを再読み込みします。",
            "linked.autoPullConfirm": "{name}に新しい同期データが見つかりました。別のブラウザからの変更かもしれません。今すぐ取り込みますか？ このブラウザのTeacher Toolsデータは上書きされます。キャンセルすると、「同期データを取り込む」または「変更を保存」で手動確認できます。",
            "linked.saveConfirm": "リンク済みファイルが別の場所で変更されています。このブラウザの現在のデータで置き換えますか？",
            "linked.error": "リンク済みファイルにアクセスできませんでした。",
            "record.calendar": "クラスカレンダー",
            "record.appearance": "サイトの外観",
            "record.language": "サイトの言語",
            "record.scheduler": "学校と時間割",
            "record.spinner": "スピナーホイール",
            "record.timer": "教室タイマー",
            "record.tracker": "クラストラッカー",
            "appearance.open": "サイトの外観設定を開く",
            "appearance.title": "外観",
            "appearance.close": "外観設定を閉じる",
            "appearance.help": "このテーマは、このブラウザのホームとすべてのTeacher Toolsアプレットで共有されます。",
            "appearance.groupAria": "サイトのカラーテーマ",
            "theme.modernBlue": "モダンブルー",
            "theme.oceanBlue": "オーシャンブルー",
            "theme.colorPop": "カラーポップ",
            "theme.prettyInPink": "プリティ・イン・ピンク",
            "theme.trueDark": "トゥルーダーク",
            "theme.custom": "カスタム",
            "appearance.primary": "メイン",
            "appearance.secondary": "サブ",
            "appearance.background": "背景",
            "appearance.resetCustom": "カスタム色をリセット",
            "appearance.customNote": "文字、パネル、枠線は読みやすい色に自動調整されます。"
        }
    };
    const SITE_BACKUP_APP_ID = "teacher-tools-site-backup";
    const SITE_BACKUP_SCHEMA_VERSION = 1;
    const SITE_BACKUP_MAX_BYTES = 5 * 1024 * 1024;
    const LINKED_DATA_DB = "teacher-tools-linked-data-v1";
    const LINKED_DATA_STORE = "connections";
    const LINKED_DATA_KEY = "primary";
    const SITE_DATA_RECORDS = Object.freeze([
        {
            id: "language",
            label: "Site language",
            labelKey: "record.language",
            storageKey: SITE_LANGUAGE_KEY,
            validate: value => isPlainObject(value) && value.version === 1 &&
                ALLOWED_LANGUAGES.includes(value.language)
        },
        {
            id: "appearance",
            label: "Site appearance",
            labelKey: "record.appearance",
            storageKey: SITE_PREFERENCES_KEY,
            validate: value => isPlainObject(value) && value.version === 1 && ALLOWED_THEMES.includes(value.theme) &&
                (value.theme !== "custom" || validCustomColors(value.customColors)) &&
                (value.profile === undefined || (
                    isPlainObject(value.profile) && typeof value.profile.name === "string" && value.profile.name.length <= 80 &&
                    window.TeacherToolsSelfieSchema.validProfile(value.profile)
                )) &&
                (value.appPanel === undefined || (
                    isPlainObject(value.appPanel) && value.appPanel.version === 1 &&
                    Array.isArray(value.appPanel.order) && value.appPanel.order.every(id => typeof id === "string") &&
                    Array.isArray(value.appPanel.visible) && value.appPanel.visible.every(id => typeof id === "string")
                ))
        },
        {
            id: "class-calendar",
            label: "Class Calendar",
            labelKey: "record.calendar",
            storageKey: "teacherTools.classCalendar.state.v1",
            validate: value => window.TeacherToolsCalendarValidate(value)
        },
        {
            id: "class-tracker",
            label: "Class Tracker",
            labelKey: "record.tracker",
            storageKey: "teacherTools.classTracker.state.v1",
            validate: value => isPlainObject(value) && value.version === 1 &&
                Array.isArray(value.templates) && isPlainObject(value.assignments) &&
                isPlainObject(value.progress) && isPlainObject(value.preferences)
        },
        {
            id: "timer",
            label: "Classroom Timer",
            labelKey: "record.timer",
            storageKey: "teacherTools.classroomTimer.state.v1",
            validate: value => isPlainObject(value) && value.version === 1 &&
                typeof value.soundEnabled === "boolean" &&
                Number.isInteger(value.defaultSeconds) &&
                Array.isArray(value.quickPresets) && Array.isArray(value.presets)
        },
        {
            id: "spinner",
            label: "Spinner Wheel",
            labelKey: "record.spinner",
            storageKey: "teacherTools.spinnerWheel.state.v1",
            validate: value => isPlainObject(value) && value.version === 1 &&
                ["numbers", "custom"].includes(value.mode) &&
                ["minimum", "maximum", "exclusions", "customChoices"].every(
                    key => typeof value[key] === "string"
                )
        },
        {
            id: "scheduler",
            label: "Schools & schedules",
            labelKey: "record.scheduler",
            storageKey: "classAutomatorData_v3",
            validate: value => isPlainObject(value) && value.version === 3 &&
                Array.isArray(value.schools) && isPlainObject(value.schedule) &&
                isPlainObject(value.preferences)
        }
    ]);
    let activeModal = null;
    let activeModalOpener = null;
    let activeTooltipTrigger = null;
    let tooltipElement = null;
    let tooltipContent = null;
    let tooltipPinned = false;
    let tooltipFrame = 0;
    let activeLanguage = "en";
    const translationCatalogs = {
        en: { ...SHARED_TRANSLATIONS.en },
        ja: { ...SHARED_TRANSLATIONS.ja }
    };
    const translationDefaults = new WeakMap();

    function storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            queueMicrotask(refreshLinkedDataIndicator);
            return true;
        } catch (error) {
            return false;
        }
    }

    function storageRemove(key) {
        try {
            localStorage.removeItem(key);
            queueMicrotask(refreshLinkedDataIndicator);
            return true;
        } catch (error) {
            return false;
        }
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function normalizeLanguage(value) {
        return ALLOWED_LANGUAGES.includes(value) ? value : "en";
    }

    function languageFromStoredValue(value) {
        if (!value) return null;
        try {
            const saved = JSON.parse(value);
            return saved && ALLOWED_LANGUAGES.includes(saved.language) ? saved.language : null;
        } catch (error) {
            return null;
        }
    }

    function interpolateTranslation(text, replacements = {}) {
        return Object.entries(replacements).reduce(
            (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
            text
        );
    }

    function translate(key, fallback = key, replacements = {}) {
        const localized = translationCatalogs[activeLanguage]?.[key];
        const english = translationCatalogs.en?.[key];
        return interpolateTranslation(localized ?? english ?? fallback, replacements);
    }

    function translationDefault(element, name, value) {
        const defaults = translationDefaults.get(element) || {};
        if (!(name in defaults)) defaults[name] = value;
        translationDefaults.set(element, defaults);
        return defaults[name];
    }

    function applyDocumentTranslations(root = document) {
        root.querySelectorAll("[data-i18n]").forEach(element => {
            const fallback = translationDefault(element, "text", element.textContent);
            element.textContent = translate(element.dataset.i18n, fallback);
        });
        ["aria-label", "title", "placeholder"].forEach(attribute => {
            const dataName = `i18n${attribute.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join("")}`;
            root.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
                const fallback = translationDefault(element, attribute, element.getAttribute(attribute) || "");
                element.setAttribute(attribute, translate(element.dataset[dataName], fallback));
            });
        });
    }

    function applyGlobalLanguage(requestedLanguage, persist = true) {
        activeLanguage = normalizeLanguage(requestedLanguage);
        document.documentElement.lang = activeLanguage;
        const choice = document.getElementById("siteLanguageChoice");
        if (choice) choice.value = activeLanguage;
        applyDocumentTranslations();
        if (document.getElementById("siteDataSummary")) updateSiteDataSummary();
        if (document.getElementById("siteLinkedDataCreate")) updateLinkedDataControls();
        setSiteDataStatus("");
        if (persist) {
            storageSet(SITE_LANGUAGE_KEY, JSON.stringify({ version: 1, language: activeLanguage }));
        }
        window.dispatchEvent(new CustomEvent("teacher-tools:languagechange", {
            detail: { language: activeLanguage }
        }));
    }

    function registerTranslations(catalogs) {
        for (const language of ALLOWED_LANGUAGES) {
            if (isPlainObject(catalogs?.[language])) {
                Object.assign(translationCatalogs[language], catalogs[language]);
            }
        }
        applyDocumentTranslations();
    }

    function readSiteDataRecord(definition) {
        const raw = storageGet(definition.storageKey);
        if (raw === null) return { definition, state: "missing", value: null };

        try {
            const value = JSON.parse(raw);
            return definition.validate(value)
                ? { definition, state: "saved", value }
                : { definition, state: "invalid", value: null };
        } catch (error) {
            return { definition, state: "invalid", value: null };
        }
    }

    function siteDataSnapshot() {
        return SITE_DATA_RECORDS.map(readSiteDataRecord);
    }

    function siteDataRecordLabel(definition) {
        return translate(definition.labelKey, definition.label);
    }

    function setSiteDataStatus(message, error = false) {
        const status = document.getElementById("siteDataStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", error);
    }

    function updateSiteDataSummary() {
        const summary = document.getElementById("siteDataSummary");
        if (!summary) return;

        summary.replaceChildren(...siteDataSnapshot().map(record => {
            const item = document.createElement("li");
            item.className = "site-data-summary-item";
            const selection = document.createElement("label");
            selection.className = "site-data-summary-selection";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "site-data-checkbox";
            checkbox.dataset.siteDataRecord = record.definition.id;
            checkbox.checked = record.state === "saved";
            checkbox.disabled = record.state !== "saved";
            const label = document.createElement("span");
            label.textContent = siteDataRecordLabel(record.definition);
            selection.append(checkbox, label);
            const state = document.createElement("span");
            state.className = `site-data-summary-state ${record.state}`;
            state.textContent = record.state === "saved"
                ? translate("backup.saved", "Saved")
                : record.state === "invalid"
                    ? translate("backup.invalid", "Needs attention")
                    : translate("backup.missing", "No saved data");
            item.append(selection, state);
            return item;
        }));
        updateSiteDataExportButton();
    }

    function selectedSiteDataIds() {
        return new Set(
            [...document.querySelectorAll("[data-site-data-record]:checked")]
                .map(checkbox => checkbox.dataset.siteDataRecord)
        );
    }

    function updateSiteDataExportButton() {
        const exportButton = document.getElementById("siteDataExportButton");
        if (!exportButton) return;

        const selectable = [...document.querySelectorAll("[data-site-data-record]:not(:disabled)")];
        const selectedCount = selectable.filter(checkbox => checkbox.checked).length;
        exportButton.disabled = selectedCount === 0;
        exportButton.textContent = selectedCount === selectable.length && selectable.length > 0
            ? translate("backup.exportAll", "Export All Data")
            : selectedCount > 0
                ? translate("backup.exportCount", `Export (${selectedCount}) ${selectedCount === 1 ? "item" : "items"}`, {
                    count: selectedCount,
                    items: translate(selectedCount === 1 ? "backup.item" : "backup.items", selectedCount === 1 ? "item" : "items")
                })
                : translate("backup.select", "Select data to export");
    }

    function localDateStamp(date = new Date()) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function downloadJsonFile(payload, filename) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        // A synthetic download click must not dismiss the containing Profile dialog.
        link.addEventListener("click", event => event.stopPropagation());
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function exportSiteDataBackup() {
        const snapshot = siteDataSnapshot();
        const selectedIds = selectedSiteDataIds();
        const saved = snapshot.filter(record =>
            record.state === "saved" && selectedIds.has(record.definition.id)
        );
        if (!saved.length) {
            setSiteDataStatus(translate("backup.selectError", "Select at least one saved item to export."), true);
            return;
        }

        const records = Object.fromEntries(
            saved.map(record => [record.definition.id, record.value])
        );
        const payload = {
            app: SITE_BACKUP_APP_ID,
            schemaVersion: SITE_BACKUP_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            records
        };

        downloadJsonFile(payload, `teacher-tools-backup-${localDateStamp()}.json`);
        setSiteDataStatus(translate(
            "backup.exported",
            `Backup exported with ${saved.length} saved ${saved.length === 1 ? "area" : "areas"}.`,
            {
                count: saved.length,
                areas: translate(saved.length === 1 ? "backup.area" : "backup.areas", saved.length === 1 ? "area" : "areas")
            }
        ));
    }

    registerTranslations({"en": {"syncIndicator.disabled": "Autosave disabled — no file linked. Open File sync.", "syncIndicator.unsupported": "Automatic file saving is unavailable in this browser. Open File sync.", "syncIndicator.checking": "Checking file sync status…", "syncIndicator.pending": "Data not yet saved to the linked file. Open File sync.", "syncIndicator.saved": "Data matches the linked file. Last saved: {time}. Open File sync.", "syncIndicator.matched": "Data matches the linked file; save time unavailable. Open File sync.", "syncIndicator.saving": "File sync in progress…", "syncIndicator.permission": "Autosave paused — file access required. Open File sync.", "syncIndicator.conflict": "Linked file changed — review before saving. Open File sync.", "syncIndicator.error": "File sync needs attention — changes may not be saved. Open File sync."}, "ja": {"syncIndicator.disabled": "自動保存は無効です。ファイルが接続されていません。ファイル同期を開く。", "syncIndicator.unsupported": "このブラウザではファイルへの自動保存を利用できません。ファイル同期を開く。", "syncIndicator.checking": "ファイル同期の状態を確認中…", "syncIndicator.pending": "変更はまだリンク済みファイルに保存されていません。ファイル同期を開く。", "syncIndicator.saved": "リンク済みファイルと一致しています。最終保存：{time}。ファイル同期を開く。", "syncIndicator.matched": "リンク済みファイルと一致しています。保存時刻は不明です。ファイル同期を開く。", "syncIndicator.saving": "ファイル同期を処理中…", "syncIndicator.permission": "自動保存は停止中です。ファイルへのアクセス許可が必要です。ファイル同期を開く。", "syncIndicator.conflict": "リンク済みファイルに変更があります。保存前に確認してください。ファイル同期を開く。", "syncIndicator.error": "ファイル同期を確認してください。変更が保存されていない可能性があります。ファイル同期を開く。"}});

    const LINKED_AUTOSAVE_INTERVAL_MS = 15 * 60 * 1000;
    const linkedDataState = {
        autosaveStartedAt: Date.now(),
        initializing: true,
        lastError: false,
        supported: location.protocol !== "file:" && "showOpenFilePicker" in window && "showSaveFilePicker" in window && "indexedDB" in window,
        handle: null,
        fileFingerprint: null,
        localFingerprint: null,
        busy: false,
        conflict: false,
        externalChange: false,
        dismissedFileFingerprint: null,
        permissionRequired: false,
        lastSavedAt: null,
        lastExternalCheck: 0,
        timer: 0
    };

    function linkedDataPayload() {
        const records = Object.fromEntries(
            siteDataSnapshot()
                .filter(record => record.state === "saved")
                .map(record => [record.definition.id, record.value])
        );
        return {
            app: SITE_BACKUP_APP_ID,
            schemaVersion: SITE_BACKUP_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            linkedFile: { beta: true, updatedAt: new Date().toISOString() },
            records
        };
    }

    function linkedDataFingerprint(payload = linkedDataPayload()) {
        return JSON.stringify(payload.records || {});
    }

    function linkedDataDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(LINKED_DATA_DB, 1);
            request.addEventListener("upgradeneeded", () => {
                if (!request.result.objectStoreNames.contains(LINKED_DATA_STORE)) {
                    request.result.createObjectStore(LINKED_DATA_STORE);
                }
            });
            request.addEventListener("success", () => resolve(request.result));
            request.addEventListener("error", () => reject(request.error));
        });
    }

    async function linkedDataRecord(value) {
        const database = await linkedDataDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(LINKED_DATA_STORE, value === undefined ? "readonly" : "readwrite");
            const store = transaction.objectStore(LINKED_DATA_STORE);
            const request = value === null
                ? store.delete(LINKED_DATA_KEY)
                : value === undefined
                    ? store.get(LINKED_DATA_KEY)
                    : store.put(value, LINKED_DATA_KEY);
            request.addEventListener("success", () => resolve(request.result));
            request.addEventListener("error", () => reject(request.error));
            transaction.addEventListener("complete", () => database.close());
        });
    }

    function refreshLinkedDataIndicator() {
        const button = document.getElementById('siteSyncStatusButton');
        if (!button) return;
        let state = 'disabled', key = 'syncIndicator.disabled', time = '';
        if (!linkedDataState.supported) { state = 'unsupported'; key = 'syncIndicator.unsupported'; }
        else if (linkedDataState.initializing) { state = 'checking'; key = 'syncIndicator.checking'; }
        else if (linkedDataState.lastError && !linkedDataState.handle) { state = 'error'; key = 'syncIndicator.error'; }
        else if (linkedDataState.handle) {
            if (linkedDataState.busy) { state = 'saving'; key = 'syncIndicator.saving'; }
            else if (linkedDataState.permissionRequired) { state = 'permission'; key = 'syncIndicator.permission'; }
            else if (linkedDataState.conflict || linkedDataState.externalChange) { state = 'conflict'; key = 'syncIndicator.conflict'; }
            else if (linkedDataState.lastError) { state = 'error'; key = 'syncIndicator.error'; }
            else {
                try {
                    if (linkedDataFingerprint() !== linkedDataState.localFingerprint) { state = 'pending'; key = 'syncIndicator.pending'; }
                    else if (linkedDataState.fileFingerprint === null) { state = 'pending'; key = 'syncIndicator.pending'; }
                    else {
                        state = 'saved';
                        const date = new Date(linkedDataState.lastSavedAt);
                        if (linkedDataState.lastSavedAt && Number.isFinite(date.getTime())) {
                            time = date.toLocaleString(document.documentElement.lang || 'en'); key = 'syncIndicator.saved';
                        } else key = 'syncIndicator.matched';
                    }
                } catch { state = 'error'; key = 'syncIndicator.error'; }
            }
        }
        const text = translate(key, key, {time});
        button.dataset.syncState = state;
        button.title = text;
        button.setAttribute('aria-label', text);
    }

    function setLinkedDataStatus(message, error = false, notice = false) {
        linkedDataState.lastError = error;
        refreshLinkedDataIndicator();
        const status = document.getElementById("siteLinkedDataStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", error);
        status.classList.toggle("notice", notice);
    }

    function updateLinkedDataControls() {
        refreshLinkedDataIndicator();
        const name = document.getElementById("siteLinkedDataFile");
        const linked = Boolean(linkedDataState.handle);
        if (name) name.textContent = linked
            ? linkedDataState.handle.name
            : translate("linked.none", "No file linked");
        for (const id of ["siteLinkedDataLoad", "siteLinkedDataSave", "siteLinkedDataDisconnect"]) {
            const button = document.getElementById(id);
            if (button) button.disabled = !linked || linkedDataState.busy;
        }
        const saveButton = document.getElementById("siteLinkedDataSave");
        if (saveButton) saveButton.textContent = linkedDataState.permissionRequired
            ? translate("linked.enable", "Allow file access")
            : translate("linked.save", "Save Changes");
        const permissionHelp = document.getElementById("siteLinkedDataPermissionHelp");
        if (permissionHelp) permissionHelp.hidden = !linked || !linkedDataState.permissionRequired;
        const lastSaved = document.getElementById("siteLinkedDataLastSaved");
        if (lastSaved) {
            const savedDate = linkedDataState.lastSavedAt ? new Date(linkedDataState.lastSavedAt) : null;
            const valid = savedDate && Number.isFinite(savedDate.getTime());
            lastSaved.hidden = !linked || !valid;
            lastSaved.textContent = valid
                ? translate("linked.lastSaved", `Last saved: ${savedDate.toLocaleString()}`, {
                    time: new Intl.DateTimeFormat(activeLanguage === "ja" ? "ja-JP" : "en", {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }).format(savedDate)
                })
                : "";
        }
        for (const id of ["siteLinkedDataCreate", "siteLinkedDataLink"]) {
            const button = document.getElementById(id);
            if (button) button.disabled = !linkedDataState.supported || linkedDataState.busy;
        }
    }

    async function linkedDataPermission(write = false, request = false) {
        if (!linkedDataState.handle) return false;
        const options = { mode: write ? "readwrite" : "read" };
        let permission = await linkedDataState.handle.queryPermission(options);
        if (permission !== "granted" && request) {
            permission = await linkedDataState.handle.requestPermission(options);
        }
        return permission === "granted";
    }

    async function readLinkedDataFile() {
        const file = await linkedDataState.handle.getFile();
        if (file.size > SITE_BACKUP_MAX_BYTES) throw new Error(translate("backup.tooLarge", "That file is too large to be a Teacher Tools backup."));
        const payload = JSON.parse(await file.text());
        globalBackupPlan(payload);
        return payload;
    }

    async function rememberLinkedData() {
        await linkedDataRecord({
            handle: linkedDataState.handle,
            fileFingerprint: linkedDataState.fileFingerprint,
            localFingerprint: linkedDataState.localFingerprint,
            lastSavedAt: linkedDataState.lastSavedAt
        });
    }

    async function writeLinkedDataFile(automatic = false, force = false) {
        if (!linkedDataState.handle || linkedDataState.busy) return false;
        linkedDataState.busy = true;
        updateLinkedDataControls();
        try {
            if (!await linkedDataPermission(true, !automatic)) {
                linkedDataState.permissionRequired = true;
                setLinkedDataStatus(translate("linked.permission", `Automatic saving is paused. Choose Allow file access to approve writing to ${linkedDataState.handle.name}; access may need renewing after reopening the site.`, { name: linkedDataState.handle.name }));
                return false;
            }
            linkedDataState.permissionRequired = false;
            updateLinkedDataControls();
            if (!force && linkedDataState.fileFingerprint !== null) {
                const currentFile = await readLinkedDataFile();
                if (linkedDataFingerprint(currentFile) !== linkedDataState.fileFingerprint) {
                    linkedDataState.conflict = true;
                    linkedDataState.externalChange = true;
                    setLinkedDataStatus(translate("linked.conflict", "Both this browser and the linked file changed. Choose Sync Data or Save Changes; nothing was overwritten."), true);
                    return false;
                }
            }
            const payload = linkedDataPayload();
            const writable = await linkedDataState.handle.createWritable();
            await writable.write(JSON.stringify(payload, null, 2));
            await writable.close();
            linkedDataState.fileFingerprint = linkedDataFingerprint(payload);
            linkedDataState.localFingerprint = linkedDataState.fileFingerprint;
            linkedDataState.conflict = false;
            linkedDataState.externalChange = false;
            linkedDataState.dismissedFileFingerprint = null;
            linkedDataState.permissionRequired = false;
            linkedDataState.lastSavedAt = payload.exportedAt;
            await rememberLinkedData();
            setLinkedDataStatus(translate(
                automatic ? "linked.automatic" : "linked.saved",
                automatic ? `Automatically saved to ${linkedDataState.handle.name}.` : `Saved current Teacher Tools data to ${linkedDataState.handle.name}.`,
                { name: linkedDataState.handle.name }
            ));
            return true;
        } catch (error) {
            setLinkedDataStatus(error instanceof Error ? error.message : translate("linked.error", "The linked file could not be accessed."), true);
            return false;
        } finally {
            linkedDataState.busy = false;
            updateLinkedDataControls();
        }
    }

    async function loadLinkedDataFile(confirmLoad = true) {
        if (!linkedDataState.handle || linkedDataState.busy) return;
        linkedDataState.busy = true;
        updateLinkedDataControls();
        try {
            if (!await linkedDataPermission(false, true)) throw new Error(translate("linked.error", "The linked file could not be accessed."));
            const payload = await readLinkedDataFile();
            if (confirmLoad && !window.confirm(translate("linked.loadConfirm", `Sync Data from ${linkedDataState.handle.name}? This replaces the browser's supported Teacher Tools records with the file's records, then reloads the page.`, { name: linkedDataState.handle.name }))) return false;
            const plan = linkedDataImportPlan(payload);
            applyStorageChanges(plan.changes);
            linkedDataState.fileFingerprint = linkedDataFingerprint(payload);
            linkedDataState.localFingerprint = linkedDataState.fileFingerprint;
            linkedDataState.conflict = false;
            linkedDataState.externalChange = false;
            linkedDataState.dismissedFileFingerprint = null;
            linkedDataState.lastSavedAt = payload.exportedAt || new Date().toISOString();
            await rememberLinkedData();
            setLinkedDataStatus(translate("linked.loaded", `Loaded ${linkedDataState.handle.name}. Reloading this page…`, { name: linkedDataState.handle.name }));
            window.location.reload();
            return true;
        } catch (error) {
            setLinkedDataStatus(error instanceof Error ? error.message : translate("linked.invalid", "The selected file is not a valid current Teacher Tools data file."), true);
            return null;
        } finally {
            linkedDataState.busy = false;
            updateLinkedDataControls();
        }
    }

    async function createLinkedDataFile() {
        try {
            const handle = await window.showSaveFilePicker({
                id: "teacher-tools-linked-data",
                suggestedName: "Teacher Tools Data.json",
                types: [{ description: "Teacher Tools data", accept: { "application/json": [".json"] } }]
            });
            linkedDataState.handle = handle;
            linkedDataState.fileFingerprint = null;
            linkedDataState.localFingerprint = linkedDataFingerprint();
            linkedDataState.permissionRequired = false;
            linkedDataState.lastSavedAt = null;
            updateLinkedDataControls();
            if (await writeLinkedDataFile(false, true)) {
                setLinkedDataStatus(translate("linked.created", `Created and linked ${handle.name}.`, { name: handle.name }));
            }
        } catch (error) {
            if (error?.name !== "AbortError") setLinkedDataStatus(translate("linked.error", "The linked file could not be accessed."), true);
        }
    }

    async function linkExistingDataFile() {
        const previous = {
            handle: linkedDataState.handle,
            fileFingerprint: linkedDataState.fileFingerprint,
            localFingerprint: linkedDataState.localFingerprint,
            conflict: linkedDataState.conflict,
            externalChange: linkedDataState.externalChange,
            dismissedFileFingerprint: linkedDataState.dismissedFileFingerprint,
            permissionRequired: linkedDataState.permissionRequired,
            lastSavedAt: linkedDataState.lastSavedAt
        };
        const restorePrevious = () => Object.assign(linkedDataState, previous);
        try {
            const [handle] = await window.showOpenFilePicker({
                id: "teacher-tools-linked-data",
                multiple: false,
                types: [{ description: "Teacher Tools data", accept: { "application/json": [".json"] } }]
            });
            linkedDataState.handle = handle;
            linkedDataState.permissionRequired = false;
            const payload = await readLinkedDataFile();
            linkedDataState.fileFingerprint = linkedDataFingerprint(payload);
            linkedDataState.localFingerprint = linkedDataFingerprint();
            linkedDataState.lastSavedAt = payload.exportedAt || null;
            updateLinkedDataControls();
            const loaded = await loadLinkedDataFile(true);
            if (loaded === false) {
                restorePrevious();
                updateLinkedDataControls();
                setLinkedDataStatus(translate("linked.linkCancelled", "Linking cancelled. Your previous connection was not changed."));
            } else if (loaded === null) {
                restorePrevious();
                updateLinkedDataControls();
            }
        } catch (error) {
            if (error?.name !== "AbortError") {
                restorePrevious();
                updateLinkedDataControls();
                setLinkedDataStatus(error instanceof Error ? error.message : translate("linked.invalid", "The selected file is not a valid current Teacher Tools data file."), true);
            }
        }
    }

    async function disconnectLinkedDataFile() {
        linkedDataState.handle = null;
        linkedDataState.fileFingerprint = null;
        linkedDataState.localFingerprint = null;
        linkedDataState.conflict = false;
        linkedDataState.externalChange = false;
        linkedDataState.dismissedFileFingerprint = null;
        linkedDataState.permissionRequired = false;
        linkedDataState.lastSavedAt = null;
        await linkedDataRecord(null);
        updateLinkedDataControls();
        setLinkedDataStatus(translate("linked.disconnected", "Linked file disconnected. The file itself was not deleted."));
    }

    async function offerExternalLinkedData(fileFingerprint) {
        linkedDataState.externalChange = true;
        setLinkedDataStatus(translate("linked.fileChanged", "Synced changes are waiting. Choose Sync Data to use them, or Save Changes to replace them."));
        if (linkedDataState.dismissedFileFingerprint === fileFingerprint) return;
        linkedDataState.dismissedFileFingerprint = fileFingerprint;
        const accepted = window.confirm(translate(
            "linked.autoPullConfirm",
            `New synced data was detected in ${linkedDataState.handle.name}, possibly from another browser. Load it now? This browser's Teacher Tools data will be overwritten. Choose Cancel to review and use Sync Data or Save Changes manually.`,
            { name: linkedDataState.handle.name }
        ));
        if (accepted) await loadLinkedDataFile(false);
    }

    async function checkLinkedDataFile() {
        const now = Date.now();
        if (now - linkedDataState.lastExternalCheck < 4000) return;
        linkedDataState.lastExternalCheck = now;
        if (!await linkedDataPermission(true, false)) {
            linkedDataState.permissionRequired = true;
            updateLinkedDataControls();
            setLinkedDataStatus(translate("linked.permission", `Automatic saving is paused. Choose Allow file access to approve writing to ${linkedDataState.handle.name}; access may need renewing after reopening the site.`, { name: linkedDataState.handle.name }));
            return;
        }
        const permissionRecovered = linkedDataState.permissionRequired;
        linkedDataState.permissionRequired = false;
        const payload = await readLinkedDataFile();
        const fileNow = linkedDataFingerprint(payload);
        if (permissionRecovered) {
            setLinkedDataStatus(translate('linked.pending', 'Browser changes are waiting to be saved to {name}.', {name: linkedDataState.handle.name}));
            updateLinkedDataControls();
        }
        if (linkedDataState.fileFingerprint === null || fileNow === linkedDataState.fileFingerprint) {
            if (linkedDataState.localFingerprint === linkedDataFingerprint() && fileNow === linkedDataState.fileFingerprint && (permissionRecovered || linkedDataState.lastError)) {
                setLinkedDataStatus(translate('linked.ready', 'Linked to {name}.', {name: linkedDataState.handle.name}));
            }
            return;
        }
        const localChanged = linkedDataFingerprint() !== linkedDataState.localFingerprint;
        if (localChanged) {
            linkedDataState.conflict = true;
            linkedDataState.externalChange = true;
            setLinkedDataStatus(translate("linked.conflict", "Both this browser and the linked file changed. Choose Sync Data or Save Changes; nothing was overwritten."), true);
            return;
        }
        await offerExternalLinkedData(fileNow);
    }

    async function linkedDataAutosaveCheck() {
        if (!linkedDataState.handle || linkedDataState.busy || document.visibilityState === "hidden") return;
        try {
            await checkLinkedDataFile();
        } catch (error) {
            setLinkedDataStatus(error instanceof Error ? error.message : translate("linked.error", "The linked file could not be accessed."), true);
            return;
        }
        if (linkedDataState.conflict || linkedDataState.externalChange) return;
        const local = linkedDataFingerprint();
        if (local === linkedDataState.localFingerprint) return;
        const lastSaved = Date.parse(linkedDataState.lastSavedAt);
        const baseline = Number.isFinite(lastSaved) ? lastSaved : linkedDataState.autosaveStartedAt;
        if (Date.now() - baseline < LINKED_AUTOSAVE_INTERVAL_MS) return;
        await writeLinkedDataFile(true);
    }

    async function initLinkedDataFile() {
        if (!document.getElementById("siteLinkedDataCreate")) return;
        document.getElementById('siteSyncStatusButton')?.addEventListener('click', event => { event.stopPropagation(); window.TeacherToolsProfile.openSync('file', event.currentTarget); });
        window.addEventListener('teacher-tools:languagechange', refreshLinkedDataIndicator);
        window.addEventListener('storage', refreshLinkedDataIndicator);
        window.addEventListener('teacher-tools:toolschange', () => queueMicrotask(refreshLinkedDataIndicator));
        if (!linkedDataState.supported) linkedDataState.initializing = false;
        if (!linkedDataState.supported) {
            updateLinkedDataControls();
            setLinkedDataStatus(translate("linked.unsupported", "Linked files are not supported in this browser. Backup export and import still work normally."), false, true);
            return;
        }
        document.getElementById("siteLinkedDataCreate").addEventListener("click", createLinkedDataFile);
        document.getElementById("siteLinkedDataLink").addEventListener("click", linkExistingDataFile);
        document.getElementById("siteLinkedDataLoad").addEventListener("click", () => loadLinkedDataFile(true));
        document.getElementById("siteLinkedDataSave").addEventListener("click", async () => {
            let force = linkedDataState.conflict || linkedDataState.externalChange;
            if (force && !window.confirm(translate("linked.saveConfirm", "The linked file changed elsewhere. Replace it with this browser's current data?"))) return;
            await writeLinkedDataFile(false, force);
        });
        document.getElementById("siteLinkedDataDisconnect").addEventListener("click", disconnectLinkedDataFile);
        try {
            const saved = await linkedDataRecord();
            if (saved?.handle) {
                linkedDataState.handle = saved.handle;
                linkedDataState.fileFingerprint = saved.fileFingerprint ?? null;
                linkedDataState.localFingerprint = saved.localFingerprint ?? linkedDataFingerprint();
                linkedDataState.lastSavedAt = saved.lastSavedAt ?? null;
                updateLinkedDataControls();
                if (await linkedDataPermission(true, false)) {
                    const payload = await readLinkedDataFile();
                    const fileNow = linkedDataFingerprint(payload);
                    const localNow = linkedDataFingerprint();
                    const fileChanged = linkedDataState.fileFingerprint !== null && fileNow !== linkedDataState.fileFingerprint;
                    const localChanged = localNow !== linkedDataState.localFingerprint;
                    if (fileChanged && localChanged) {
                        linkedDataState.conflict = true;
                        linkedDataState.externalChange = true;
                        setLinkedDataStatus(translate("linked.conflict", "Both this browser and the linked file changed. Choose Sync Data or Save Changes; nothing was overwritten."), true);
                    } else if (fileChanged) {
                        await offerExternalLinkedData(fileNow);
                    } else if (localChanged) {
                        setLinkedDataStatus(translate("linked.pending", `Browser changes are waiting to be saved to ${saved.handle.name}.`, { name: saved.handle.name }));
                    } else {
                        setLinkedDataStatus(translate("linked.ready", `Linked to ${saved.handle.name}. Changed data saves about every 15 minutes while this page is active and write access is allowed.`, { name: saved.handle.name }));
                    }
                } else {
                    linkedDataState.permissionRequired = true;
                    setLinkedDataStatus(translate("linked.permission", `Automatic saving is paused. Choose Allow file access to approve writing to ${saved.handle.name}; access may need renewing after reopening the site.`, { name: saved.handle.name }));
                }
            }
        } catch (error) {
            setLinkedDataStatus(translate("linked.error", "The linked file could not be accessed."), true);
        }
        linkedDataState.initializing = false;
        updateLinkedDataControls();
        const check = async () => { try { await linkedDataAutosaveCheck(); } finally { refreshLinkedDataIndicator(); } };
        linkedDataState.timer = window.setInterval(check, 5000);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") check();
        });
        window.addEventListener("focus", check);
    }

    function readFileText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(String(reader.result || "")));
            reader.addEventListener("error", () => reject(new Error(translate("backup.readError", "The backup file could not be read."))));
            reader.readAsText(file);
        });
    }

    function globalBackupPlan(payload) {
        if (!isPlainObject(payload) || payload.app !== SITE_BACKUP_APP_ID ||
            payload.schemaVersion !== SITE_BACKUP_SCHEMA_VERSION || !isPlainObject(payload.records)) {
            throw new Error(translate("backup.siteUnsupported", "This is not a supported Teacher Tools site backup."));
        }

        const changes = [];
        const labels = [];
        SITE_DATA_RECORDS.forEach(definition => {
            if (!Object.prototype.hasOwnProperty.call(payload.records, definition.id)) return;
            const value = payload.records[definition.id];
            if (!definition.validate(value)) {
                throw new Error(translate("backup.invalidRecord", `${definition.label} data in this backup is not valid.`, {
                    label: siteDataRecordLabel(definition)
                }));
            }
            changes.push({ key: definition.storageKey, value: JSON.stringify(value) });
            labels.push(siteDataRecordLabel(definition));
        });

        if (!changes.length) {
            throw new Error(translate("backup.noSupportedData", "This backup does not contain any supported Teacher Tools data."));
        }
        return { changes, labels, legacy: false };
    }

    function linkedDataImportPlan(payload) {
        const plan = globalBackupPlan(payload);
        const included = new Set(Object.keys(payload.records));
        SITE_DATA_RECORDS.forEach(definition => {
            if (!included.has(definition.id)) {
                plan.changes.push({ key: definition.storageKey, value: null });
            }
        });
        return plan;
    }

    function spinnerBackupPlan(payload) {
        if (!isPlainObject(payload) || payload.app !== "teacher-tools-spinner-wheel" ||
            payload.schemaVersion !== 1) return null;

        const definition = SITE_DATA_RECORDS.find(record => record.id === "spinner");
        if (!definition.validate(payload.state)) {
            throw new Error(translate("backup.spinnerInvalid", "The Spinner Wheel data in this backup is not valid."));
        }
        return {
            changes: [{ key: definition.storageKey, value: JSON.stringify(payload.state) }],
            labels: [siteDataRecordLabel(definition)],
            legacy: true
        };
    }

    function schedulerBackupPlan(payload) {
        if (!isPlainObject(payload) || ![1, 2, 3].includes(payload.version)) return null;

        if (payload.version === 1) {
            if (!isPlainObject(payload.schedule)) {
                throw new Error(translate("backup.schedulerV1Invalid", "The Version 1 Scheduler data in this backup is not valid."));
            }
            return {
                changes: [
                    { key: "classAutomatorData_v3", value: null },
                    { key: "classAutomatorData_v2", value: null },
                    { key: "classAutomatorSchedule_v1", value: JSON.stringify(payload.schedule) }
                ],
                labels: [translate("record.scheduler", "Schools & schedules")],
                legacy: true
            };
        }

        if (!Array.isArray(payload.schools) || !isPlainObject(payload.schedule) ||
            (payload.preferences !== undefined && !isPlainObject(payload.preferences))) {
            throw new Error(translate("backup.schedulerVersionInvalid", `The Version ${payload.version} Scheduler data in this backup is not valid.`, { version: payload.version }));
        }

        const theme = isPlainObject(payload.preferences) &&
            ALLOWED_THEMES.includes(payload.preferences.theme)
            ? payload.preferences.theme
            : null;
        const themeChange = theme
            ? [{ key: SITE_PREFERENCES_KEY, value: JSON.stringify({ version: 1, theme }) }]
            : [];
        const labels = theme
            ? [translate("record.scheduler", "Schools & schedules"), translate("record.appearance", "Site appearance")]
            : [translate("record.scheduler", "Schools & schedules")];

        if (payload.version === 2) {
            return {
                changes: [
                    { key: "classAutomatorData_v3", value: null },
                    { key: "classAutomatorData_v2", value: JSON.stringify(payload) },
                    ...themeChange
                ],
                labels,
                legacy: true
            };
        }

        return {
            changes: [
                { key: "classAutomatorData_v3", value: JSON.stringify(payload) },
                ...themeChange
            ],
            labels,
            legacy: true
        };
    }

    function buildImportPlan(payload) {
        if (isPlainObject(payload) && payload.app === SITE_BACKUP_APP_ID) {
            return globalBackupPlan(payload);
        }
        const spinnerPlan = spinnerBackupPlan(payload);
        if (spinnerPlan) return spinnerPlan;
        const schedulerPlan = schedulerBackupPlan(payload);
        if (schedulerPlan) return schedulerPlan;
        throw new Error(translate("backup.unsupported", "This is not a supported Teacher Tools, Scheduler, or Spinner Wheel backup."));
    }

    function applyStorageChanges(changes) {
        const previous = new Map();
        const changed = [];

        try {
            changes.forEach(change => {
                previous.set(change.key, storageGet(change.key));
                const succeeded = change.value === null
                    ? storageRemove(change.key)
                    : storageSet(change.key, change.value);
                if (!succeeded) {
                    throw new Error(translate("backup.storageError", "Browser storage is unavailable or full."));
                }
                changed.push(change.key);
            });
        } catch (error) {
            changed.forEach(key => {
                const oldValue = previous.get(key);
                if (oldValue === null) storageRemove(key);
                else storageSet(key, oldValue);
            });
            throw error;
        }
    }

    async function importSiteDataBackup(file) {
        if (!file) return;
        if (file.size > SITE_BACKUP_MAX_BYTES) {
            setSiteDataStatus(translate("backup.tooLarge", "That file is too large to be a Teacher Tools backup."), true);
            return;
        }

        try {
            const plan = buildImportPlan(JSON.parse(await readFileText(file)));
            const kind = translate(plan.legacy ? "backup.kindOlder" : "backup.kindSite", plan.legacy ? "older single-tool" : "Teacher Tools");
            const confirmed = window.confirm(translate(
                "backup.confirm",
                `Import this ${kind} backup? It will replace saved data for: ${plan.labels.join(", ")}. Other saved tool data will remain unchanged. This page will reload afterward.`,
                { kind, labels: plan.labels.join(activeLanguage === "ja" ? "、" : ", ") }
            ));
            if (!confirmed) {
                setSiteDataStatus(translate("backup.cancelled", "Import cancelled."));
                return;
            }

            applyStorageChanges(plan.changes);
            setSiteDataStatus(translate("backup.success", "Backup imported successfully. Reloading this page…"));
            window.alert(translate("backup.successAlert", "Teacher Tools backup imported successfully. This page will now reload."));
            window.location.reload();
        } catch (error) {
            setSiteDataStatus(
                error instanceof Error ? error.message : translate("backup.importError", "The backup could not be imported."),
                true
            );
        }
    }

    function initSiteDataBackup() {
        const exportButton = document.getElementById("siteDataExportButton");
        const importButton = document.getElementById("siteDataImportButton");
        const importFile = document.getElementById("siteDataImportFile");
        if (!exportButton || !importButton || !importFile) return;

        const dataTabs = [...document.querySelectorAll("[data-site-data-tab]")];
        const dataPanels = [...document.querySelectorAll("[data-site-data-panel]")];
        const activateDataTab = (name, focus = false) => {
            dataTabs.forEach(tab => {
                const active = tab.dataset.siteDataTab === name;
                tab.setAttribute("aria-selected", String(active));
                tab.tabIndex = active ? 0 : -1;
            });
            dataPanels.forEach(panel => {
                panel.hidden = panel.dataset.siteDataPanel !== name;
            });
            if (focus) dataTabs.find(tab => tab.dataset.siteDataTab === name)?.focus();
        };
        dataTabs.forEach((tab, index) => {
            tab.addEventListener("click", () => activateDataTab(tab.dataset.siteDataTab));
            tab.addEventListener("keydown", event => {
                let nextIndex = null;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % dataTabs.length;
                if (event.key === "ArrowLeft") nextIndex = (index - 1 + dataTabs.length) % dataTabs.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = dataTabs.length - 1;
                if (nextIndex === null) return;
                event.preventDefault();
                // This tablist owns its navigation keys, not the tool's page shortcuts.
                event.stopPropagation();
                activateDataTab(dataTabs[nextIndex].dataset.siteDataTab, true);
            });
        });
        activateDataTab("export");

        exportButton.addEventListener("click", exportSiteDataBackup);
        importButton.addEventListener("click", () => importFile.click());
        importFile.addEventListener("change", async () => {
            await importSiteDataBackup(importFile.files[0]);
            importFile.value = "";
        });
        document.getElementById("siteDataSummary")?.addEventListener("change", event => {
            if (event.target.matches("[data-site-data-record]")) {
                updateSiteDataExportButton();
                setSiteDataStatus("");
            }
        });
        updateSiteDataSummary();
        initLinkedDataFile();
    }

    function normalizeTheme(value) {
        return ALLOWED_THEMES.includes(value) ? value : "modern-blue";
    }

    function validCustomColors(value) {
        return isPlainObject(value) && ["primary", "secondary", "background"].every(key => HEX_COLOR.test(value[key] || ""));
    }

    function normalizeCustomColors(value) {
        return Object.fromEntries(Object.entries(DEFAULT_CUSTOM_COLORS).map(([key, fallback]) => [key, HEX_COLOR.test(value?.[key] || "") ? value[key].toLowerCase() : fallback]));
    }

    function colorRgb(hex) {
        const value = hex.slice(1);
        return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    }

    function colorHex(values) {
        return `#${values.map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
    }

    function mixColor(first, second, amount) {
        const a = colorRgb(first), b = colorRgb(second);
        return colorHex(a.map((value, index) => value + (b[index] - value) * amount));
    }

    function colorLuminance(hex) {
        const channels = colorRgb(hex).map(value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function contrastText(background) {
        const luminance = colorLuminance(background);
        const whiteContrast = 1.05 / (luminance + 0.05);
        const darkContrast = (luminance + 0.05) / 0.05;
        return whiteContrast >= darkContrast ? "#ffffff" : "#111827";
    }

    function customThemeTokens(value) {
        const colors = normalizeCustomColors(value), dark = colorLuminance(colors.background) < 0.3;
        const surface = mixColor(colors.background, dark ? "#ffffff" : "#ffffff", dark ? 0.075 : 0.88);
        const panel = mixColor(colors.background, surface, dark ? 0.42 : 0.68);
        const text = dark ? "#f3f6fa" : "#24282d";
        return { colors, dark, tokens: {
            "--accent": colors.primary,
            "--accent-secondary": colors.secondary,
            "--accent-soft": mixColor(colors.primary, surface, dark ? 0.78 : 0.84),
            "--accent-border": mixColor(colors.primary, surface, dark ? 0.52 : 0.58),
            "--focus-ring": `${colors.primary}3d`,
            "--accent-contrast": contrastText(colors.primary),
            "--text": text,
            "--muted": mixColor(text, surface, dark ? 0.48 : 0.42),
            "--line": mixColor(text, surface, dark ? 0.79 : 0.86),
            "--bg": colors.background,
            "--surface": surface,
            "--panel": panel,
            "--danger": dark ? "#ff7676" : "#d93025",
            "--warning-bg": dark ? mixColor("#332b12", surface, 0.12) : "#fff8e1",
            "--warning-border": dark ? "#8a7125" : "#f5d67b",
            "--warning-text": dark ? "#ffe08a" : "#6f5200",
            "--tooltip-text": contrastText(colors.primary),
            "--custom-color-scheme": dark ? "dark" : "light"
        } };
    }

    const CUSTOM_TOKEN_NAMES = Object.keys(customThemeTokens(DEFAULT_CUSTOM_COLORS).tokens);

    function setCustomThemeControls(colors, visible) {
        const normalized = normalizeCustomColors(colors);
        const controls = document.getElementById("siteCustomThemeControls");
        if (controls) controls.hidden = !visible;
        for (const [id, key] of [["siteCustomPrimary", "primary"], ["siteCustomSecondary", "secondary"], ["siteCustomBackground", "background"]]) {
            const input = document.getElementById(id); if (input && input.value.toLowerCase() !== normalized[key]) input.value = normalized[key];
        }
        const option = document.querySelector('[data-theme-option="custom"]');
        option?.style.setProperty("--custom-preview-primary", normalized.primary);
        option?.style.setProperty("--custom-preview-secondary", normalized.secondary);
        option?.style.setProperty("--custom-preview-background", normalized.background);
    }

    function themeFromStoredValue(value) {
        if (!value) return null;

        try {
            const saved = JSON.parse(value);
            return saved && ALLOWED_THEMES.includes(saved.theme) ? { theme: saved.theme, customColors: normalizeCustomColors(saved.customColors) } : null;
        } catch (error) {
            return null;
        }
    }

    function applyGlobalTheme(requestedTheme, persist = true, requestedCustomColors = null) {
        const theme = normalizeTheme(requestedTheme);
        if (requestedCustomColors) rememberedCustomColors = normalizeCustomColors(requestedCustomColors);
        const custom = customThemeTokens(rememberedCustomColors);

        CUSTOM_TOKEN_NAMES.forEach(name => document.documentElement.style.removeProperty(name));
        if (theme === "custom") Object.entries(custom.tokens).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));

        if (theme === "modern-blue") {
            document.documentElement.removeAttribute("data-theme");
            document.body.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", theme);
            document.body.setAttribute("data-theme", theme);
        }

        document.querySelectorAll('input[name="siteThemeChoice"]').forEach(input => {
            const selected = input.value === theme;
            input.checked = selected;
            const option = input.closest(".site-theme-option");
            if (option) option.classList.toggle("selected", selected);
        });

        setCustomThemeControls(custom.colors, theme === "custom");

        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement("meta");
            themeColorMeta.name = "theme-color";
            document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.content = theme === "custom" ? custom.colors.primary : BROWSER_THEME_COLORS[theme];

        if (persist) {
            let existing = {};
            try {
                const parsed = JSON.parse(storageGet(SITE_PREFERENCES_KEY));
                if (isPlainObject(parsed)) existing = parsed;
            } catch (error) {
                existing = {};
            }
            storageSet(SITE_PREFERENCES_KEY, JSON.stringify({ ...existing, version: 1, theme, customColors: custom.colors }));
        }
    }

    function focusableElements(container) {
        return [...container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter(element => element.offsetParent !== null);
    }

    function positionTooltip() {
        if (!activeTooltipTrigger || !tooltipElement || tooltipElement.hidden) return;

        const margin = 12;
        const gap = 9;
        const anchor = activeTooltipTrigger.getBoundingClientRect();
        const tooltip = tooltipElement.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const roomAbove = anchor.top - margin - gap;
        const roomBelow = viewportHeight - anchor.bottom - margin - gap;
        const placeAbove = tooltip.height <= roomAbove || roomAbove > roomBelow;
        const idealLeft = anchor.left + anchor.width / 2 - tooltip.width / 2;
        const left = Math.max(margin, Math.min(idealLeft, viewportWidth - margin - tooltip.width));
        const idealTop = placeAbove
            ? anchor.top - gap - tooltip.height
            : anchor.bottom + gap;
        const top = Math.max(margin, Math.min(idealTop, viewportHeight - margin - tooltip.height));
        const arrowLeft = Math.max(13, Math.min(anchor.left + anchor.width / 2 - left, tooltip.width - 13));

        tooltipElement.dataset.placement = placeAbove ? "above" : "below";
        tooltipElement.style.left = `${Math.round(left)}px`;
        tooltipElement.style.top = `${Math.round(top)}px`;
        tooltipElement.style.setProperty("--tooltip-arrow-left", `${Math.round(arrowLeft)}px`);
    }

    function scheduleTooltipPosition() {
        window.cancelAnimationFrame(tooltipFrame);
        tooltipFrame = window.requestAnimationFrame(positionTooltip);
    }

    function showTooltip(trigger, pinned = false) {
        const text = trigger.dataset.tooltip;
        if (!text || !tooltipElement) return;

        if (activeTooltipTrigger && activeTooltipTrigger !== trigger) {
            activeTooltipTrigger.setAttribute("aria-expanded", "false");
            activeTooltipTrigger.removeAttribute("aria-describedby");
        }

        activeTooltipTrigger = trigger;
        tooltipPinned = pinned;
        tooltipContent.textContent = text;
        tooltipElement.classList.toggle("warning", Boolean(trigger.closest(".mode-panel.active")));
        tooltipElement.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        trigger.setAttribute("aria-describedby", tooltipElement.id);
        scheduleTooltipPosition();
    }

    function hideTooltip(force = false) {
        if (!activeTooltipTrigger || !tooltipElement) return;
        if (tooltipPinned && !force) return;

        activeTooltipTrigger.setAttribute("aria-expanded", "false");
        activeTooltipTrigger.removeAttribute("aria-describedby");
        activeTooltipTrigger = null;
        tooltipPinned = false;
        tooltipElement.hidden = true;
    }

    function initTooltips() {
        const triggers = [...document.querySelectorAll("[data-tooltip]")];
        if (triggers.length === 0) return;

        tooltipElement = document.createElement("div");
        tooltipElement.id = "teacherToolsSharedTooltip";
        tooltipElement.className = "teacher-tools-tooltip";
        tooltipElement.setAttribute("role", "tooltip");
        tooltipElement.hidden = true;
        tooltipContent = document.createElement("div");
        tooltipContent.className = "teacher-tools-tooltip-content";
        tooltipElement.appendChild(tooltipContent);
        document.body.appendChild(tooltipElement);

        triggers.forEach(trigger => {
            trigger.setAttribute("aria-expanded", "false");
            trigger.addEventListener("pointerenter", () => showTooltip(trigger, false));
            trigger.addEventListener("pointerleave", () => hideTooltip());
            trigger.addEventListener("focus", () => showTooltip(trigger, false));
            trigger.addEventListener("blur", () => hideTooltip());
            trigger.addEventListener("click", event => {
                event.stopPropagation();
                if (activeTooltipTrigger === trigger && tooltipPinned) {
                    hideTooltip(true);
                } else {
                    showTooltip(trigger, true);
                }
            });
        });

        document.addEventListener("click", event => {
            if (activeTooltipTrigger && !activeTooltipTrigger.contains(event.target)) {
                hideTooltip(true);
            }
        });
        window.addEventListener("resize", scheduleTooltipPosition);
        window.addEventListener("scroll", scheduleTooltipPosition, true);
    }

    function closeModal(restoreFocus = true) {
        if (!activeModal) return;

        const modalToClose = activeModal;
        const opener = activeModalOpener;
        const firstUseKey = modalToClose.dataset.firstUseStorageKey;

        modalToClose.classList.remove("open");
        modalToClose.setAttribute("aria-hidden", "true");
        activeModal = null;
        activeModalOpener = null;
        document.body.classList.remove("modal-open");

        if (firstUseKey) {
            storageSet(firstUseKey, JSON.stringify({ version: 1, seen: true }));
        }

        if (restoreFocus && opener) opener.focus();
    }

    function openModal(modalOrId, opener = null) {
        const modal = typeof modalOrId === "string"
            ? document.getElementById(modalOrId)
            : modalOrId;
        if (!modal) return;

        if (activeModal) closeModal(false);
        closeSiteOverlays();
        activeModal = modal;
        activeModalOpener = opener;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        const preferredFocus = modal.querySelector("[data-modal-initial-focus]") || modal.querySelector(".close-button");
        if (preferredFocus) preferredFocus.focus();
    }

    registerTranslations({"en": {"offlineIndicator.online":"Online / connected. Offline mode is not enabled.", "offlineIndicator.ready":"Online / connected. Offline mode is active.", "offlineIndicator.offline-ready":"Offline / no connection. Offline mode is active.", "offlineIndicator.offline":"Offline / no connection. Offline mode is not enabled.", "offlineIndicator.update":"Update files are ready to apply.", "offlineIndicator.update-only":"Update files are ready to apply.", "offlineIndicator.preparing":"Downloading Offline files...", "offlineIndicator.incomplete":"Offline files are incomplete or could not be verified. Please download them again.", "offlineIndicator.update-error":"Update could not be verified; your current Offline copy is still available.", "offlineIndicator.checking":"Checking Offline files…", "offlineIndicator.unavailable":"Offline mode unavailable. Offline installation requires the hosted site or local server and service-worker support."}, "ja": {"offlineIndicator.online":"オンライン／接続中。オフラインモードは有効になっていません。", "offlineIndicator.ready":"オンライン／接続中。オフラインモードは有効です。", "offlineIndicator.offline-ready":"オフライン／未接続。オフラインモードは有効です。", "offlineIndicator.offline":"オフライン／未接続。オフラインモードは有効になっていません。", "offlineIndicator.update":"更新ファイルを適用する準備ができています。", "offlineIndicator.update-only":"更新ファイルを適用する準備ができています。", "offlineIndicator.preparing":"オフライン用ファイルをダウンロード中...", "offlineIndicator.incomplete":"オフライン用ファイルが不足しているか、確認できませんでした。もう一度ダウンロードしてください。", "offlineIndicator.update-error":"更新を確認できませんでした。現在のオフライン用ファイルは引き続き利用できます。", "offlineIndicator.checking":"オフライン用ファイルを確認中…", "offlineIndicator.unavailable":"オフラインモードを利用できません。オフラインのインストールには、公開サイトまたはローカルサーバーと、サービスワーカー対応ブラウザが必要です。"}});
    registerTranslations({en:{"offlineIndicator.reload":"A newer version is available. Please refresh to update."},ja:{"offlineIndicator.reload":"新しいバージョンがあります。再読み込みして更新してください。"}});
    function initOfflineIndicator() {
        const button = document.getElementById('siteOfflineStatusButton');
        if (!button) return;
        const supported = /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator;
        const state = {ready:false, update:false, reload:false, failed:false, checking:false, preparing:false, manualPreparing:false, busy:false, again:false};
        let registration = null, lastUpdateCheck = 0;
        const observed = new WeakSet();
        function render() {
            const online = navigator.onLine !== false;
            let key = !supported ? 'unavailable' : state.preparing ? 'preparing' : state.update ? (state.reload ? 'reload' : state.ready ? 'update' : 'update-only') : state.failed ? (state.ready ? 'update-error' : 'incomplete') : state.checking && !state.ready ? 'checking' : state.ready ? (online ? 'ready' : 'offline-ready') : online ? 'online' : 'offline';
            button.dataset.offlineState = key;
            button.dataset.connection = online ? 'online' : 'offline';
            const text = translate('offlineIndicator.'+key, key);
            button.title = text; button.setAttribute('aria-label', text);
        }
        function ask(worker) {
            if (!worker) return Promise.resolve({ready:false});
            return new Promise((resolve,reject) => {
                const channel = new MessageChannel();
                const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Offline status timeout')); }, 8000);
                channel.port1.onmessage = event => { if (event.data?.type === 'PROGRESS') return; clearTimeout(timer); channel.port1.close(); resolve(event.data); };
                try { worker.postMessage({type:'STATUS'}, [channel.port2]); } catch(error) { clearTimeout(timer); channel.port1.close(); reject(error); }
            });
        }
        function watch(worker) {
            if (!worker || observed.has(worker)) return;
            observed.add(worker); worker.addEventListener('statechange', () => refresh(false));
        }
        async function refresh(checkUpdates = false) {
            render();
            if (!supported || document.visibilityState === 'hidden') return;
            if (state.busy) { state.again = true; return; }
            state.busy = true;
            try {
                const reg = await navigator.serviceWorker.getRegistration('/');
                if (!reg) { state.ready=false; state.update=false; state.reload=false; state.failed=false; state.checking=false; state.preparing=state.manualPreparing; return; }
                if (registration !== reg) { registration=reg; reg.addEventListener('updatefound', () => { watch(reg.installing); refresh(false); }); }
                watch(reg.installing); watch(reg.waiting); watch(reg.active);
                state.checking = true; state.preparing = !!reg.installing || state.manualPreparing; render();
                const active = reg.active ? await ask(reg.active) : {ready:false};
                state.ready = active.ready === true;
                state.failed = !!reg.active && !state.ready;
                state.update = false; state.reload = false;
                if (reg.waiting) {
                    const waiting = await ask(reg.waiting);
                    state.update = waiting.ready === true;
                    state.failed ||= !state.update;
                } else {
                    const pageRelease = document.querySelector('meta[name="teacher-tools-release"]')?.content;
                    state.update = state.ready && !!pageRelease && active.release !== pageRelease;
                    state.reload = state.update;
                }
                state.preparing = !!reg.installing || state.manualPreparing;
                state.checking = false;
                // Never register a worker or request CACHE_NOW here: first visits remain online-only.
                if (checkUpdates && navigator.onLine !== false && Date.now()-lastUpdateCheck > 15*60*1000) {
                    lastUpdateCheck=Date.now();
                    reg.update().then(() => refresh(false)).catch(() => {});
                }
            } catch { state.ready=false; state.update=false; state.failed=true; state.checking=false; state.preparing=false; }
            finally { state.busy=false; render(); if(state.again){state.again=false; queueMicrotask(() => refresh(false));} }
        }
        window.addEventListener('online', () => refresh(true));
        window.addEventListener('offline', () => refresh(false));
        window.addEventListener('focus', () => refresh(true));
        window.addEventListener('teacher-tools:languagechange', render);
        window.addEventListener('teacher-tools:offlinechange', event => { state.manualPreparing=!!event.detail?.preparing; state.preparing=state.manualPreparing||!!registration?.installing; render(); if(!state.manualPreparing)refresh(false); });
        document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible')refresh(true); });
        if(supported)navigator.serviceWorker.addEventListener('controllerchange', () => refresh(false));
        setInterval(() => refresh(true), 120000);
        refresh(true);
    }

    function closeSiteOverlays() {
        const toolsMenu = document.getElementById("siteToolsMenu");
        const languagePanel = document.getElementById("siteLanguagePanel");
        const themePanel = document.getElementById("siteThemePanel");
        const languageButton = document.getElementById("siteLanguageButton");
        const settingsButton = document.getElementById("siteSettingsButton");
        const menuButtons = [
            document.getElementById("siteMobileMenuButton")
        ].filter(Boolean);

        if (toolsMenu) toolsMenu.hidden = true;
        if (languagePanel) languagePanel.hidden = true;
        if (themePanel) { if (themePanel.open) themePanel.close(); themePanel.hidden = true; }
        if (languageButton) languageButton.setAttribute("aria-expanded", "false");
        if (settingsButton) settingsButton.setAttribute("aria-expanded", "false");
        menuButtons.forEach(button => button.setAttribute("aria-expanded", "false"));
    }

    function initSiteHeader() {
        const siteHeader = document.querySelector("[data-teacher-tools-header]");
        if (!siteHeader) return;

        const toolsMenu = document.getElementById("siteToolsMenu");
        const menuButtons = [
            document.getElementById("siteMobileMenuButton")
        ].filter(Boolean);
        const languageButton = document.getElementById("siteLanguageButton");
        const languagePanel = document.getElementById("siteLanguagePanel");
        const languageCloseButton = document.getElementById("siteLanguageCloseButton");
        const languageChoice = document.getElementById("siteLanguageChoice");
        const settingsButton = document.getElementById("siteSettingsButton");
        const themePanel = document.getElementById("siteThemePanel");


        function setToolsMenu(open) {
            if (!toolsMenu) return;
            if (open) {
                if (languagePanel) languagePanel.hidden = true;
                if (themePanel) { if (themePanel.open) themePanel.close(); themePanel.hidden = true; }
                if (languageButton) languageButton.setAttribute("aria-expanded", "false");
                if (settingsButton) settingsButton.setAttribute("aria-expanded", "false");
            }
            toolsMenu.hidden = !open;
            menuButtons.forEach(button => button.setAttribute("aria-expanded", String(open)));
        }

        function setLanguagePanel(open) {
            if (!languagePanel || !languageButton) return;
            if (open) {
                setToolsMenu(false);
                if (themePanel) { if (themePanel.open) themePanel.close(); themePanel.hidden = true; }
                if (settingsButton) settingsButton.setAttribute("aria-expanded", "false");
            }
            languagePanel.hidden = !open;
            languageButton.setAttribute("aria-expanded", String(open));
            if (open && languageChoice) languageChoice.focus();
        }

        menuButtons.forEach(button => {
            // Compact trigger precedes the permanent actions. Tab follows DOM order;
            // ArrowDown explicitly enters its navigation panel.
            button.addEventListener("keydown", event => {
                if (event.key !== "ArrowDown" || !toolsMenu) return;
                event.preventDefault();
                setToolsMenu(true);
                toolsMenu.querySelector('a[href], button:not(:disabled)')?.focus();
            });
            button.addEventListener("click", event => {
                event.stopPropagation();
                setToolsMenu(toolsMenu ? toolsMenu.hidden : false);
            });
        });

        if (toolsMenu) toolsMenu.addEventListener("click", event => event.stopPropagation());

        if (languageButton) {
            languageButton.addEventListener("click", event => {
                event.stopPropagation();
                setLanguagePanel(languagePanel ? languagePanel.hidden : false);
            });
        }

        if (languageCloseButton) {
            languageCloseButton.addEventListener("click", () => {
                setLanguagePanel(false);
                languageButton.focus();
            });
        }

        if (languageChoice) {
            languageChoice.addEventListener("change", () => applyGlobalLanguage(languageChoice.value));
        }

        if (languagePanel) languagePanel.addEventListener("click", event => event.stopPropagation());

        document.addEventListener("click", closeSiteOverlays);
    }

    function initModals() {
        document.querySelectorAll("[data-modal-open]").forEach(button => {
            button.addEventListener("click", () => openModal(button.dataset.modalOpen, button));
        });

        document.querySelectorAll("[data-modal-close]").forEach(button => {
            button.addEventListener("click", () => closeModal());
        });

        document.querySelectorAll("[data-modal-switch]").forEach(button => {
            button.addEventListener("click", () => {
                closeModal(false);
                const targetId = button.dataset.modalSwitch;
                const targetOpener = document.querySelector(`[data-modal-open="${targetId}"]`);
                openModal(targetId, targetOpener);
            });
        });

        document.querySelectorAll("[data-shared-modal]").forEach(modal => {
            modal.addEventListener("click", event => {
                if (event.target === modal) closeModal();
            });
        });

        const firstUseModal = document.querySelector("[data-first-use-storage-key]");
        if (firstUseModal && !storageGet(firstUseModal.dataset.firstUseStorageKey)) {
            const opener = document.querySelector(`[data-modal-open="${firstUseModal.id}"]`);
            window.setTimeout(() => openModal(firstUseModal, opener), 0);
        }
    }

    document.addEventListener("keydown", event => {
        if (activeModal) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeModal();
                return;
            }

            if (event.key === "Tab") {
                const focusable = focusableElements(activeModal);
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
            return;
        }

        if (event.key !== "Escape") return;

        if (activeTooltipTrigger) {
            hideTooltip(true);
            return;
        }

        const languagePanel = document.getElementById("siteLanguagePanel");
        const themePanel = document.getElementById("siteThemePanel");
        const toolsMenu = document.getElementById("siteToolsMenu");
        const languageButton = document.getElementById("siteLanguageButton");
        const settingsButton = document.getElementById("siteSettingsButton");
        const menuButtons = [
            document.getElementById("siteMobileMenuButton")
        ].filter(Boolean);

        if (languagePanel && !languagePanel.hidden) {
            closeSiteOverlays();
            if (languageButton) languageButton.focus();
            return;
        }

        if (themePanel && !themePanel.hidden) {
            closeSiteOverlays();
            if (settingsButton) settingsButton.focus();
            return;
        }

        if (toolsMenu && !toolsMenu.hidden) {
            closeSiteOverlays();
            const visibleButton = menuButtons.find(button => button.offsetParent !== null);
            if (visibleButton) visibleButton.focus();
        }
    });

    window.addEventListener("storage", event => {
        if (event.key === SITE_PREFERENCES_KEY) {
            const saved = themeFromStoredValue(event.newValue);
            applyGlobalTheme(saved?.theme || "modern-blue", false, saved?.customColors);
        }
        if (event.key === SITE_LANGUAGE_KEY) {
            applyGlobalLanguage(languageFromStoredValue(event.newValue) || window.TeacherToolsLanguage.browserDefault(), false);
        }
    });

        const NOTE_MARKERS={
            G:{label:"Goal",svg:'<circle cx="12" cy="12" r="8.5"/><path d="m8 12 2.6 2.6L16.5 9"/>'},
            W:{label:"Watch",svg:'<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10.5" r="1.1" fill="currentColor" stroke="none"/>'},
            L:{label:"Listen",svg:'<path d="M5 13v-2a7 7 0 0 1 14 0v2"/><path d="M5 12.5H4a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 18.5h2v-6Zm14 0h1a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-2v-6Z"/>'},
            R:{label:"Read",svg:'<circle cx="12" cy="4.8" r="2.1"/><path d="M7.3 10.5c.8-2 2.4-3 4.7-3s3.9 1 4.7 3"/><path d="M12 12c-2.6-1.9-5.2-1.6-8-.6v6.8c3-.8 5.6-.4 8 1.6m0-7.8c2.6-1.9 5.2-1.6 8-.6v6.8c-3-.8-5.6-.4-8 1.6Z"/>'},
            S:{label:"Speak",svg:'<circle cx="8.5" cy="13" r="5.5"/><circle cx="6.7" cy="11.5" r=".65" fill="currentColor" stroke="none"/><circle cx="10.3" cy="11.5" r=".65" fill="currentColor" stroke="none"/><path d="M6.2 14.5c.5 2.2 4.1 2.2 4.6 0Z" fill="currentColor" stroke="none"/><path d="M14 4.5h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1.2l-2.7 2v-2H14a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z"/>'},
            LS:{label:"Let’s Sing",svg:'<path d="M16 4.5v11.8"/><path d="m16 5 4-1"/><ellipse cx="12.5" cy="17" rx="3.5" ry="2.5" transform="rotate(-12 12.5 17)" fill="currentColor" stroke="none"/>'},
            LC:{label:"Let’s Chant",svg:'<path d="M6.2 16.5h11.6l-1.3-1.8V10a4.5 4.5 0 0 0-9 0v4.7Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0M12 4V2.8"/>'},
            ST:{label:"Small Talk",svg:'<path d="M4 5.5h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-3.5 2.5v-2.5H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"/><path d="M16 9.5h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5V20L15 17.5h-3a2 2 0 0 1-2-2"/>'},
            P:{label:"Write",svg:'<path d="m5 16-.8 3.8L8 19l10.7-10.7-3-3Z"/><path d="m13.8 7.2 3 3M5 16l3 3"/>'},
            ES:{label:"Elementary School",svg:'<path d="M11.4 3.3Q12 2.5 12.6 3.3L14.7 6.2Q15.3 7 16.2 7.3L19.6 8.4Q20.6 8.7 20 9.5L17.9 12.4Q17.3 13.2 17.3 14.2L17.3 17.8Q17.3 18.8 16.3 18.5L13 17.4Q12 17.1 11 17.4L7.7 18.5Q6.7 18.8 6.7 17.8L6.7 14.2Q6.7 13.2 6.1 12.4L4 9.5Q3.4 8.7 4.4 8.4L7.8 7.3Q8.7 7 9.3 6.2Z"/><path d="M12 7.5v5.7q0 1-1.3 1.3M10 9.8l-1.4 2m5.4-2 1.4 2"/>'},
            D:{label:"Dictionary",svg:'<path d="M4 17V6a2 2 0 0 1 2-2h14v13H7c-1.7 0-3 1.2-3 2.1S5.3 20 7 20h13v-3M8 4v13"/>'},
            KS:{label:"Key Sentences",svg:'<path d="M12 11V8.5a3.5 3.5 0 0 1 7 0V11"/><rect x="10" y="11" width="11" height="9" rx="2"/><circle cx="5.3" cy="15.5" r="2.2"/><path d="M7.5 15.5h8m-3.2 0v2m2.2-2v2"/>'}
        };
        function circledNumber(number){
            if(number===0) return "⓪";
            if(number<=20) return String.fromCodePoint(0x2460+number-1);
            if(number<=35) return String.fromCodePoint(0x3251+number-21);
            if(number<=50) return String.fromCodePoint(0x32b1+number-36);
            return String(number)+"\u20dd";
        }

    // Only fixed marker artwork is HTML; user note content always becomes text nodes.
    function renderNoteLines(body,{readOnly=true,label='',markerLabel:labelMarker=code=>translate('note.marker.'+code,NOTE_MARKERS[code].label),checklistLabel='Checklist item',onToggle}={}){
        let offset=0, ordinal=0;
        return String(body||'').split('\n').map(line=>{
            const row=document.createElement('div');row.className='note-line';
            const pattern=/\[(x|X| |-)?\]|\[(\d{1,6})\]|\[(LS|LC|ST|ES|KS|G|W|L|R|S|P|D)\]/g;let last=0;
            for(const match of line.matchAll(pattern)){
                row.append(document.createTextNode(line.slice(last,match.index)));
                if(match[0]==='[-]')row.append(document.createTextNode('•'));
                else if(match[2]!==undefined)row.append(document.createTextNode(circledNumber(Number(match[2]))));
                else if(match[3]){
                    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('class','check-marker-icon');icon.setAttribute('role','img');icon.setAttribute('aria-label',labelMarker(match[3]));icon.innerHTML=NOTE_MARKERS[match[3]].svg;row.append(icon);
                }else{
                    const input=document.createElement('input');input.type='checkbox';input.checked=/x/i.test(match[0]);input.disabled=readOnly;
                    input.setAttribute('aria-label',[label,line.slice(match.index+match[0].length).trim()||checklistLabel].filter(Boolean).join(': '));
                    const position=offset+match.index,length=match[0].length,index=ordinal++;
                    if(!readOnly&&onToggle)input.addEventListener('change',()=>onToggle(position,length,input.checked,index));row.append(input);
                }
                last=match.index+match[0].length;
            }
            const boxes=[...row.querySelectorAll('input')];row.classList.toggle('complete',boxes.length>0&&boxes.every(box=>box.checked));
            row.append(document.createTextNode(line.slice(last)));offset+=line.length+1;return row;
        });
    }
    registerTranslations({en:Object.fromEntries(Object.entries(NOTE_MARKERS).map(([code,m])=>['note.marker.'+code,m.label])),ja:Object.fromEntries(Object.entries({G:'目標',W:'見る',L:'聞く',R:'読む',S:'話す',LS:'歌う',LC:'チャンツ',ST:'スモールトーク',P:'書く',ES:'小学校英語',D:'辞書',KS:'キーセンテンス'}).map(([code,label])=>['note.marker.'+code,label]))});
    window.TeacherToolsUI = Object.freeze({
        noteMarkers: Object.freeze(NOTE_MARKERS),
        renderNoteLines,
        applyGlobalTheme,
        resetCustomTheme: () => applyGlobalTheme("custom", true, DEFAULT_CUSTOM_COLORS),
        closeSiteOverlays,
        refreshSiteData: () => { updateSiteDataSummary(); setSiteDataStatus(""); updateLinkedDataControls(); },
        applyGlobalLanguage,
        closeModal,
        openModal,
        registerTranslations,
        storageGet,
        storageSet,
        translate
    });

    const initialTheme = themeFromStoredValue(storageGet(SITE_PREFERENCES_KEY));
    applyGlobalTheme(initialTheme?.theme || document.documentElement.getAttribute("data-theme") || "modern-blue", false, initialTheme?.customColors);
    applyGlobalLanguage(
        languageFromStoredValue(storageGet(SITE_LANGUAGE_KEY)) ||
        document.documentElement.lang ||
        "en",
        false
    );
    initSiteHeader();
    initOfflineIndicator();
    initSiteDataBackup();
    initModals();
    initTooltips();
})();
})();

/* teacher-tools-release: teacher-tools-2026-11-20-offline-notice-1 */

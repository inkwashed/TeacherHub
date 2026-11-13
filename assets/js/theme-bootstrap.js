(() => {
    const key = "teacherTools.sitePreferences.v1";
    const languageKey = "teacherTools.siteLanguage.v1";
    // Browser preferences are the web-visible system language settings.
    // Shared with the runtime so clearing a saved choice restores this default.
    const browserDefault = () => {
        const browser = typeof navigator === "undefined" ? {} : navigator;
        const preferences = [...(browser.languages || []), browser.language];
        return preferences.filter(value => typeof value === "string")
            .map(value => value.toLowerCase().split(/[-_]/)[0])
            .find(value => ["en", "ja"].includes(value)) || "en";
    };
    window.TeacherToolsLanguage = Object.freeze({ browserDefault });
    const themes = ["modern-blue", "ocean-blue", "color-pop", "pretty-in-pink", "true-dark", "custom"];
    const themeColors = { "modern-blue": "#294f70", "ocean-blue": "#1e40af", "color-pop": "#8b5cf6", "pretty-in-pink": "#db2777", "true-dark": "#15191e" };
    let browserThemeColor = themeColors["modern-blue"];

    try {
        const saved = JSON.parse(localStorage.getItem(key));
        const theme = saved && themes.includes(saved.theme) ? saved.theme : "modern-blue";
        browserThemeColor = themeColors[theme] || browserThemeColor;
        if (theme !== "modern-blue") document.documentElement.setAttribute("data-theme", theme);
        if (theme === "custom") {
            const valid = value => /^#[0-9a-f]{6}$/i.test(value || "");
            const colors = {
                primary: valid(saved.customColors?.primary) ? saved.customColors.primary.toLowerCase() : "#2563eb",
                secondary: valid(saved.customColors?.secondary) ? saved.customColors.secondary.toLowerCase() : "#7c3aed",
                background: valid(saved.customColors?.background) ? saved.customColors.background.toLowerCase() : "#f5f8ff"
            };
            browserThemeColor = colors.primary;
            const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
            const hex = values => `#${values.map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
            const mix = (a, b, amount) => hex(rgb(a).map((value, index) => value + (rgb(b)[index] - value) * amount));
            const lum = value => { const channels = rgb(value).map(item => { const part = item / 255; return part <= .04045 ? part / 12.92 : ((part + .055) / 1.055) ** 2.4; }); return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]; };
            const contrastText = value => 1.05 / (lum(value) + .05) >= (lum(value) + .05) / .05 ? "#ffffff" : "#111827";
            const dark = lum(colors.background) < .3, surface = mix(colors.background, "#ffffff", dark ? .075 : .88), panel = mix(colors.background, surface, dark ? .42 : .68), text = dark ? "#f3f6fa" : "#24282d";
            const tokens = { "--accent": colors.primary, "--accent-secondary": colors.secondary, "--accent-soft": mix(colors.primary, surface, dark ? .78 : .84), "--accent-border": mix(colors.primary, surface, dark ? .52 : .58), "--focus-ring": `${colors.primary}3d`, "--accent-contrast": contrastText(colors.primary), "--text": text, "--muted": mix(text, surface, dark ? .48 : .42), "--line": mix(text, surface, dark ? .79 : .86), "--bg": colors.background, "--surface": surface, "--panel": panel, "--danger": dark ? "#ff7676" : "#d93025", "--warning-bg": dark ? mix("#332b12", surface, .12) : "#fff8e1", "--warning-border": dark ? "#8a7125" : "#f5d67b", "--warning-text": dark ? "#ffe08a" : "#6f5200", "--tooltip-text": contrastText(colors.primary), "--custom-color-scheme": dark ? "dark" : "light" };
            Object.entries(tokens).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
        }
    } catch (error) {
        // Modern Blue remains the safe default when storage is unavailable.
    }

    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement("meta");
        themeColorMeta.name = "theme-color";
        document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = browserThemeColor;

    try {
        const saved = JSON.parse(localStorage.getItem(languageKey));
        document.documentElement.lang = saved && ["en", "ja"].includes(saved.language)
            ? saved.language
            : browserDefault();
    } catch (error) {
        document.documentElement.lang = browserDefault();
    }
})();

/* teacher-tools-release: teacher-tools-2026-11-13-rounded-wheel-font-1 */

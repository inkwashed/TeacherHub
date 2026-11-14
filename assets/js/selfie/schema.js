/* Versioned, frozen catalog snapshot; see docs/selfie-transfer.md. */
(() => {
'use strict';
const catalog = {
  "schemaVersion": 1,
  "fields": {
    "face": {
      "type": "string",
      "enum": [
        "classic",
        "round",
        "slim"
      ]
    },
    "eyes": {
      "type": "string",
      "enum": [
        "cheerful",
        "angry",
        "worried",
        "sleepy",
        "happy",
        "heart",
        "starry",
        "mixed"
      ]
    },
    "eyeStyle": {
      "type": "string",
      "enum": [
        "basic",
        "eyelashes"
      ]
    },
    "nose": {
      "type": "string",
      "enum": [
        "small",
        "largerArch",
        "tinyWedge",
        "softHook",
        "buttonCurve",
        "none"
      ]
    },
    "mouth": {
      "type": "string",
      "enum": [
        "neutral",
        "closedSmile",
        "smile",
        "teethSmile",
        "smirk",
        "surprisedO",
        "frown"
      ]
    },
    "hair": {
      "type": "string",
      "enum": [
        "tousled",
        "curly",
        "centerPart",
        "longBangs",
        "none"
      ]
    },
    "clothes": {
      "type": "string",
      "enum": [
        "tee",
        "pointedCollar",
        "roundedCollar"
      ]
    },
    "accessories": {
      "type": "string",
      "enum": [
        "none"
      ]
    },
    "skin": {
      "type": "string",
      "enum": [
        "#f8ddc4",
        "#f8cfa9",
        "#dca577",
        "#b6845d",
        "#845d40",
        "#573f31"
      ]
    },
    "hairColor": {
      "type": "string",
      "pattern": "^#[0-9a-fA-F]{6}$"
    },
    "eyeColor": {
      "type": "string",
      "pattern": "^#[0-9a-fA-F]{6}$"
    },
    "shirtColor": {
      "type": "string",
      "pattern": "^#[0-9a-fA-F]{6}$"
    },
    "background": {
      "type": "string",
      "enum": [
        "#dcebe4",
        "#f3dfd7",
        "#e1e8f3",
        "#eee1f1",
        "#f3e9c9",
        "#fffefa"
      ]
    }
  },
  "defaults": {
    "face": "classic",
    "eyes": "cheerful",
    "eyeStyle": "basic",
    "nose": "small",
    "mouth": "smile",
    "hair": "tousled",
    "clothes": "tee",
    "accessories": "none",
    "skin": "#f8cfa9",
    "hairColor": "#503529",
    "eyeColor": "#9b6643",
    "shirtColor": "#5d9698",
    "background": "#dcebe4"
  }
};
const plain = value => !!value && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
function normalize(avatar) {
    if (!exact(avatar, ['schemaVersion','choices']) || avatar.schemaVersion !== 1 || !exact(avatar.choices, Object.keys(catalog.fields))) return null;
    const choices = {};
    for (const [key, rule] of Object.entries(catalog.fields)) {
        let value = avatar.choices[key];
        if (typeof value !== 'string' || value.length > 32) return null;
        if (rule.pattern ? !/^#[0-9a-f]{6}$/i.test(value) : !rule.enum.includes(value)) return null;
        if (rule.pattern) value = value.toLowerCase();
        choices[key] = value;
    }
    return {schemaVersion:1, choices};
}
// Transfer accepts the current sender's exact choice map, while storage/backups
// retain the canonical versioned record and the same strict catalog validation.
const normalizeTransfer = avatar => normalize(avatar) || normalize({schemaVersion:1, choices:avatar});
const validProfile = value => plain(value) && typeof value.name === 'string' && value.name.length <= 80 && (value.avatar === undefined || value.avatar === '') && (value.selfie === undefined || !!normalize(value.selfie));
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
window.TeacherToolsSelfieSchema = Object.freeze({normalize,normalizeTransfer,validProfile,catalog:freeze(catalog)});
})();

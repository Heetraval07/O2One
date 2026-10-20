import { HttpError } from './http.js';

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{6,24}$/;
// Strip control characters (except newline and tab) from free text.
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Validate a plain object against a small schema and return clean values.
 * Throws HttpError(422) with per-field messages when anything is wrong.
 *
 * Field rules: { type: 'string'|'boolean'|'stringArray', required, min, max,
 *                format: 'email'|'phone'|'slug'|'datetime', oneOf: [...], label, items: [...] }
 */
export function validate(input, schema) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  const errors = {};

  for (const [key, rule] of Object.entries(schema)) {
    const label = rule.label || key;
    let value = src[key];

    if (rule.type === 'boolean') {
      out[key] = value === true || value === 'true' || value === 'on';
      continue;
    }

    if (rule.type === 'stringArray') {
      if (value == null) value = [];
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
        errors[key] = `${label} must be a list.`;
        continue;
      }
      const clean = [...new Set(value.map((v) => v.trim()))].filter(Boolean);
      if (rule.items && clean.some((v) => !rule.items.includes(v))) {
        errors[key] = `${label} contains an unknown option.`;
        continue;
      }
      if (rule.max && clean.length > rule.max) {
        errors[key] = `${label} has too many items.`;
        continue;
      }
      out[key] = clean;
      continue;
    }

    // strings
    if (value == null) value = '';
    if (typeof value !== 'string' && typeof value !== 'number') {
      errors[key] = `${label} is not valid.`;
      continue;
    }
    value = String(value).replace(CONTROL_RE, '').trim();
    if (rule.collapse !== false && !rule.multiline) value = value.replace(/\s+/g, ' ');

    if (!value) {
      if (rule.required) errors[key] = `Please enter your ${label.toLowerCase()}.`;
      else out[key] = rule.default ?? null;
      continue;
    }
    if (rule.min && value.length < rule.min) {
      errors[key] = `${label} looks too short.`;
      continue;
    }
    if (rule.max && value.length > rule.max) {
      errors[key] = `${label} must be ${rule.max} characters or fewer.`;
      continue;
    }
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors[key] = `Please choose a valid ${label.toLowerCase()}.`;
      continue;
    }
    if (rule.format === 'email') {
      value = value.toLowerCase();
      if (!EMAIL_RE.test(value)) {
        errors[key] = 'Enter a full email address, like name@company.com.';
        continue;
      }
    }
    if (rule.format === 'phone' && !PHONE_RE.test(value)) {
      errors[key] = 'Enter a phone number with country code, like +971 50 123 4567.';
      continue;
    }
    if (rule.format === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      errors[key] = `${label} is not valid.`;
      continue;
    }
    if (rule.format === 'datetime') {
      const d = new Date(value);
      if (Number.isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        errors[key] = `Please choose a valid ${label.toLowerCase()}.`;
        continue;
      }
      value = d;
    }
    out[key] = value;
  }

  if (Object.keys(errors).length) {
    throw new HttpError(422, 'Please check the highlighted fields.', errors);
  }
  return out;
}

/** Parse a positive integer query param with bounds. */
export function intParam(raw, { min = 1, max = 100, fallback }) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Escape LIKE wildcards in user search text. */
export function likeEscape(text) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

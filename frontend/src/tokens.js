// ─── GUILDSPACE DESIGN TOKENS ─────────────────────────────────────────────────
// Colour Scheme: Midnight Slate + Electric Violet
// Deep navy backgrounds, violet accent, clean white surfaces

export const C = {
  // Primary accent — Electric Violet
  accent:      '#7C3AED',
  accentLight: '#EDE9FE',
  accentMid:   '#A78BFA',
  accentDark:  '#4C1D95',
  accentBorder:'rgba(124,58,237,0.35)',

  // Background system — Midnight Slate
  bg:          '#0F0F1A',   // page background
  bgCard:      '#16162A',   // card surface
  bgElevated:  '#1E1E35',   // elevated panels / sidebar
  bgInput:     '#1A1A30',   // form inputs
  bgHover:     '#22223A',   // hover states

  // Text
  textPrimary: '#F0EFFE',   // near-white
  textSec:     '#9F9EC5',   // muted violet-grey
  textHint:    '#5E5D80',   // very muted

  // Borders
  border:      'rgba(124,58,237,0.12)',
  borderMid:   'rgba(124,58,237,0.25)',
  borderBright:'rgba(124,58,237,0.5)',

  // Semantic
  success:     '#10B981',
  successLight:'rgba(16,185,129,0.12)',
  successBorder:'rgba(16,185,129,0.35)',

  danger:      '#EF4444',
  dangerLight: 'rgba(239,68,68,0.12)',
  dangerBorder:'rgba(239,68,68,0.3)',

  warning:     '#F59E0B',
  warningLight:'rgba(245,158,11,0.12)',

  info:        '#3B82F6',
  infoLight:   'rgba(59,130,246,0.12)',

  // Domain colours (for post category badges)
  domainResearch:  '#7C3AED',
  domainTech:      '#3B82F6',
  domainDesign:    '#EC4899',
  domainScience:   '#10B981',
  domainSocial:    '#F59E0B',
};

export const domainColor = (domain) => ({
  Research:    C.accent,
  'Tech / Dev':C.info,
  Design:      '#EC4899',
  Science:     C.success,
  'Social / NGO': C.warning,
}[domain] || C.accent);

export const FONTS = {
  display: "'Syne', sans-serif",    // bold geometric display
  body:    "'DM Sans', sans-serif",
};
/** Chat bubble themes. Keys must match the backend's allowed chat_theme values. */
export const CHAT_THEMES = {
  default: { label: 'Crimson', mine: 'bg-red-500', swatch: 'bg-red-500', meta: 'text-red-100/80' },
  ocean: { label: 'Ocean', mine: 'bg-sky-600', swatch: 'bg-sky-600', meta: 'text-sky-100/80' },
  forest: { label: 'Forest', mine: 'bg-emerald-600', swatch: 'bg-emerald-600', meta: 'text-emerald-100/80' },
  violet: { label: 'Violet', mine: 'bg-violet-600', swatch: 'bg-violet-600', meta: 'text-violet-100/80' },
};

export const getTheme = (key) => CHAT_THEMES[key] || CHAT_THEMES.default;

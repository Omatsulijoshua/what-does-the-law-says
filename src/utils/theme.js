export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function getInitialTheme() {
  const saved = localStorage.getItem('nigerian_law_theme');
  return ['light', 'dark'].includes(saved) ? saved : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

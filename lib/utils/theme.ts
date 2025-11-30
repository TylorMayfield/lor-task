// Utility functions for theme colors

export function getThemeClasses(color: string) {
  // For now, we'll use inline styles with CSS variables
  // This allows dynamic color changes without rebuilding Tailwind classes
  return {
    bg: `bg-[${color}]`,
    hover: `hover:bg-[${darkenColor(color, 10)}]`,
    text: `text-[${color}]`,
    border: `border-[${color}]`,
  };
}

export function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - percent * 2.55);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent * 2.55);
  const b = Math.max(0, (num & 0xff) - percent * 2.55);
  return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}

export function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent * 2.55);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent * 2.55);
  const b = Math.min(255, (num & 0xff) + percent * 2.55);
  return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}


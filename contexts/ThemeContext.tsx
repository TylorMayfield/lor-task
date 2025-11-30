'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState('#3b82f6'); // Default blue

  useEffect(() => {
    // Load color from preferences
    const loadColor = async () => {
      try {
        const res = await fetch('/api/preferences');
        const data = await res.json();
        if (data.preferences?.primaryColor) {
          const color = data.preferences.primaryColor;
          setPrimaryColorState(color);
        } else {
          // Set default if not found
          setPrimaryColorState('#3b82f6');
        }
      } catch (error) {
        console.error('Failed to load theme color:', error);
        // Set default color
        setPrimaryColorState('#3b82f6');
      }
    };
    loadColor();
  }, []);

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', color);
    // Calculate hover color (darker shade)
    const hoverColor = darkenColor(color, 10);
    document.documentElement.style.setProperty('--primary-color-hover', hoverColor);
    // Calculate light background (lighter for gradient)
    const lightColor = lightenColor(color, 95);
    document.documentElement.style.setProperty('--primary-color-light', lightColor);
  };

  useEffect(() => {
    setPrimaryColor(primaryColor);
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to darken a color
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - percent * 2.55);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent * 2.55);
  const b = Math.max(0, (num & 0xff) - percent * 2.55);
  return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}

// Helper function to lighten a color
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent * 2.55);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent * 2.55);
  const b = Math.min(255, (num & 0xff) + percent * 2.55);
  return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}


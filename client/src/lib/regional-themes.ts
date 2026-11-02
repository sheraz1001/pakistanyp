// Regional Color Palette and Theme System for Pakistan Provinces
export interface RegionalTheme {
  id: string;
  name: string;
  province: string;
  description: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    destructive: string;
    destructiveForeground: string;
  };
  gradients: {
    hero: string;
    card: string;
    button: string;
  };
  culturalElements: {
    pattern: string;
    symbols: string[];
    typography: string;
  };
}

// Pakistani Provinces Regional Themes
export const regionalThemes: Record<string, RegionalTheme> = {
  'lahore': {
    id: 'lahore',
    name: 'Lahore Elegance',
    province: 'Lahore',
    description: 'Sophisticated gold and deep blue reflecting the capital\'s luxury and heritage',
    colors: {
      primary: '41 65 115', // Deep Royal Blue
      primaryForeground: '255 255 255',
      secondary: '218 165 32', // Golden Rod
      secondaryForeground: '0 0 0',
      accent: '139 69 19', // Saddle Brown (heritage)
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '41 65 115',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(41, 65, 115) 0%, rgb(218, 165, 32) 100%)',
      card: 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(241, 245, 249) 100%)',
      button: 'linear-gradient(135deg, rgb(41, 65, 115) 0%, rgb(29, 78, 216) 100%)',
    },
    culturalElements: {
      pattern: 'geometric-islamic',
      symbols: ['falcon', 'palm-tree', 'dhow'],
      typography: 'elegant-serif',
    },
  },

  'karachi': {
    id: 'karachi',
    name: 'Karachi Innovation',
    province: 'Karachi',
    description: 'Modern turquoise and silver representing innovation and futuristic vision',
    colors: {
      primary: '0 188 212', // Turquoise
      primaryForeground: '255 255 255',
      secondary: '192 192 192', // Silver
      secondaryForeground: '0 0 0',
      accent: '255 69 0', // Red Orange (energy)
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '0 188 212',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(0, 188, 212) 0%, rgb(255, 69, 0) 100%)',
      card: 'linear-gradient(135deg, rgb(224, 242, 254) 0%, rgb(186, 230, 253) 100%)',
      button: 'linear-gradient(135deg, rgb(0, 188, 212) 0%, rgb(6, 182, 212) 100%)',
    },
    culturalElements: {
      pattern: 'modern-geometric',
      symbols: ['port', 'diamond', 'rocket'],
      typography: 'modern-sans',
    },
  },

  'islamabad': {
    id: 'islamabad',
    name: 'Islamabad Heritage',
    province: 'Islamabad',
    description: 'Rich emerald and terracotta celebrating culture and learning',
    colors: {
      primary: '34 139 34', // Forest Green
      primaryForeground: '255 255 255',
      secondary: '205 92 92', // Pakistani Red/Terracotta
      secondaryForeground: '255 255 255',
      accent: '184 134 11', // Dark Goldenrod
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '34 139 34',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(34, 139, 34) 0%, rgb(205, 92, 92) 100%)',
      card: 'linear-gradient(135deg, rgb(240, 253, 244) 0%, rgb(220, 252, 231) 100%)',
      button: 'linear-gradient(135deg, rgb(34, 139, 34) 0%, rgb(21, 128, 61) 100%)',
    },
    culturalElements: {
      pattern: 'arabic-calligraphy',
      symbols: ['book', 'mosque', 'pen'],
      typography: 'cultural-serif',
    },
  },

  'rawalpindi': {
    id: 'rawalpindi',
    name: 'Rawalpindi Serenity',
    province: 'Rawalpindi',
    description: 'Peaceful coral and soft blue reflecting coastal tranquility',
    colors: {
      primary: '70 130 180', // Steel Blue
      primaryForeground: '255 255 255',
      secondary: '255 127 80', // Coral
      secondaryForeground: '0 0 0',
      accent: '32 178 170', // Light Sea Green
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '70 130 180',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(70, 130, 180) 0%, rgb(255, 127, 80) 100%)',
      card: 'linear-gradient(135deg, rgb(240, 249, 255) 0%, rgb(224, 242, 254) 100%)',
      button: 'linear-gradient(135deg, rgb(70, 130, 180) 0%, rgb(59, 130, 246) 100%)',
    },
    culturalElements: {
      pattern: 'wave-patterns',
      symbols: ['anchor', 'seashell', 'lighthouse'],
      typography: 'coastal-sans',
    },
  },

  'faisalabad': {
    id: 'faisalabad',
    name: 'RAK Adventure',
    province: 'Faisalabad',
    description: 'Bold orange and mountain green for adventure and nature',
    colors: {
      primary: '34 197 94', // Green
      primaryForeground: '255 255 255',
      secondary: '249 115 22', // Orange
      secondaryForeground: '255 255 255',
      accent: '139 69 19', // Saddle Brown (mountains)
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '34 197 94',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(249, 115, 22) 100%)',
      card: 'linear-gradient(135deg, rgb(240, 253, 244) 0%, rgb(254, 249, 195) 100%)',
      button: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)',
    },
    culturalElements: {
      pattern: 'mountain-peaks',
      symbols: ['mountain', 'zipline', 'eagle'],
      typography: 'adventure-bold',
    },
  },

  'peshawar': {
    id: 'peshawar',
    name: 'Peshawar Coast',
    province: 'Peshawar',
    description: 'Ocean blue and pearl white for the eastern coastal beauty',
    colors: {
      primary: '30 144 255', // Dodger Blue
      primaryForeground: '255 255 255',
      secondary: '255 250 240', // Floral White (pearl)
      secondaryForeground: '0 0 0',
      accent: '0 128 128', // Teal
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '30 144 255',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(30, 144, 255) 0%, rgb(0, 128, 128) 100%)',
      card: 'linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 100%)',
      button: 'linear-gradient(135deg, rgb(30, 144, 255) 0%, rgb(59, 130, 246) 100%)',
    },
    culturalElements: {
      pattern: 'ocean-waves',
      symbols: ['fish', 'coral', 'diving-mask'],
      typography: 'coastal-rounded',
    },
  },

  'multan': {
    id: 'multan',
    name: 'UAQ Lagoon',
    province: 'Multan',
    description: 'Tranquil teal and warm sand for lagoon serenity',
    colors: {
      primary: '20 184 166', // Teal
      primaryForeground: '255 255 255',
      secondary: '222 184 135', // Burlywood (sand)
      secondaryForeground: '0 0 0',
      accent: '72 187 120', // Medium Sea Green
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '20 184 166',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(222, 184, 135) 100%)',
      card: 'linear-gradient(135deg, rgb(240, 253, 250) 0%, rgb(204, 251, 241) 100%)',
      button: 'linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(13, 148, 136) 100%)',
    },
    culturalElements: {
      pattern: 'lagoon-ripples',
      symbols: ['flamingo', 'mangrove', 'kayak'],
      typography: 'lagoon-script',
    },
  },

  'pk-national': {
    id: 'pk-national',
    name: 'Pakistani National',
    province: 'Pakistan',
    description: 'Official Pakistani flag colors - red, green, white, and black',
    colors: {
      primary: '220 38 38', // Red
      primaryForeground: '255 255 255',
      secondary: '34 197 94', // Green
      secondaryForeground: '255 255 255',
      accent: '0 0 0', // Black
      accentForeground: '255 255 255',
      muted: '248 250 252',
      mutedForeground: '100 116 139',
      background: '255 255 255',
      foreground: '15 23 42',
      card: '255 255 255',
      cardForeground: '15 23 42',
      border: '226 232 240',
      input: '226 232 240',
      ring: '220 38 38',
      destructive: '220 38 38',
      destructiveForeground: '255 255 255',
    },
    gradients: {
      hero: 'linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(34, 197, 94) 100%)',
      card: 'linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(248, 250, 252) 100%)',
      button: 'linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(185, 28, 28) 100%)',
    },
    culturalElements: {
      pattern: 'national-pride',
      symbols: ['pk-flag', 'falcon', 'date-palm'],
      typography: 'national-bold',
    },
  },
};

// Default theme (current PakistanYP theme)
export const defaultTheme: RegionalTheme = {
  id: 'default',
  name: 'PakistanYP Default',
  province: 'Default',
  description: 'Original PakistanYP theme with blue and orange accents',
  colors: {
    primary: '59 130 246', // Blue
    primaryForeground: '255 255 255',
    secondary: '249 115 22', // Orange
    secondaryForeground: '255 255 255',
    accent: '99 102 241', // Indigo
    accentForeground: '255 255 255',
    muted: '248 250 252',
    mutedForeground: '100 116 139',
    background: '255 255 255',
    foreground: '15 23 42',
    card: '255 255 255',
    cardForeground: '15 23 42',
    border: '226 232 240',
    input: '226 232 240',
    ring: '59 130 246',
    destructive: '220 38 38',
    destructiveForeground: '255 255 255',
  },
  gradients: {
    hero: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(249, 115, 22) 100%)',
    card: 'linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(241, 245, 249) 100%)',
    button: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(29, 78, 216) 100%)',
  },
  culturalElements: {
    pattern: 'modern-clean',
    symbols: ['globe', 'star', 'building'],
    typography: 'clean-sans',
  },
};

// Theme utilities
export const getAllThemes = (): RegionalTheme[] => {
  return [defaultTheme, ...Object.values(regionalThemes)];
};

export const getThemeById = (themeId: string): RegionalTheme => {
  if (themeId === 'default') return defaultTheme;
  return regionalThemes[themeId] || defaultTheme;
};

export const getThemeByProvince = (province: string): RegionalTheme => {
  const provinceKey = province.toLowerCase().replace(/\s+/g, '-');
  return regionalThemes[provinceKey] || defaultTheme;
};

// Apply theme to CSS variables
export const applyTheme = (theme: RegionalTheme): void => {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Apply gradient variables
  Object.entries(theme.gradients).forEach(([key, value]) => {
    const cssVar = `--gradient-${key}`;
    root.style.setProperty(cssVar, value);
  });

  // Store current theme in localStorage
  localStorage.setItem('regional-theme', theme.id);
};

// Get stored theme preference
export const getStoredTheme = (): string => {
  return localStorage.getItem('regional-theme') || 'default';
};

// Auto-detect theme based on user location/preference
export const detectRegionalTheme = (province?: string): RegionalTheme => {
  if (province) {
    return getThemeByProvince(province);
  }
  
  // Try to get from stored preference
  const storedThemeId = getStoredTheme();
  return getThemeById(storedThemeId);
};
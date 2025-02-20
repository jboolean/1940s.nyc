import * as React from 'react';

type ColorTheme = 'light' | 'dark';

export const ColorThemeContext = React.createContext<ColorTheme>('light');

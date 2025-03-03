import React, { createContext, useState, useContext } from 'react';
import { theme as defaultTheme } from '../theme';

interface ThemeContextType {
  theme: typeof defaultTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(defaultTheme);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement dark mode theme changes
    // For now, we'll just use the default theme
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
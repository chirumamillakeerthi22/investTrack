import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'investtrack-theme';

function getInitialTheme() {
  const savedTheme =
    localStorage.getItem(STORAGE_KEY);

  if (
    savedTheme === 'light' ||
    savedTheme === 'dark' ||
    savedTheme === 'system'
  ) {
    return savedTheme;
  }

  return 'system';
}

function getSystemTheme() {
  return window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  children,
}) {
  const [theme, setTheme] =
    useState(getInitialTheme);

  const [systemTheme, setSystemTheme] =
    useState(getSystemTheme);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      theme
    );

    const root =
      document.documentElement;

    const activeTheme =
      theme === 'system'
        ? systemTheme
        : theme;

    root.setAttribute(
      'data-theme',
      activeTheme
    );

    root.setAttribute(
      'data-theme-preference',
      theme
    );
  }, [theme, systemTheme]);

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      );

    function handleSystemThemeChange(
      event
    ) {
      setSystemTheme(
        event.matches
          ? 'dark'
          : 'light'
      );
    }

    mediaQuery.addEventListener(
      'change',
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleSystemThemeChange
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      systemTheme,
      activeTheme:
        theme === 'system'
          ? systemTheme
          : theme,
    }),
    [
      theme,
      systemTheme,
    ]
  );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider.'
    );
  }

  return context;
}
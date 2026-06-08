import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/apiClient";
import { ThemeDefinition, UserProfile } from "../types/domain";

interface AppContextValue {
  language: string;
  setLanguage: (language: string) => void;
  theme: ThemeDefinition;
  setThemeId: (themeId: string) => void;
  themes: ThemeDefinition[];
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const themes: ThemeDefinition[] = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" }
];

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguage] = useState(localStorage.getItem("language") ?? "es");
  const [themeId, setThemeId] = useState(localStorage.getItem("themeId") ?? "light");
  const [user, setUser] = useState<UserProfile | null>(null);
  const theme = themes.find((item) => item.id === themeId) ?? themes[0];

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id;
    localStorage.setItem("themeId", theme.id);
  }, [theme.id]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    apiClient.getCurrentUser().then(setUser).catch(() => undefined);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      themes,
      setThemeId,
      user,
      login: async (email: string, password: string) => setUser(await apiClient.login(email, password)),
      logout: () => {
        apiClient.setAccessToken(null);
        setUser(null);
      }
    }),
    [language, theme, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext is not available");
  return context;
}

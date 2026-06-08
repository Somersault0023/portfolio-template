import { BookOpen, Moon, PenLine, Sun } from "lucide-react";
import { useAppContext } from "../context/AppContext";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "biography", label: "Biografía" },
  { id: "library", label: "Biblioteca" },
  { id: "blog", label: "Blog" },
  { id: "press", label: "Prensa" },
  { id: "events", label: "Eventos" },
  { id: "contact", label: "Contacto" },
  { id: "admin", label: "Admin" }
];

export function Header({ activeTab, onTabChange }: HeaderProps): JSX.Element {
  const { language, setLanguage, theme, setThemeId } = useAppContext();
  const nextTheme = theme.id === "light" ? "dark" : "light";

  return (
    <header className="siteHeader">
      <button className="brandButton" onClick={() => onTabChange("biography")} aria-label="Inicio">
        <BookOpen size={26} />
        <span>
          <strong>Author Name</strong>
          <small>Fiction writer portfolio</small>
        </span>
      </button>
      <nav className="tabs" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => onTabChange(tab.id)}>
            {tab.id === "admin" && <PenLine size={16} />}
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="headerActions">
        <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Idioma">
          <option value="es">ES</option>
          <option value="en">EN</option>
          <option value="fr">FR</option>
        </select>
        <button className="iconButton" onClick={() => setThemeId(nextTheme)} title="Cambiar tema">
          {theme.id === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}

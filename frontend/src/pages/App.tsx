import { useEffect, useState } from "react";
import { ArrowRight, Feather, Quote, Sparkles } from "lucide-react";
import { apiClient } from "../api/apiClient";
import { ContentCard } from "../components/ContentCard";
import { Header } from "../components/Header";
import { AdminPage } from "./AdminPage";
import { DetailPage } from "./DetailPage";
import { useAppContext } from "../context/AppContext";
import { ContentItem, ContentType } from "../types/domain";
import { getTranslation } from "../utils/content";

const tabToType: Record<string, ContentType | null> = {
  biography: "biography",
  library: "work",
  blog: "blog",
  press: "press",
  events: "event",
  contact: "contact",
  admin: null
};

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState("biography");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const { language, user } = useAppContext();
  const canPreviewAllContent = Boolean(user?.roles.some((role) => role === "author" || role === "administrator"));

  useEffect(() => {
    const contentType = tabToType[activeTab];
    if (!contentType) return;
    apiClient.listContent(contentType, canPreviewAllContent).then(setItems).catch(console.error);
  }, [activeTab, canPreviewAllContent]);

  function changeTab(tab: string): void {
    setSelectedItem(null);
    setActiveTab(tab);
  }

  const primaryItem = items[0];
  const primaryText = primaryItem ? getTranslation(primaryItem, language) : {};

  return (
    <>
      <Header activeTab={activeTab} onTabChange={changeTab} />
      <main>
        {activeTab === "admin" ? (
          <AdminPage />
        ) : selectedItem ? (
          <DetailPage item={selectedItem} onBack={() => setSelectedItem(null)} />
        ) : activeTab === "biography" ? (
          <BiographyPortfolio item={items[0]} language={language} onTabChange={changeTab} />
        ) : (
          <section className="pageSection">
            <div className="hero reveal">
              <div>
                <span className="eyebrow">Fiction writer</span>
                <h1>{activeTab === "biography" ? "Author Name" : getTabTitle(activeTab)}</h1>
                <p>{primaryText.body ?? primaryText.excerpt ?? "Plantilla editorial para una autora joven de ficción contemporánea."}</p>
              </div>
            </div>
            {renderTabContent(activeTab, items, setSelectedItem, language)}
          </section>
        )}
      </main>
    </>
  );
}

function renderTabContent(
  activeTab: string,
  items: ContentItem[],
  setSelectedItem: (item: ContentItem) => void,
  language: string
): JSX.Element {
  if (activeTab === "contact") {
    const item = items[0];
    const text = item ? getTranslation(item, language) : {};
    return (
      <div className="textPanel reveal">
        <h2>{text.title ?? getTabTitle(activeTab)}</h2>
        <div dangerouslySetInnerHTML={{ __html: text.body ?? "" }} />
        {Boolean(item?.metadata.email) && <a className="accentLink" href={`mailto:${String(item?.metadata.email)}`}>{String(item?.metadata.email)}</a>}
      </div>
    );
  }

  if (activeTab === "blog") {
    return (
      <>
        <div className="sectionHeader">
          <h2>Entradas semanales</h2>
          <span>Histórico completo</span>
        </div>
        <div className="listGrid">{items.map((item) => <ContentCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div>
      </>
    );
  }

  return (
    <div className="listGrid">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} onOpen={setSelectedItem} />
      ))}
    </div>
  );
}

function BiographyPortfolio({
  item,
  language,
  onTabChange
}: {
  item?: ContentItem;
  language: string;
  onTabChange: (tab: string) => void;
}): JSX.Element {
  const text = item ? getTranslation(item, language) : {};
  const authorName = String(item?.metadata.authorName ?? "Author Name");
  const authorAge = String(item?.metadata.age ?? "25");
  const authorLocation = String(item?.metadata.location ?? "Madrid");
  const authorFocus = text.subtitle ?? "Ficción contemporánea con pulso joven, mirada íntima y una voz propia.";
  const portraitUrl = item?.coverImagePath ? apiClient.getMediaUrl(item.coverImagePath) : "";

  return (
    <section className="biographyPage">
      <div className="biographyHero reveal">
        <div
          className={portraitUrl ? "authorPortrait hasImage" : "authorPortrait"}
          style={portraitUrl ? { backgroundImage: `url(${portraitUrl})` } : undefined}
          aria-label="Author portrait"
        >
          <div className="portraitMonogram">{authorName.slice(0, 1)}</div>
        </div>
        <div className="biographyIntro">
          <span className="eyebrow">Author portfolio</span>
          <h1>{authorName}</h1>
          <p className="lead">{authorFocus}</p>
          <div className="bioActions">
            <button className="primaryButton" onClick={() => onTabChange("library")}>
              Biblioteca <ArrowRight size={16} />
            </button>
            <button className="textButton" onClick={() => onTabChange("events")}>
              Próximos eventos
            </button>
          </div>
        </div>
      </div>

      <div className="bioSnapshot reveal">
        <article>
          <strong>{authorAge}</strong>
          <span>años</span>
        </article>
        <article>
          <strong>{authorLocation}</strong>
          <span>base creativa</span>
        </article>
        <article>
          <strong>Semanal</strong>
          <span>ritmo de blog</span>
        </article>
      </div>

      <div className="bioEditorialGrid">
        <section className="bioEssay reveal">
          <Feather size={24} />
          <h2>{text.title ?? "Biografía"}</h2>
          <div
            dangerouslySetInnerHTML={{
              __html:
                text.body ??
                "Plantilla para una biografía profesional: trayectoria, imaginario narrativo, publicaciones, influencias y relación con lectores."
            }}
          />
        </section>
        <aside className="bioQuoteRail reveal">
          <Quote size={28} />
          <blockquote>
            <p>{text.excerpt ?? "Una voz joven para historias de ficción con atmósfera, precisión emocional y personajes que se quedan."}</p>
          </blockquote>
          <div className="miniCarousel" aria-label="Biography highlights">
            <span>Novelas</span>
            <span>Blog semanal</span>
            <span>Prensa</span>
          </div>
        </aside>
      </div>

      <section className="bioCarouselBand reveal">
        <div>
          <Sparkles size={22} />
          <h2>Universo literario</h2>
        </div>
        <div className="bioCarousel">
          {["Personajes", "Atmósfera", "Lecturas", "Proceso"].map((label) => (
            <article key={label}>
              <span>{label}</span>
              <p>Bloque editable preparado para destacar el tono, temas y proceso creativo de la autora.</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function getTabTitle(tab: string): string {
  const titles: Record<string, string> = {
    library: "Biblioteca",
    blog: "Blog",
    press: "Prensa",
    events: "Próximos eventos",
    contact: "Contacto",
    biography: "Biografía"
  };
  return titles[tab] ?? tab;
}

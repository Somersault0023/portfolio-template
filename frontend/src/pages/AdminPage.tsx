import { GripVertical, LogOut, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/apiClient";
import { RichTextEditor } from "../components/RichTextEditor";
import { useAppContext } from "../context/AppContext";
import { CommentItem, ContentItem, ContentType } from "../types/domain";
import { getTranslation } from "../utils/content";

const editableTypes: ContentType[] = ["biography", "work", "blog", "press", "event", "contact"];
const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ca", label: "Català" },
  { code: "eu", label: "Euskara" },
  { code: "gl", label: "Galego" }
];

interface TextFieldConfig {
  key: string;
  label: string;
  kind?: "input" | "textarea" | "richText";
}

interface MetadataFieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "url" | "select";
  options?: string[];
}

const textFieldConfig: Record<ContentType, TextFieldConfig[]> = {
  biography: [
    { key: "title", label: "Título de sección" },
    { key: "subtitle", label: "Frase profesional" },
    { key: "excerpt", label: "Cita destacada", kind: "textarea" },
    { key: "body", label: "Biografía completa", kind: "richText" }
  ],
  work: [
    { key: "title", label: "Título" },
    { key: "subtitle", label: "Subtítulo" },
    { key: "genre", label: "Género" },
    { key: "synopsis", label: "Sinopsis", kind: "textarea" },
    { key: "excerpt", label: "Extracto", kind: "textarea" }
  ],
  blog: [
    { key: "title", label: "Título" },
    { key: "excerpt", label: "Resumen", kind: "textarea" },
    { key: "body", label: "Entrada", kind: "richText" }
  ],
  press: [
    { key: "title", label: "Título" },
    { key: "outlet", label: "Medio" },
    { key: "excerpt", label: "Extracto", kind: "textarea" }
  ],
  event: [
    { key: "title", label: "Título" },
    { key: "location", label: "Ubicación" },
    { key: "description", label: "Descripción", kind: "textarea" }
  ],
  contact: [
    { key: "title", label: "Título" },
    { key: "body", label: "Texto de contacto", kind: "richText" }
  ]
};

const metadataFieldConfig: Record<ContentType, MetadataFieldConfig[]> = {
  biography: [
    { key: "authorName", label: "Nombre público" },
    { key: "age", label: "Edad", type: "number" },
    { key: "location", label: "Ciudad base" }
  ],
  work: [
    { key: "publisher", label: "Editorial" },
    { key: "isbn", label: "ISBN" }
  ],
  blog: [
    { key: "frequency", label: "Frecuencia" }
  ],
  press: [
    { key: "type", label: "Tipo de aparición", type: "select", options: ["entrevista", "reseña", "artículo", "radio", "TV"] },
    { key: "externalUrl", label: "Enlace externo", type: "url" }
  ],
  event: [
    { key: "ticketUrl", label: "Enlace de inscripción/compra", type: "url" },
    { key: "capacity", label: "Aforo", type: "number" }
  ],
  contact: [
    { key: "email", label: "Email profesional", type: "email" }
  ]
};

export function AdminPage(): JSX.Element {
  const { user, login, logout } = useAppContext();
  if (!user) return <LoginPanel onLogin={login} />;
  return <AdminDashboard onLogout={logout} />;
}

function LoginPanel({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }): JSX.Element {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError("");
    try {
      await onLogin(email, password);
    } catch {
      setError("No se pudo iniciar sesión.");
    }
  }

  return (
    <section className="pageSection narrowSection">
      <form className="adminForm loginPanel" onSubmit={submit}>
        <h1>Panel administrador</h1>
        <p className="muted">Acceso inicial: admin@example.com / ChangeMe123!</p>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
        <label>Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
        {error && <p className="formError">{error}</p>}
        <button className="primaryButton" type="submit">Entrar</button>
      </form>
    </section>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }): JSX.Element {
  const [activeType, setActiveType] = useState<ContentType>("work");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    refreshItems();
  }, [activeType]);

  useEffect(() => {
    apiClient.listAllComments().then(setComments).catch(console.error);
  }, []);

  function refreshItems(): void {
    apiClient.listContent(activeType, true).then((loadedItems) => {
      setItems(loadedItems);
      setSelectedItem(loadedItems[0] ?? createDraftItem(activeType));
    }).catch(console.error);
  }

  function moveItem(fromIndex: number, toIndex: number): void {
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setItems(reordered.map((item, index) => ({ ...item, sortOrder: index + 1 })));
  }

  return (
    <section className="adminLayout">
      <aside className="adminSidebar">
        <div className="adminTop">
          <h1>Editor visual</h1>
          <button className="iconButton" onClick={onLogout} title="Cerrar sesión"><LogOut size={18} /></button>
        </div>
        {editableTypes.map((type) => (
          <button key={type} className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)}>{type}</button>
        ))}
        <button className="primaryButton" onClick={() => setSelectedItem(createDraftItem(activeType))}><Plus size={16} /> Nuevo</button>
      </aside>
      <div className="adminList">
        <h2>Orden y contenido</h2>
        {items.map((item, index) => (
          <button
            key={item.id}
            draggable
            className={selectedItem?.id === item.id ? "adminListItem active" : "adminListItem"}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => moveItem(Number(event.dataTransfer.getData("text/plain")), index)}
            onClick={() => setSelectedItem(item)}
          >
            <GripVertical size={16} />
            <span>{getTranslation(item, "es").title ?? item.slug}</span>
          </button>
        ))}
        <ModerationPanel comments={comments} onChange={setComments} />
      </div>
      <div className="adminEditor">
        {selectedItem && <ContentEditor item={selectedItem} onSaved={(savedItem) => { setSelectedItem(savedItem); refreshItems(); }} />}
      </div>
    </section>
  );
}

function ContentEditor({ item, onSaved }: { item: ContentItem; onSaved: (item: ContentItem) => void }): JSX.Element {
  const [draft, setDraft] = useState<ContentItem>(item);
  const [activeLanguage, setActiveLanguage] = useState(Object.keys(item.translations)[0] ?? "es");
  const [languageToAdd, setLanguageToAdd] = useState(languageOptions[0].code);
  const currentText = useMemo(() => getTranslation(draft, activeLanguage), [draft, activeLanguage]);
  const textFields = textFieldConfig[draft.contentType];
  const metadataFields = metadataFieldConfig[draft.contentType];
  const showPublishedAt = ["work", "blog", "press", "event"].includes(draft.contentType);

  useEffect(() => {
    setDraft(item);
    setActiveLanguage(Object.keys(item.translations)[0] ?? "es");
    setLanguageToAdd(languageOptions.find((language) => !item.translations[language.code])?.code ?? languageOptions[0].code);
  }, [item]);

  function updateText(fieldName: string, value: string): void {
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [activeLanguage]: { ...(draft.translations[activeLanguage] ?? {}), [fieldName]: value }
      }
    });
  }

  function updateMetadata(fieldName: string, value: unknown): void {
    setDraft({ ...draft, metadata: { ...draft.metadata, [fieldName]: value } });
  }

  function addLanguage(nextLanguage: string): void {
    if (!nextLanguage || draft.translations[nextLanguage]) return;
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [nextLanguage]: { ...(draft.translations.es ?? {}) }
      }
    });
    setActiveLanguage(nextLanguage);
    setLanguageToAdd(languageOptions.find((language) => language.code !== nextLanguage && !draft.translations[language.code])?.code ?? nextLanguage);
  }

  async function uploadCover(file?: File): Promise<void> {
    if (!file) return;
    const imagePath = await apiClient.uploadImage(file);
    setDraft({ ...draft, coverImagePath: imagePath });
  }

  async function save(): Promise<void> {
    onSaved(await apiClient.saveContent(draft));
  }

  return (
    <form className="adminForm" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="editorHeader">
        <div>
          <span className="eyebrow">{draft.contentType}</span>
          <h2>{draft.id ? "Editar contenido" : "Nuevo contenido"}</h2>
        </div>
        <button className="primaryButton" type="submit"><Save size={16} /> Guardar</button>
      </div>
      <div className="formGrid">
        <label>Slug<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
        <label>Estado
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ContentItem["status"] })}>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
            <option value="hidden">Oculto</option>
          </select>
        </label>
        {showPublishedAt && <label>Fecha<input type="date" value={draft.publishedAt?.slice(0, 10) ?? ""} onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })} /></label>}
        <label>Orden<input type="number" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label>
      </div>
      <label className="uploadDrop">
        <Upload size={18} />
        <span>{getUploadLabel(draft.contentType)}</span>
        <input type="file" accept="image/*" onChange={(event) => void uploadCover(event.target.files?.[0])} />
      </label>
      {draft.coverImagePath && <img className="coverPreview" src={apiClient.getMediaUrl(draft.coverImagePath)} alt="" />}

      <div className="languageBar">
        {Object.keys(draft.translations).map((language) => (
          <button type="button" key={language} className={activeLanguage === language ? "active" : ""} onClick={() => setActiveLanguage(language)}>{language.toUpperCase()}</button>
        ))}
        <select value={languageToAdd} onChange={(event) => setLanguageToAdd(event.target.value)} aria-label="Idioma a añadir">
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code} disabled={Boolean(draft.translations[language.code])}>
              {language.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => addLanguage(languageToAdd)}><Plus size={14} /> Añadir lenguaje</button>
      </div>

      <section className="editorGroup">
        <h3>Textos en {activeLanguage.toUpperCase()}</h3>
        <div className="formGrid">
          {textFields.filter((field) => field.kind !== "textarea" && field.kind !== "richText").map((field) => (
            <label key={field.key}>{field.label}
              <input value={currentText[field.key] ?? ""} onChange={(event) => updateText(field.key, event.target.value)} />
            </label>
          ))}
        </div>
        {textFields.filter((field) => field.kind === "textarea").map((field) => (
          <label key={field.key}>{field.label}
            <textarea value={currentText[field.key] ?? ""} onChange={(event) => updateText(field.key, event.target.value)} />
          </label>
        ))}
        {textFields.filter((field) => field.kind === "richText").map((field) => (
          <label key={field.key}>{field.label}
            <RichTextEditor value={currentText[field.key] ?? ""} onChange={(value) => updateText(field.key, value)} />
          </label>
        ))}
      </section>

      {metadataFields.length > 0 && (
        <section className="editorGroup">
          <h3>Datos específicos</h3>
          <div className="formGrid">
            {metadataFields.map((field) => (
              <MetadataField key={field.key} field={field} value={draft.metadata[field.key]} onChange={(value) => updateMetadata(field.key, value)} />
            ))}
          </div>
        </section>
      )}

      {draft.contentType === "work" && (
        <section className="editorGroup">
          <h3>Compra y reseñas</h3>
          <LinkListEditor label="Enlaces de compra" value={draft.metadata.purchaseLinks} onChange={(value) => updateMetadata("purchaseLinks", value)} />
          <ReviewListEditor value={draft.metadata.featuredReviews} onChange={(value) => updateMetadata("featuredReviews", value)} />
        </section>
      )}

      {draft.contentType === "contact" && (
        <section className="editorGroup">
          <h3>Redes sociales</h3>
          <LinkListEditor label="Enlaces sociales" value={draft.metadata.socialLinks} onChange={(value) => updateMetadata("socialLinks", value)} />
        </section>
      )}
    </form>
  );
}

function MetadataField({
  field,
  value,
  onChange
}: {
  field: MetadataFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}): JSX.Element {
  if (field.type === "select") {
    return (
      <label>{field.label}
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label>{field.label}
      <input
        type={field.type ?? "text"}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

function LinkListEditor({
  label,
  value,
  onChange
}: {
  label: string;
  value: unknown;
  onChange: (value: Array<{ label: string; url: string }>) => void;
}): JSX.Element {
  const links = normalizeLinks(value);
  function updateLink(index: number, key: "label" | "url", nextValue: string): void {
    onChange(links.map((link, linkIndex) => (linkIndex === index ? { ...link, [key]: nextValue } : link)));
  }
  return (
    <div className="repeatableField">
      <div className="repeatableHeader">
        <span>{label}</span>
        <button type="button" onClick={() => onChange([...links, { label: "", url: "" }])}><Plus size={14} /> Añadir</button>
      </div>
      {links.map((link, index) => (
        <div className="repeatableRow" key={`${label}-${index}`}>
          <input placeholder="Etiqueta" value={link.label} onChange={(event) => updateLink(index, "label", event.target.value)} />
          <input placeholder="URL" value={link.url} onChange={(event) => updateLink(index, "url", event.target.value)} />
          <button type="button" className="iconButton" onClick={() => onChange(links.filter((_, linkIndex) => linkIndex !== index))}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function ReviewListEditor({
  value,
  onChange
}: {
  value: unknown;
  onChange: (value: Array<{ source: string; quote: string }>) => void;
}): JSX.Element {
  const reviews = normalizeReviews(value);
  function updateReview(index: number, key: "source" | "quote", nextValue: string): void {
    onChange(reviews.map((review, reviewIndex) => (reviewIndex === index ? { ...review, [key]: nextValue } : review)));
  }
  return (
    <div className="repeatableField">
      <div className="repeatableHeader">
        <span>Reseñas destacadas</span>
        <button type="button" onClick={() => onChange([...reviews, { source: "", quote: "" }])}><Plus size={14} /> Añadir</button>
      </div>
      {reviews.map((review, index) => (
        <div className="repeatableRow reviewRow" key={`review-${index}`}>
          <input placeholder="Medio" value={review.source} onChange={(event) => updateReview(index, "source", event.target.value)} />
          <textarea placeholder="Cita" value={review.quote} onChange={(event) => updateReview(index, "quote", event.target.value)} />
          <button type="button" className="iconButton" onClick={() => onChange(reviews.filter((_, reviewIndex) => reviewIndex !== index))}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function normalizeLinks(value: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    label: typeof item?.label === "string" ? item.label : "",
    url: typeof item?.url === "string" ? item.url : ""
  }));
}

function normalizeReviews(value: unknown): Array<{ source: string; quote: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    source: typeof item?.source === "string" ? item.source : "",
    quote: typeof item?.quote === "string" ? item.quote : ""
  }));
}

function getUploadLabel(contentType: ContentType): string {
  const labels: Record<ContentType, string> = {
    biography: "Subir foto de autora. Se usará como imagen protagonista.",
    work: "Subir portada de obra. Se recortará a folio vertical.",
    blog: "Subir imagen de cabecera de la entrada.",
    press: "Subir logo o imagen del medio.",
    event: "Subir portada del evento.",
    contact: "Subir imagen de contacto o retrato alternativo."
  };
  return labels[contentType];
}

function ModerationPanel({ comments, onChange }: { comments: CommentItem[]; onChange: (comments: CommentItem[]) => void }): JSX.Element {
  async function moderate(comment: CommentItem, status: CommentItem["status"]): Promise<void> {
    const updated = await apiClient.moderateComment(comment.id, status);
    onChange(comments.map((item) => (item.id === comment.id ? updated : item)));
  }

  return (
    <section className="moderationPanel">
      <h2>Comentarios</h2>
      {comments.slice(0, 8).map((comment) => (
        <article key={comment.id}>
          <strong>{comment.authorName}</strong>
          <p>{comment.message}</p>
          <div className="buttonRow">
            <button onClick={() => void moderate(comment, "visible")}>Mostrar</button>
            <button onClick={() => void moderate(comment, "hidden")}>Ocultar</button>
            <button onClick={() => void moderate(comment, "deleted")}><Trash2 size={14} /> Eliminar</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function createDraftItem(contentType: ContentType): ContentItem {
  return {
    id: 0,
    contentType,
    slug: `${contentType}-${Date.now()}`,
    status: "published",
    coverImagePath: null,
    sortOrder: 1,
    publishedAt: new Date().toISOString().slice(0, 10),
    translations: { es: { title: "", body: "" } },
    metadata: {},
    createdAt: "",
    updatedAt: ""
  };
}

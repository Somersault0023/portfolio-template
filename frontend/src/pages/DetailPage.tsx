import { ArrowLeft, ExternalLink, MapPin, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { useAppContext } from "../context/AppContext";
import { CommentItem, ContentItem } from "../types/domain";
import { formatDate, getMetadataArray, getTranslation } from "../utils/content";

interface DetailPageProps {
  item: ContentItem;
  onBack: () => void;
}

interface LinkItem {
  label: string;
  url: string;
}

interface ReviewItem {
  source: string;
  quote: string;
}

export function DetailPage({ item, onBack }: DetailPageProps): JSX.Element {
  const { language } = useAppContext();
  const text = getTranslation(item, language);
  const purchaseLinks = getMetadataArray<LinkItem>(item, "purchaseLinks");
  const reviews = getMetadataArray<ReviewItem>(item, "featuredReviews");

  return (
    <section className="pageSection detailPage">
      <button className="textButton" onClick={onBack}><ArrowLeft size={16} /> Volver</button>
      <div className="detailHero reveal">
        {item.coverImagePath && <img src={apiClient.getMediaUrl(item.coverImagePath)} alt={text.title ?? item.slug} />}
        <div>
          <span className="eyebrow">{item.contentType}</span>
          <h1>{text.title ?? item.slug}</h1>
          {text.subtitle && <p className="lead">{text.subtitle}</p>}
          {item.publishedAt && <p className="muted">{formatDate(item.publishedAt, language)}</p>}
          {text.synopsis && <p>{text.synopsis}</p>}
          {text.description && <p>{text.description}</p>}
          {text.location && (
            <p className="metaLine"><MapPin size={16} /> {text.location}</p>
          )}
          {Boolean(item.metadata.ticketUrl) && (
            <a className="primaryButton" href={String(item.metadata.ticketUrl)} target="_blank" rel="noreferrer">
              Inscripción <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {item.contentType === "event" && text.location && (
        <a className="mapPreview" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text.location)}`} target="_blank" rel="noreferrer">
          <MapPin size={22} />
          <span>Ver ubicación en Maps</span>
        </a>
      )}

      {text.body && <div className="textPanel" dangerouslySetInnerHTML={{ __html: text.body }} />}
      {text.excerpt && <div className="quotePanel">{text.excerpt}</div>}

      {item.contentType === "work" && (
        <>
          <section className="detailBlock">
            <h2>Compra</h2>
            <div className="buttonRow">
              {purchaseLinks.map((link) => (
                <a key={link.url} className="primaryButton" href={link.url} target="_blank" rel="noreferrer">
                  {link.label} <ExternalLink size={16} />
                </a>
              ))}
            </div>
            <dl className="facts">
              {Boolean(item.metadata.publisher) && <><dt>Editorial</dt><dd>{String(item.metadata.publisher)}</dd></>}
              {Boolean(item.metadata.isbn) && <><dt>ISBN</dt><dd>{String(item.metadata.isbn)}</dd></>}
              {text.genre && <><dt>Género</dt><dd>{text.genre}</dd></>}
            </dl>
          </section>
          <section className="detailBlock">
            <h2>Reseñas destacadas</h2>
            <div className="reviewGrid">
              {reviews.map((review) => (
                <blockquote key={`${review.source}-${review.quote}`}>
                  <p>{review.quote}</p>
                  <cite>{review.source}</cite>
                </blockquote>
              ))}
            </div>
          </section>
          <Comments workId={item.id} />
        </>
      )}

      {item.contentType === "press" && Boolean(item.metadata.externalUrl) && (
        <a className="primaryButton" href={String(item.metadata.externalUrl)} target="_blank" rel="noreferrer">
          Leer aparición <ExternalLink size={16} />
        </a>
      )}
    </section>
  );
}

function Comments({ workId }: { workId: number }): JSX.Element {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiClient.listComments(workId).then(setComments).catch(console.error);
  }, [workId]);

  async function submitComment(event: FormEvent): Promise<void> {
    event.preventDefault();
    const comment = await apiClient.createComment(workId, authorName, message);
    setComments([comment, ...comments]);
    setAuthorName("");
    setMessage("");
  }

  return (
    <section className="detailBlock">
      <h2>Comentarios</h2>
      <form className="commentForm" onSubmit={submitComment}>
        <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Nombre" required />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Comentario" required />
        <button className="primaryButton" type="submit"><Send size={16} /> Publicar</button>
      </form>
      <div className="commentList">
        {comments.map((comment) => (
          <article key={comment.id}>
            <strong>{comment.authorName}</strong>
            <p>{comment.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { CalendarDays, MapPin } from "lucide-react";
import { apiClient } from "../api/apiClient";
import { useAppContext } from "../context/AppContext";
import { ContentItem } from "../types/domain";
import { formatDate, getTranslation } from "../utils/content";

interface ContentCardProps {
  item: ContentItem;
  onOpen: (item: ContentItem) => void;
}

export function ContentCard({ item, onOpen }: ContentCardProps): JSX.Element {
  const { language } = useAppContext();
  const text = getTranslation(item, language);
  return (
    <article className="contentCard reveal">
      <button className="coverButton" onClick={() => onOpen(item)}>
        {item.coverImagePath ? (
          <img src={apiClient.getMediaUrl(item.coverImagePath)} alt={text.title ?? item.slug} />
        ) : (
          <div className="coverPlaceholder">{text.title?.slice(0, 1) ?? "A"}</div>
        )}
      </button>
      <div className="cardBody">
        <div className="cardMetaTop">
          <span className="eyebrow">{item.contentType}</span>
          {item.status !== "published" && <span className="statusBadge">{item.status}</span>}
        </div>
        <h3>{text.title ?? item.slug}</h3>
        {/*text.subtitle && <p className="muted">{text.subtitle}</p>*/}
        {/*text.excerpt && <p>{text.excerpt}</p>*/}
        {(text.location || item.publishedAt) && (
          <div className="metaRow">
            {text.location && (
              <span className="metaLine">
                <MapPin size={14} /> {text.location}
              </span>
            )}
            {item.publishedAt && (
              <span className="metaLine">
                <CalendarDays size={14} /> {formatDate(item.publishedAt, language)}
              </span>
            )}
          </div>
        )}
        <button className="textButton" onClick={() => onOpen(item)}>Ver detalle</button>
      </div>
    </article>
  );
}

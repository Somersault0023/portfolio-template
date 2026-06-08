import { ContentItem } from "../types/domain";

export function getTranslation(item: ContentItem, language: string): Record<string, string> {
  return item.translations[language] ?? item.translations.es ?? Object.values(item.translations)[0] ?? {};
}

export function formatDate(value?: string | null, language = "es"): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(language, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function getMetadataArray<T>(item: ContentItem, key: string): T[] {
  const value = item.metadata[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

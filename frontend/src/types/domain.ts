export type ContentType = "biography" | "work" | "blog" | "press" | "event" | "contact";
export type ContentStatus = "draft" | "published" | "hidden";

export interface ContentItem {
  id: number;
  contentType: ContentType;
  slug: string;
  status: ContentStatus;
  coverImagePath?: string | null;
  sortOrder: number;
  publishedAt?: string | null;
  translations: Record<string, Record<string, string>>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  displayName: string;
  email: string;
  defaultLanguage: string;
  roles: string[];
}

export interface CommentItem {
  id: number;
  workId: number;
  authorName: string;
  message: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
}

export interface ThemeDefinition {
  id: string;
  label: string;
}

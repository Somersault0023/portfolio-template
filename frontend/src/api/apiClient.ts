import { CommentItem, ContentItem, ContentType, UserProfile } from "../types/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiClient {
  private accessToken: string | null = localStorage.getItem("accessToken");

  public getMediaUrl(path?: string | null): string {
    if (!path) return "";
    return path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  }

  public setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    else localStorage.removeItem("accessToken");
  }

  public async login(email: string, password: string): Promise<UserProfile> {
    const response = await this.request<{ accessToken: string; user: UserProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    this.setAccessToken(response.accessToken);
    return response.user;
  }

  public async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>("/api/auth/me");
  }

  public async listContent(contentType?: ContentType, includeHidden = false): Promise<ContentItem[]> {
    const params = new URLSearchParams();
    if (contentType) params.set("contentType", contentType);
    if (includeHidden) params.set("includeHidden", "true");
    return this.request<ContentItem[]>(`/api/content?${params.toString()}`);
  }

  public async getContent(slug: string, includeHidden = false): Promise<ContentItem> {
    return this.request<ContentItem>(`/api/content/${slug}?includeHidden=${includeHidden}`);
  }

  public async saveContent(item: Partial<ContentItem>): Promise<ContentItem> {
    const payload = JSON.stringify(item);
    if (item.id) {
      return this.request<ContentItem>(`/api/content/${item.id}`, { method: "PUT", body: payload });
    }
    return this.request<ContentItem>("/api/content", { method: "POST", body: payload });
  }

  public async deleteContent(itemId: number): Promise<void> {
    await this.request(`/api/content/${itemId}`, { method: "DELETE" });
  }

  public async uploadImage(imageFile: File): Promise<string> {
    const formData = new FormData();
    formData.append("imageFile", imageFile);
    const response = await fetch(`${apiBaseUrl}/api/media`, {
      method: "POST",
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    return result.imagePath;
  }

  public async listComments(workId: number): Promise<CommentItem[]> {
    return this.request<CommentItem[]>(`/api/works/${workId}/comments`);
  }

  public async createComment(workId: number, authorName: string, message: string): Promise<CommentItem> {
    return this.request<CommentItem>(`/api/works/${workId}/comments`, {
      method: "POST",
      body: JSON.stringify({ authorName, message })
    });
  }

  public async listAllComments(): Promise<CommentItem[]> {
    return this.request<CommentItem[]>("/api/comments");
  }

  public async moderateComment(commentId: number, status: CommentItem["status"]): Promise<CommentItem> {
    return this.request<CommentItem>(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (this.accessToken) headers.set("Authorization", `Bearer ${this.accessToken}`);
    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
}

export const apiClient = new ApiClient();

import json
from typing import Any

from fastapi import HTTPException, status

from app.core.database import DatabaseManager
from app.schemas.common import CommentModerationPayload, CommentPayload, ContentItemPayload


class ContentService:
    def __init__(self, database: DatabaseManager) -> None:
        self.database = database

    def seedTemplateContent(self) -> None:
        with self.database.connect() as connection:
            count = connection.execute("SELECT COUNT(*) FROM contentItems").fetchone()[0]
            if count > 0:
                return
        for item in self.buildTemplateItems():
            self.createContentItem(item)

    def buildTemplateItems(self) -> list[ContentItemPayload]:
        return [
            ContentItemPayload(
                contentType="biography",
                slug="biography",
                sortOrder=1,
                translations={"es": {"title": "Biografía", "body": "Plantilla para la biografía de una joven autora de ficción de veinticinco años."}},
                metadata={"age": 25},
            ),
            ContentItemPayload(
                contentType="work",
                slug="first-novel-template",
                sortOrder=1,
                publishedAt="2026-01-01",
                translations={
                    "es": {
                        "title": "Título de la novela",
                        "subtitle": "Subtítulo de la obra",
                        "synopsis": "Sinopsis editorial de la novela.",
                        "excerpt": "Fragmento breve de lectura.",
                        "genre": "Ficción contemporánea",
                    }
                },
                metadata={
                    "publisher": "Editorial",
                    "isbn": "000-0-00-000000-0",
                    "purchaseLinks": [{"label": "Librería", "url": "https://example.com"}],
                    "featuredReviews": [{"source": "Medio", "quote": "Una reseña destacada de ejemplo."}],
                },
            ),
            ContentItemPayload(
                contentType="blog",
                slug="weekly-note-template",
                sortOrder=1,
                publishedAt="2026-01-07",
                translations={"es": {"title": "Entrada semanal", "excerpt": "Resumen de la entrada.", "body": "<p>Contenido editable de la entrada.</p>"}},
                metadata={"frequency": "weekly"},
            ),
            ContentItemPayload(
                contentType="press",
                slug="press-template",
                sortOrder=1,
                publishedAt="2026-02-01",
                translations={"es": {"title": "Aparición en prensa", "outlet": "Medio", "excerpt": "Extracto de la aparición."}},
                metadata={"type": "entrevista", "externalUrl": "https://example.com"},
            ),
            ContentItemPayload(
                contentType="event",
                slug="event-template",
                sortOrder=1,
                publishedAt="2026-03-01",
                translations={"es": {"title": "Presentación literaria", "location": "Madrid", "description": "Descripción del evento."}},
                metadata={"ticketUrl": "https://example.com", "capacity": 80, "mapPreviewUrl": ""},
            ),
            ContentItemPayload(
                contentType="contact",
                slug="contact",
                sortOrder=1,
                translations={"es": {"title": "Contacto", "body": "Escribe aquí la información de contacto profesional."}},
                metadata={"email": "contact@example.com", "socialLinks": []},
            ),
        ]

    def listContentItems(self, contentType: str | None = None, includeHidden: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM contentItems"
        values: list[Any] = []
        filters: list[str] = []
        if contentType:
            filters.append("contentType = ?")
            values.append(contentType)
        if not includeHidden:
            filters.append("status = 'published'")
        if filters:
            query += " WHERE " + " AND ".join(filters)
        query += " ORDER BY sortOrder ASC, publishedAt DESC, id DESC"
        with self.database.connect() as connection:
            rows = connection.execute(query, values).fetchall()
            return [self.deserializeContentItem(row) for row in rows]

    def getContentItem(self, slug: str, includeHidden: bool = False) -> dict[str, Any]:
        with self.database.connect() as connection:
            row = connection.execute("SELECT * FROM contentItems WHERE slug = ?", (slug,)).fetchone()
            item = self.deserializeContentItem(row)
            if item is None or (item["status"] != "published" and not includeHidden):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")
            return item

    def createContentItem(self, payload: ContentItemPayload) -> dict[str, Any]:
        with self.database.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO contentItems
                (contentType, slug, status, coverImagePath, sortOrder, publishedAt, translations, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.contentType,
                    payload.slug,
                    payload.status,
                    payload.coverImagePath,
                    payload.sortOrder,
                    payload.publishedAt,
                    json.dumps(payload.translations),
                    json.dumps(payload.metadata),
                ),
            )
            row = connection.execute("SELECT * FROM contentItems WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return self.deserializeContentItem(row)

    def updateContentItem(self, itemId: int, payload: ContentItemPayload) -> dict[str, Any]:
        with self.database.connect() as connection:
            exists = connection.execute("SELECT id FROM contentItems WHERE id = ?", (itemId,)).fetchone()
            if exists is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")
            connection.execute(
                """
                UPDATE contentItems
                SET contentType = ?, slug = ?, status = ?, coverImagePath = ?, sortOrder = ?,
                    publishedAt = ?, translations = ?, metadata = ?, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (
                    payload.contentType,
                    payload.slug,
                    payload.status,
                    payload.coverImagePath,
                    payload.sortOrder,
                    payload.publishedAt,
                    json.dumps(payload.translations),
                    json.dumps(payload.metadata),
                    itemId,
                ),
            )
            row = connection.execute("SELECT * FROM contentItems WHERE id = ?", (itemId,)).fetchone()
            return self.deserializeContentItem(row)

    def deleteContentItem(self, itemId: int) -> None:
        with self.database.connect() as connection:
            connection.execute("DELETE FROM contentItems WHERE id = ?", (itemId,))

    def createComment(self, workId: int, payload: CommentPayload) -> dict[str, Any]:
        with self.database.connect() as connection:
            work = connection.execute("SELECT id FROM contentItems WHERE id = ? AND contentType = 'work'", (workId,)).fetchone()
            if work is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work not found")
            cursor = connection.execute(
                "INSERT INTO comments (workId, authorName, message) VALUES (?, ?, ?)",
                (workId, payload.authorName, payload.message),
            )
            row = connection.execute("SELECT * FROM comments WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return dict(row)

    def listComments(self, workId: int | None = None, includeModerated: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM comments"
        filters: list[str] = []
        values: list[Any] = []
        if workId is not None:
            filters.append("workId = ?")
            values.append(workId)
        if not includeModerated:
            filters.append("status = 'visible'")
        if filters:
            query += " WHERE " + " AND ".join(filters)
        query += " ORDER BY createdAt DESC"
        with self.database.connect() as connection:
            return [dict(row) for row in connection.execute(query, values).fetchall()]

    def moderateComment(self, commentId: int, payload: CommentModerationPayload) -> dict[str, Any]:
        with self.database.connect() as connection:
            connection.execute("UPDATE comments SET status = ? WHERE id = ?", (payload.status, commentId))
            row = connection.execute("SELECT * FROM comments WHERE id = ?", (commentId,)).fetchone()
            if row is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
            return dict(row)

    def deserializeContentItem(self, row: Any) -> dict[str, Any]:
        item = self.database.rowToDict(row)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")
        return item

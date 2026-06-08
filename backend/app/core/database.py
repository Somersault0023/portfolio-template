import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from app.core.config import getSettings


class DatabaseManager:
    def __init__(self, databasePath: Path) -> None:
        self.databasePath = databasePath

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.databasePath)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS roles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    permissions TEXT NOT NULL DEFAULT '[]'
                );

                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    displayName TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    passwordHash TEXT NOT NULL,
                    defaultLanguage TEXT NOT NULL DEFAULT 'es',
                    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS userRoles (
                    userId INTEGER NOT NULL,
                    roleId INTEGER NOT NULL,
                    PRIMARY KEY (userId, roleId),
                    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS contentItems (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contentType TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    status TEXT NOT NULL DEFAULT 'published',
                    coverImagePath TEXT,
                    sortOrder INTEGER NOT NULL DEFAULT 0,
                    publishedAt TEXT,
                    translations TEXT NOT NULL DEFAULT '{}',
                    metadata TEXT NOT NULL DEFAULT '{}',
                    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workId INTEGER NOT NULL,
                    authorName TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'visible',
                    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workId) REFERENCES contentItems(id) ON DELETE CASCADE
                );
                """
            )

    def rowToDict(self, row: sqlite3.Row | None) -> dict[str, Any] | None:
        if row is None:
            return None
        data = dict(row)
        for fieldName in ("permissions", "translations", "metadata"):
            if fieldName in data and isinstance(data[fieldName], str):
                data[fieldName] = json.loads(data[fieldName] or "[]" if fieldName == "permissions" else data[fieldName] or "{}")
        return data


databaseManager = DatabaseManager(getSettings().databasePath)

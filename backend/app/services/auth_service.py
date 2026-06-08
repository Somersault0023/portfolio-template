import json
import sqlite3

from fastapi import HTTPException, status

from app.core.database import DatabaseManager
from app.core.security import securityService
from app.schemas.common import LoginRequest, UserProfile


class AuthService:
    def __init__(self, database: DatabaseManager) -> None:
        self.database = database

    def seedDefaultRolesAndAdmin(self) -> None:
        roles = {
            "visitor": ["comment:create"],
            "author": ["content:manage", "comments:moderate", "profile:update"],
            "administrator": ["content:manage", "comments:moderate", "profile:update", "users:manage", "roles:manage"],
        }
        with self.database.connect() as connection:
            for roleName, permissions in roles.items():
                connection.execute(
                    "INSERT OR IGNORE INTO roles (name, permissions) VALUES (?, ?)",
                    (roleName, json.dumps(permissions)),
                )
            adminCount = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            if adminCount == 0:
                passwordHash = securityService.hashPassword("ChangeMe123!")
                cursor = connection.execute(
                    "INSERT INTO users (displayName, email, passwordHash, defaultLanguage) VALUES (?, ?, ?, ?)",
                    ("Portfolio Administrator", "admin@example.com", passwordHash, "es"),
                )
                adminId = cursor.lastrowid
                roleIds = connection.execute("SELECT id FROM roles WHERE name IN ('author', 'administrator')").fetchall()
                for role in roleIds:
                    connection.execute("INSERT INTO userRoles (userId, roleId) VALUES (?, ?)", (adminId, role["id"]))

    def authenticate(self, request: LoginRequest) -> tuple[str, UserProfile]:
        with self.database.connect() as connection:
            user = connection.execute("SELECT * FROM users WHERE email = ?", (request.email,)).fetchone()
            if user is None or not securityService.verifyPassword(request.password, user["passwordHash"]):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
            profile = self.buildUserProfile(connection, user["id"])
            token = securityService.createAccessToken(str(user["id"]), {"roles": profile.roles})
            return token, profile

    def getUserById(self, userId: int) -> UserProfile | None:
        with self.database.connect() as connection:
            return self.buildUserProfile(connection, userId)

    def buildUserProfile(self, connection: sqlite3.Connection, userId: int) -> UserProfile:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (userId,)).fetchone()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        roleRows = connection.execute(
            """
            SELECT roles.name FROM roles
            JOIN userRoles ON userRoles.roleId = roles.id
            WHERE userRoles.userId = ?
            ORDER BY roles.name
            """,
            (userId,),
        ).fetchall()
        return UserProfile(
            id=user["id"],
            displayName=user["displayName"],
            email=user["email"],
            defaultLanguage=user["defaultLanguage"],
            roles=[role["name"] for role in roleRows],
        )

    def listRoles(self) -> list[dict]:
        with self.database.connect() as connection:
            rows = connection.execute("SELECT * FROM roles ORDER BY name").fetchall()
            return [self.database.rowToDict(row) for row in rows if row is not None]

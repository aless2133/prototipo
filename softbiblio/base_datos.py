from __future__ import annotations

import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "biblioteca_loja_lee.db"


def obtener_conexion() -> sqlite3.Connection:
    conexion = sqlite3.connect(DB_PATH)
    conexion.row_factory = sqlite3.Row
    conexion.execute("PRAGMA foreign_keys = ON")
    return conexion


def inicializar_base_datos() -> None:
    with obtener_conexion() as conexion:
        cursor = conexion.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS bibliotecarios (
                idBibliotecario INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                usuario TEXT NOT NULL UNIQUE,
                contrasena TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS usuarios (
                idUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                cedula TEXT NOT NULL UNIQUE,
                correo TEXT NOT NULL,
                telefono TEXT NOT NULL,
                direccion TEXT NOT NULL,
                rol TEXT NOT NULL,
                estado TEXT NOT NULL DEFAULT 'Activo',
                fechaRegistro TEXT NOT NULL DEFAULT (datetime('now')),
                idBibliotecario INTEGER NOT NULL,
                FOREIGN KEY (idBibliotecario) REFERENCES bibliotecarios(idBibliotecario)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS historial_cambios (
                idCambio INTEGER PRIMARY KEY AUTOINCREMENT,
                idUsuario INTEGER NOT NULL,
                campoModificado TEXT NOT NULL,
                valorAnterior TEXT NOT NULL,
                valorNuevo TEXT NOT NULL,
                fechaCambio TEXT NOT NULL DEFAULT (datetime('now')),
                usuarioResponsable TEXT NOT NULL,
                FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
            )
            """
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_usuarios_cedula ON usuarios(cedula)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_cambios(idUsuario)"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO bibliotecarios (idBibliotecario, nombre, usuario, contrasena) "
            "VALUES (1, 'Bibliotecario Principal', 'bibliotecario', '1234')"
        )
        conexion.commit()


def cerrar_conexion(conexion: sqlite3.Connection | None) -> None:
    if conexion is not None:
        conexion.close()

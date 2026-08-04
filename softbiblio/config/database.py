"""SoftBiblio - Conexión y esquema de la base de datos."""
import os
import sqlite3

RUTA_DB = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "softbiblio.db",
)

DIAS_PRESTAMO = 14     # Plazo estándar de préstamo
MULTA_POR_DIA = 0.50   # Multa por día de retraso (USD)


def conectar():
    """Devuelve una conexión con claves foráneas activadas."""
    conexion = sqlite3.connect(RUTA_DB)
    conexion.execute("PRAGMA foreign_keys = ON")
    return conexion


def consultar(sql, params=()):
    """Ejecuta un SELECT y devuelve las filas."""
    conexion = conectar()
    try:
        return conexion.execute(sql, params).fetchall()
    finally:
        conexion.close()


def crear_esquema():
    """Crea todas las tablas si no existen."""
    conexion = conectar()
    try:
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_socio TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                cedula TEXT UNIQUE NOT NULL,
                correo TEXT UNIQUE NOT NULL,
                telefono TEXT,
                estado TEXT NOT NULL DEFAULT 'Activo'
                    CHECK (estado IN ('Activo', 'Inactivo')),
                fecha_registro TEXT NOT NULL
            )
        """)
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS libros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_libro TEXT UNIQUE NOT NULL,
                titulo TEXT NOT NULL,
                autor TEXT NOT NULL,
                isbn TEXT,
                anio TEXT,
                ejemplares INTEGER NOT NULL DEFAULT 1,
                disponibles INTEGER NOT NULL DEFAULT 1
            )
        """)
        conexion.execute("""
            CREATE TABLE IF NOT EXISTS prestamos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_prestamo TEXT UNIQUE NOT NULL,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                libro_id INTEGER NOT NULL REFERENCES libros(id),
                fecha_prestamo TEXT NOT NULL,
                fecha_limite TEXT NOT NULL,
                fecha_devolucion TEXT,
                multa REAL NOT NULL DEFAULT 0,
                estado TEXT NOT NULL DEFAULT 'Prestado'
                    CHECK (estado IN ('Prestado', 'Devuelto'))
            )
        """)
        conexion.commit()
    finally:
        conexion.close()
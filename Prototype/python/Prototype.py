"""
Sistema de Gestión de Biblioteca 'Loja Lee'
Sprint 1 - EP-01: Gestión de Usuarios (Versión con Ventana - Tkinter)
HU-01: Registrar usuarios
HU-02: Actualizar usuarios
"""

import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import re
from datetime import datetime

DB_NAME = "biblioteca.db"


def crear_tabla():
    conexion = sqlite3.connect(DB_NAME)
    cursor = conexion.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            nombre TEXT NOT NULL,
            cedula TEXT UNIQUE NOT NULL,
            correo TEXT NOT NULL,
            telefono TEXT,
            fechaRegistro TEXT NOT NULL
        )
    """)
    conexion.commit()
    conexion.close()


def validar_correo(correo):
    patron = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return re.match(patron, correo) is not None


def cedula_existe(cedula, id_excluir=None):
    conexion = sqlite3.connect(DB_NAME)
    cursor = conexion.cursor()
    if id_excluir:
        cursor.execute("SELECT id FROM usuarios WHERE cedula = ? AND id != ?", (cedula, id_excluir))
    else:
        cursor.execute("SELECT id FROM usuarios WHERE cedula = ?", (cedula,))
    resultado = cursor.fetchone()
    conexion.close()
    return resultado is not None


def generar_codigo():
    conexion = sqlite3.connect(DB_NAME)
    cursor = conexion.cursor()
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    total = cursor.fetchone()[0]
    conexion.close()
    return f"USR-{total + 1:04d}"


class AppBiblioteca:
    def __init__(self, raiz):
        self.raiz = raiz
        self.raiz.title("Biblioteca Municipal 'Loja Lee' - Gestión de Usuarios")
        self.raiz.geometry("750x500")

        self.usuario_seleccionado_id = None

        self.crear_widgets()
        self.cargar_usuarios()

    def crear_widgets(self):
        # ---- Formulario ----
        marco_formulario = ttk.LabelFrame(self.raiz, text="Datos del usuario")
        marco_formulario.pack(fill="x", padx=10, pady=10)

        ttk.Label(marco_formulario, text="Nombre:").grid(row=0, column=0, padx=5, pady=5, sticky="e")
        self.entrada_nombre = ttk.Entry(marco_formulario, width=35)
        self.entrada_nombre.grid(row=0, column=1, padx=5, pady=5)

        ttk.Label(marco_formulario, text="Cédula:").grid(row=0, column=2, padx=5, pady=5, sticky="e")
        self.entrada_cedula = ttk.Entry(marco_formulario, width=25)
        self.entrada_cedula.grid(row=0, column=3, padx=5, pady=5)

        ttk.Label(marco_formulario, text="Correo:").grid(row=1, column=0, padx=5, pady=5, sticky="e")
        self.entrada_correo = ttk.Entry(marco_formulario, width=35)
        self.entrada_correo.grid(row=1, column=1, padx=5, pady=5)

        ttk.Label(marco_formulario, text="Teléfono:").grid(row=1, column=2, padx=5, pady=5, sticky="e")
        self.entrada_telefono = ttk.Entry(marco_formulario, width=25)
        self.entrada_telefono.grid(row=1, column=3, padx=5, pady=5)

        # ---- Botones ----
        marco_botones = ttk.Frame(self.raiz)
        marco_botones.pack(fill="x", padx=10, pady=5)

        ttk.Button(marco_botones, text="Registrar", command=self.registrar_usuario).pack(side="left", padx=5)
        ttk.Button(marco_botones, text="Actualizar", command=self.actualizar_usuario).pack(side="left", padx=5)
        ttk.Button(marco_botones, text="Limpiar campos", command=self.limpiar_campos).pack(side="left", padx=5)

        # ---- Tabla de usuarios ----
        marco_tabla = ttk.LabelFrame(self.raiz, text="Usuarios registrados")
        marco_tabla.pack(fill="both", expand=True, padx=10, pady=10)

        columnas = ("id", "codigo", "nombre", "cedula", "correo", "telefono")
        self.tabla = ttk.Treeview(marco_tabla, columns=columnas, show="headings")

        encabezados = {
            "id": "ID", "codigo": "Código", "nombre": "Nombre",
            "cedula": "Cédula", "correo": "Correo", "telefono": "Teléfono"
        }
        for col in columnas:
            self.tabla.heading(col, text=encabezados[col])
            self.tabla.column(col, width=110)

        self.tabla.pack(fill="both", expand=True, side="left")
        self.tabla.bind("<<TreeviewSelect>>", self.seleccionar_fila)

        barra_scroll = ttk.Scrollbar(marco_tabla, orient="vertical", command=self.tabla.yview)
        barra_scroll.pack(side="right", fill="y")
        self.tabla.configure(yscrollcommand=barra_scroll.set)

    def limpiar_campos(self):
        self.entrada_nombre.delete(0, tk.END)
        self.entrada_cedula.delete(0, tk.END)
        self.entrada_correo.delete(0, tk.END)
        self.entrada_telefono.delete(0, tk.END)
        self.usuario_seleccionado_id = None

    def cargar_usuarios(self):
        for fila in self.tabla.get_children():
            self.tabla.delete(fila)

        conexion = sqlite3.connect(DB_NAME)
        cursor = conexion.cursor()
        cursor.execute("SELECT id, codigo, nombre, cedula, correo, telefono FROM usuarios ORDER BY id DESC")
        usuarios = cursor.fetchall()
        conexion.close()

        for usuario in usuarios:
            self.tabla.insert("", "end", values=usuario)

    def seleccionar_fila(self, evento):
        seleccion = self.tabla.selection()
        if not seleccion:
            return
        valores = self.tabla.item(seleccion[0], "values")
        self.usuario_seleccionado_id = valores[0]
        self.limpiar_campos_visual()
        self.entrada_nombre.insert(0, valores[2])
        self.entrada_cedula.insert(0, valores[3])
        self.entrada_correo.insert(0, valores[4])
        self.entrada_telefono.insert(0, valores[5])

    def limpiar_campos_visual(self):
        self.entrada_nombre.delete(0, tk.END)
        self.entrada_cedula.delete(0, tk.END)
        self.entrada_correo.delete(0, tk.END)
        self.entrada_telefono.delete(0, tk.END)

    def registrar_usuario(self):
        nombre = self.entrada_nombre.get().strip()
        cedula = self.entrada_cedula.get().strip()
        correo = self.entrada_correo.get().strip()
        telefono = self.entrada_telefono.get().strip()

        if not nombre or not cedula or not correo:
            messagebox.showerror("Error", "Nombre, cédula y correo son obligatorios.")
            return

        if not validar_correo(correo):
            messagebox.showerror("Error", "El correo no tiene un formato válido.")
            return

        if cedula_existe(cedula):
            messagebox.showerror("Error", "Ya existe un usuario registrado con esa cédula.")
            return

        codigo = generar_codigo()
        conexion = sqlite3.connect(DB_NAME)
        cursor = conexion.cursor()
        cursor.execute(
            "INSERT INTO usuarios (codigo, nombre, cedula, correo, telefono, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?)",
            (codigo, nombre, cedula, correo, telefono, datetime.now().strftime("%Y-%m-%d %H:%M"))
        )
        conexion.commit()
        conexion.close()

        messagebox.showinfo("Éxito", f"Usuario registrado. Código asignado: {codigo}")
        self.limpiar_campos()
        self.cargar_usuarios()

    def actualizar_usuario(self):
        if not self.usuario_seleccionado_id:
            messagebox.showwarning("Aviso", "Seleccione un usuario de la tabla para actualizar.")
            return

        nombre = self.entrada_nombre.get().strip()
        correo = self.entrada_correo.get().strip()
        telefono = self.entrada_telefono.get().strip()

        if not nombre or not correo:
            messagebox.showerror("Error", "Nombre y correo son obligatorios.")
            return

        if not validar_correo(correo):
            messagebox.showerror("Error", "El correo no tiene un formato válido.")
            return

        conexion = sqlite3.connect(DB_NAME)
        cursor = conexion.cursor()
        cursor.execute(
            "UPDATE usuarios SET nombre = ?, correo = ?, telefono = ? WHERE id = ?",
            (nombre, correo, telefono, self.usuario_seleccionado_id)
        )
        conexion.commit()
        conexion.close()

        messagebox.showinfo("Éxito", "Usuario actualizado correctamente.")
        self.limpiar_campos()
        self.cargar_usuarios()


if __name__ == "__main__":
    crear_tabla()
    raiz = tk.Tk()
    app = AppBiblioteca(raiz)
    raiz.mainloop()
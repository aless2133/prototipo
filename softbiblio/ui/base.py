from __future__ import annotations

import tkinter as tk
from tkinter import ttk
from pathlib import Path

from base_datos import inicializar_base_datos


COLOR_FONDO = "#eef2f7"
COLOR_SIDEBAR = "#2f3b4a"
COLOR_TEXTO = "#1f2937"
COLOR_TITULO = "#11224d"
COLOR_TOPBAR = "#163a78"
COLOR_BLANCO = "#ffffff"
COLOR_ACENTO = "#1d4ed8"


class AppShell(tk.Tk):
    def __init__(self):
        super().__init__()
        inicializar_base_datos()
        self.title("Loja Lee | Sistema de Gestión de Biblioteca")
        self.geometry("1240x760")
        self.minsize(1120, 700)
        self.configure(bg=COLOR_FONDO)
        self._pantallas: dict[str, type[ttk.Frame]] = {}
        self.usuario_responsable = tk.StringVar(value="Bibliotecario")
        self._crear_estilos()
        self._crear_layout()
        self._mensaje("Sistema listo para registrar y actualizar usuarios.")

    def _crear_estilos(self):
        estilo = ttk.Style(self)
        estilo.theme_use("clam")
        estilo.configure("TFrame", background=COLOR_FONDO)
        estilo.configure("Topbar.TFrame", background=COLOR_TOPBAR)
        estilo.configure("Sidebar.TFrame", background=COLOR_SIDEBAR)
        estilo.configure("Card.TFrame", background=COLOR_BLANCO, relief="flat")
        estilo.configure("TLabel", background=COLOR_FONDO, foreground=COLOR_TEXTO, font=("Segoe UI", 10))
        estilo.configure("Title.TLabel", font=("Segoe UI", 14, "bold"), foreground=COLOR_TITULO)
        estilo.configure("Header.TLabel", font=("Segoe UI", 12, "bold"), foreground=COLOR_BLANCO, background=COLOR_TOPBAR)
        estilo.configure("Sidebar.TButton", background=COLOR_SIDEBAR, foreground=COLOR_BLANCO, borderwidth=0, padding=10, font=("Segoe UI", 10))
        estilo.map("Sidebar.TButton", background=[("active", "#3b4b61")])
        estilo.configure("Primary.TButton", background=COLOR_ACENTO, foreground=COLOR_BLANCO, padding=(14, 8), borderwidth=0, font=("Segoe UI", 10, "bold"))
        estilo.map("Primary.TButton", background=[("active", "#2558c5")])
        estilo.configure("Secondary.TButton", background="#e5e7eb", foreground=COLOR_TEXTO, padding=(14, 8), borderwidth=0, font=("Segoe UI", 10))
        estilo.map("Secondary.TButton", background=[("active", "#d1d5db")])
        estilo.configure("Search.TEntry", fieldbackground=COLOR_BLANCO, padding=6)
        estilo.configure("Top.TCombobox", fieldbackground=COLOR_BLANCO, padding=5)
        estilo.configure("Treeview", rowheight=28, font=("Segoe UI", 10))
        estilo.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))
        estilo.configure("CardTitle.TLabel", font=("Segoe UI", 10, "bold"), background=COLOR_BLANCO, foreground=COLOR_TEXTO)
        estilo.configure("CardValue.TLabel", font=("Segoe UI", 20, "bold"), background=COLOR_BLANCO, foreground=COLOR_TOPBAR)

    def _crear_layout(self):
        self.topbar = ttk.Frame(self, style="Topbar.TFrame", height=54)
        self.topbar.pack(side="top", fill="x")
        self.topbar.pack_propagate(False)
        self.sidebar = ttk.Frame(self, style="Sidebar.TFrame", width=220)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)
        self.contenedor = ttk.Frame(self, style="TFrame")
        self.contenedor.pack(side="right", fill="both", expand=True)
        self.contenido = ttk.Frame(self.contenedor, style="TFrame")
        self.contenido.pack(fill="both", expand=True, padx=18, pady=18)
        self.barra_estado = tk.Label(self, text="", anchor="w", bg="#dbe7ff", fg="#1f3a68", padx=14, pady=7)
        self.barra_estado.pack(side="bottom", fill="x")
        self._crear_topbar()
        self._crear_sidebar()

    def _crear_topbar(self):
        marca = tk.Label(self.topbar, text="📘 Loja Lee  |  Sistema de Gestión de Biblioteca",
                         bg=COLOR_TOPBAR, fg=COLOR_BLANCO, font=("Segoe UI", 11, "bold"))
        marca.pack(side="left", padx=16)
        selector = ttk.Combobox(
            self.topbar,
            textvariable=self.usuario_responsable,
            values=("Bibliotecario", "Administrador"),
            width=20,
            state="readonly",
            style="Top.TCombobox",
        )
        selector.pack(side="right", padx=16, pady=10)

    def _crear_sidebar(self):
        acciones = [
            ("🏠 Dashboard", "dashboard"),
            ("👥 Usuarios", "usuarios"),
            ("➕ Registrar usuario", "registrar"),
            ("📋 Listado de usuarios", "listado"),
            ("🕘 Historial cambios", "historial"),
            ("📊 Reportes", "reportes"),
            ("⚙ Configuración", "configuracion"),
        ]
        for texto, pantalla in acciones:
            ttk.Button(
                self.sidebar,
                text=texto,
                style="Sidebar.TButton",
                command=lambda p=pantalla: self.mostrar_pantalla(p),
            ).pack(fill="x", padx=10, pady=4, ipady=2)

    def registrar_pantalla(self, nombre: str, clase: type[ttk.Frame]):
        self._pantallas[nombre] = clase

    def mostrar_pantalla(self, nombre: str, **kwargs):
        for widget in self.contenido.winfo_children():
            widget.destroy()
        clase = self._pantallas.get(nombre)
        if not clase:
            self._mensaje(f"La pantalla '{nombre}' no está registrada.")
            return None
        pantalla = clase(self.contenido, self, **kwargs)
        pantalla.pack(fill="both", expand=True)
        return pantalla

    def _mensaje(self, texto: str):
        self.barra_estado.config(text=texto)

    def ruta_db(self) -> str:
        return str(Path(__file__).resolve().parent.parent / "biblioteca_loja_lee.db")

from __future__ import annotations

from tkinter import ttk
from servicio_usuarios import resumen_estadistico


class DashboardScreen(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._render()

    def _render(self):
        datos = resumen_estadistico()
        ttk.Label(self, text="Dashboard", style="Title.TLabel").pack(anchor="w")
        ttk.Label(
            self,
            text="Vista general del sistema de gestión de usuarios de la Biblioteca Municipal “Loja Lee”.",
        ).pack(anchor="w", pady=(2, 14))
        tarjetas = ttk.Frame(self)
        tarjetas.pack(fill="x")
        self._card(tarjetas, "Usuarios", datos["total"], 0)
        self._card(tarjetas, "Activos", datos["activos"], 1)
        self._card(tarjetas, "Inactivos", datos["inactivos"], 2)
        self._card(tarjetas, "Roles", len(datos["por_rol"]), 3)
        panel = ttk.Frame(self, style="Card.TFrame")
        panel.pack(fill="both", expand=True, pady=16)
        panel.columnconfigure(0, weight=1)
        panel.columnconfigure(1, weight=1)
        ttk.Label(panel, text="Accesos rápidos", style="CardTitle.TLabel").grid(row=0, column=0, sticky="w", padx=16, pady=(16, 8))
        for idx, (texto, ruta) in enumerate([
            ("Registrar nuevo usuario", "registrar"),
            ("Ver listado de usuarios", "listado"),
            ("Consultar historial", "historial"),
            ("Abrir reportes", "reportes"),
        ], start=1):
            ttk.Button(panel, text=texto, style="Primary.TButton",
                       command=lambda p=ruta: self.app.mostrar_pantalla(p)).grid(row=idx, column=0, sticky="w", padx=16, pady=6)
        ttk.Label(panel, text="Usuarios recientes", style="CardTitle.TLabel").grid(row=0, column=1, sticky="w", padx=16, pady=(16, 8))
        for i, usuario in enumerate(datos["recientes"] or [{"nombre": "Sin datos", "apellidos": "", "cedula": "", "rol": "", "estado": ""}]):
            texto = f"{usuario['nombre']} {usuario['apellidos']}  ·  {usuario['cedula']}  ·  {usuario['rol']}  ·  {usuario['estado']}"
            ttk.Label(panel, text=texto).grid(row=i + 1, column=1, sticky="w", padx=16, pady=4)

    def _card(self, parent, titulo, valor, col):
        frame = ttk.Frame(parent, style="Card.TFrame")
        frame.grid(row=0, column=col, sticky="nsew", padx=8)
        parent.columnconfigure(col, weight=1)
        ttk.Label(frame, text=titulo, style="CardTitle.TLabel").pack(anchor="w", padx=16, pady=(14, 0))
        ttk.Label(frame, text=str(valor), style="CardValue.TLabel").pack(anchor="w", padx=16, pady=(2, 14))

from __future__ import annotations

from tkinter import ttk

from servicio_usuarios import resumen_estadistico


class ReportesScreen(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._render()

    def _render(self):
        datos = resumen_estadistico()
        ttk.Label(self, text="Reportes", style="Title.TLabel").pack(anchor="w")
        ttk.Label(self, text="Resumen operativo del módulo de usuarios.").pack(anchor="w", pady=(2, 12))
        panel = ttk.Frame(self, style="Card.TFrame")
        panel.pack(fill="both", expand=True)
        items = [
            ("Total de usuarios", datos["total"]),
            ("Usuarios activos", datos["activos"]),
            ("Usuarios inactivos", datos["inactivos"]),
            ("Roles distintos", len(datos["por_rol"])),
        ]
        for i, (titulo, valor) in enumerate(items):
            caja = ttk.Frame(panel, style="Card.TFrame")
            caja.grid(row=0, column=i, sticky="nsew", padx=10, pady=14)
            panel.columnconfigure(i, weight=1)
            ttk.Label(caja, text=titulo, style="CardTitle.TLabel").pack(anchor="w", padx=14, pady=(14, 2))
            ttk.Label(caja, text=str(valor), style="CardValue.TLabel").pack(anchor="w", padx=14, pady=(0, 14))
        ttk.Label(panel, text="Distribución por rol", style="CardTitle.TLabel").grid(row=1, column=0, sticky="w", padx=14, pady=(10, 4))
        fila = 2
        for rol, cantidad in sorted(datos["por_rol"].items()) or [("Sin datos", 0)]:
            ttk.Label(panel, text=f"{rol}: {cantidad}").grid(row=fila, column=0, sticky="w", padx=14, pady=2)
            fila += 1
        ttk.Button(self, text="Volver al listado", style="Secondary.TButton",
                   command=lambda: self.app.mostrar_pantalla("listado")).pack(anchor="w", pady=10)

from __future__ import annotations

from tkinter import ttk


class ConfiguracionScreen(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._render()

    def _render(self):
        ttk.Label(self, text="Configuración", style="Title.TLabel").pack(anchor="w")
        panel = ttk.Frame(self, style="Card.TFrame")
        panel.pack(fill="both", expand=True, pady=12)
        textos = [
            "Base de datos: biblioteca_loja_lee.db",
            f"Ruta actual: {self.app.ruta_db()}",
            "Modo: prototipo local con SQLite",
            "Responsable activo: " + self.app.usuario_responsable.get(),
        ]
        for i, texto in enumerate(textos):
            ttk.Label(panel, text=texto).pack(anchor="w", padx=16, pady=(16 if i == 0 else 6, 0))
        ttk.Button(panel, text="Volver al dashboard", style="Primary.TButton",
                   command=lambda: self.app.mostrar_pantalla("dashboard")).pack(anchor="w", padx=16, pady=18)

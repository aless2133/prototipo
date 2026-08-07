from __future__ import annotations

from tkinter import ttk

from servicio_usuarios import listar_historial


class HistorialScreen(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self._render()

    def _render(self):
        ttk.Label(self, text="Historial de cambios", style="Title.TLabel").pack(anchor="w")
        ttk.Label(self, text="Registro de modificaciones por usuario y campo editado.").pack(anchor="w", pady=(2, 12))
        columnas = ("fecha", "usuario", "campo", "anterior", "nuevo", "responsable")
        tabla = ttk.Treeview(self, columns=columnas, show="headings")
        for col, titulo, ancho in [
            ("fecha", "Fecha", 150),
            ("usuario", "Usuario", 200),
            ("campo", "Campo", 120),
            ("anterior", "Valor anterior", 180),
            ("nuevo", "Valor nuevo", 180),
            ("responsable", "Responsable", 150),
        ]:
            tabla.heading(col, text=titulo)
            tabla.column(col, width=ancho, anchor="w")
        for fila in listar_historial():
            tabla.insert(
                "",
                "end",
                values=(
                    fila["fechaCambio"],
                    fila["nombreCompleto"],
                    fila["campoModificado"],
                    fila["valorAnterior"],
                    fila["valorNuevo"],
                    fila["usuarioResponsable"],
                ),
            )
        tabla.pack(fill="both", expand=True)
        ttk.Button(self, text="Volver al listado", style="Secondary.TButton",
                   command=lambda: self.app.mostrar_pantalla("listado")).pack(anchor="w", pady=10)

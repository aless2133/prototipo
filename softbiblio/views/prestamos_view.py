"""SoftBiblio - Vista de Préstamos y Devoluciones."""
import tkinter as tk
from tkinter import ttk, messagebox

from config.database import DIAS_PRESTAMO, MULTA_POR_DIA
from models import libro_model, prestamo_model, usuario_model
from views.widgets import crear_tabla, crear_buscador


class VistaPrestamos(ttk.Frame):
    def __init__(self, padre):
        super().__init__(padre)
        self.opciones_usuario = []
        self.opciones_libro = []

        self.crear_formulario_prestamo()
        self.crear_barra_busqueda()
        self.tabla = crear_tabla(
            self,
            ("id", "codigo", "socio", "libro", "f_prestamo",
             "f_limite", "f_devolucion", "multa", "estado"),
            ("ID", "Código", "Usuario", "Libro", "Préstamo",
             "Límite", "Devolución", "Multa", "Estado"),
            (35, 75, 160, 200, 85, 85, 85, 60, 70),
        )
        self.crear_botones_devolucion()
        self.recargar_combos()
        self.cargar()

    def crear_formulario_prestamo(self):
        marco = ttk.LabelFrame(self, text="Registrar préstamo")
        marco.pack(fill="x", padx=5, pady=5)

        ttk.Label(marco, text="Usuario:").grid(row=0, column=0, padx=5, pady=4, sticky="e")
        self.cmb_usuario = ttk.Combobox(marco, state="readonly", width=45)
        self.cmb_usuario.grid(row=0, column=1, padx=5, pady=4)

        ttk.Label(marco, text="Libro:").grid(row=1, column=0, padx=5, pady=4, sticky="e")
        self.cmb_libro = ttk.Combobox(marco, state="readonly", width=45)
        self.cmb_libro.grid(row=1, column=1, padx=5, pady=4)

        ttk.Button(marco, text="Registrar préstamo",
                   command=self.registrar_prestamo).grid(row=0, column=2, rowspan=2, padx=10)

        ttk.Label(
            marco,
            text=f"Plazo: {DIAS_PRESTAMO} días · Multa por retraso: ${MULTA_POR_DIA:.2f}/día",
        ).grid(row=2, column=0, columnspan=3, padx=5, sticky="w", pady=(0, 5))

    def crear_barra_busqueda(self):
        marco, self.entrada_busqueda = crear_buscador(self, self.cargar)
        self.solo_pendientes = tk.BooleanVar(value=True)
        ttk.Checkbutton(marco, text="Solo pendientes",
                        variable=self.solo_pendientes,
                        command=self.cargar).pack(side="left", padx=(10, 0))

    def crear_botones_devolucion(self):
        marco = ttk.Frame(self)
        marco.pack(fill="x", padx=5, pady=(0, 5))
        ttk.Button(marco, text="Registrar devolución",
                   command=self.registrar_devolucion).pack(side="left", padx=3)

    def recargar_combos(self):
        self.opciones_usuario = usuario_model.opciones_activos()
        self.opciones_libro = libro_model.opciones_disponibles()
        self.cmb_usuario["values"] = [etiqueta for _, etiqueta in self.opciones_usuario]
        self.cmb_libro["values"] = [etiqueta for _, etiqueta in self.opciones_libro]
        self.cmb_usuario.set("")
        self.cmb_libro.set("")

    def _id_seleccionado(self, combo, opciones):
        indice = combo.current()
        return opciones[indice][0] if indice >= 0 else None

    def registrar_prestamo(self):
        usuario_id = self._id_seleccionado(self.cmb_usuario, self.opciones_usuario)
        libro_id = self._id_seleccionado(self.cmb_libro, self.opciones_libro)
        if usuario_id is None or libro_id is None:
            messagebox.showwarning("Aviso", "Seleccione un usuario y un libro.")
            return
        ok, mensaje = prestamo_model.registrar_prestamo(usuario_id, libro_id)
        if ok:
            messagebox.showinfo("Éxito", mensaje)
        else:
            messagebox.showerror("Error", mensaje)
        self.recargar_combos()
        self.cargar()

    def registrar_devolucion(self):
        seleccion = self.tabla.selection()
        if not seleccion:
            messagebox.showwarning("Aviso", "Seleccione un préstamo de la tabla.")
            return
        prestamo_id = int(self.tabla.item(seleccion[0], "values")[0])
        ok, mensaje = prestamo_model.registrar_devolucion(prestamo_id)
        if ok:
            messagebox.showinfo("Éxito", mensaje)
        else:
            messagebox.showerror("Error", mensaje)
        self.recargar_combos()
        self.cargar()

    def cargar(self):
        for fila in self.tabla.get_children():
            self.tabla.delete(fila)
        filas = prestamo_model.listar(
            self.entrada_busqueda.get().strip(),
            solo_pendientes=self.solo_pendientes.get(),
        )
        for fila in filas:
            self.tabla.insert("", "end", values=fila)
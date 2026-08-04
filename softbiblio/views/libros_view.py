"""SoftBiblio - Vista de Libros."""
from tkinter import ttk, messagebox

from models import libro_model
from views.widgets import crear_entrada, crear_tabla, crear_buscador


class VistaLibros(ttk.Frame):
    def __init__(self, padre):
        super().__init__(padre)
        self.libro_id = None

        self.crear_formulario()
        self.crear_botones()
        _, self.entrada_busqueda = crear_buscador(self, self.cargar)
        self.tabla = crear_tabla(
            self,
            ("id", "codigo", "titulo", "autor", "isbn",
             "anio", "ejemplares", "disponibles"),
            ("ID", "Código", "Título", "Autor", "ISBN",
             "Año", "Ejemp.", "Disp."),
            (35, 75, 230, 160, 110, 50, 55, 50),
        )
        self.tabla.bind("<<TreeviewSelect>>", self.al_seleccionar)
        self.cargar()

    def crear_formulario(self):
        marco = ttk.LabelFrame(self, text="Datos del libro")
        marco.pack(fill="x", padx=5, pady=5)
        self.ent_titulo = crear_entrada(marco, 0, 0, "Título:*", ancho=30)
        self.ent_autor = crear_entrada(marco, 0, 2, "Autor:*")
        self.ent_isbn = crear_entrada(marco, 1, 0, "ISBN:")
        self.ent_anio = crear_entrada(marco, 1, 2, "Año:")
        self.ent_ejemplares = crear_entrada(marco, 2, 0, "Ejemplares:*")

    def crear_botones(self):
        marco = ttk.Frame(self)
        marco.pack(fill="x", padx=5, pady=(0, 5))
        ttk.Button(marco, text="Registrar", command=self.registrar).pack(side="left", padx=3)
        ttk.Button(marco, text="Actualizar", command=self.actualizar).pack(side="left", padx=3)
        ttk.Button(marco, text="Limpiar", command=self.limpiar).pack(side="left", padx=3)

    def leer_formulario(self):
        return {
            "titulo": self.ent_titulo.get().strip(),
            "autor": self.ent_autor.get().strip(),
            "isbn": self.ent_isbn.get().strip() or None,
            "anio": self.ent_anio.get().strip() or None,
            "ejemplares": self.ent_ejemplares.get().strip(),
        }

    def registrar(self):
        ok, mensaje = libro_model.registrar(self.leer_formulario())
        if ok:
            messagebox.showinfo("Éxito", mensaje)
        else:
            messagebox.showerror("Error", mensaje)
        self.limpiar()
        self.cargar()

    def actualizar(self):
        if self.libro_id is None:
            messagebox.showwarning("Aviso", "Seleccione un libro de la tabla para actualizar.")
            return
        ok, mensaje = libro_model.actualizar(self.libro_id, self.leer_formulario())
        if ok:
            messagebox.showinfo("Éxito", mensaje)
        else:
            messagebox.showerror("Error", mensaje)
        self.limpiar()
        self.cargar()

    def cargar(self):
        for fila in self.tabla.get_children():
            self.tabla.delete(fila)
        for libro in libro_model.listar(self.entrada_busqueda.get().strip()):
            self.tabla.insert("", "end", values=libro)

    def al_seleccionar(self, evento):
        seleccion = self.tabla.selection()
        if not seleccion:
            return
        valores = self.tabla.item(seleccion[0], "values")
        self.limpiar()
        self.libro_id = int(valores[0])
        self.ent_titulo.insert(0, valores[2])
        self.ent_autor.insert(0, valores[3])
        if valores[4] != "-":
            self.ent_isbn.insert(0, valores[4])
        if valores[5] != "-":
            self.ent_anio.insert(0, valores[5])
        self.ent_ejemplares.insert(0, valores[6])

    def limpiar(self):
        for entrada in (self.ent_titulo, self.ent_autor, self.ent_isbn,
                        self.ent_anio, self.ent_ejemplares):
            entrada.delete(0, "end")
        self.libro_id = None
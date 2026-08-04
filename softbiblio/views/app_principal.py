"""SoftBiblio - Ventana principal con módulos en pestañas."""
from tkinter import ttk

from views.usuarios_view import VistaUsuarios
from views.libros_view import VistaLibros
from views.prestamos_view import VistaPrestamos


class AppPrincipal:
    def __init__(self, raiz):
        self.raiz = raiz
        raiz.title("SoftBiblio - Sistema de Gestión de Biblioteca")
        raiz.geometry("1000x640")

        estilo = ttk.Style()
        estilo.configure("Treeview.Heading", font=("Segoe UI", 9, "bold"))

        cuaderno = ttk.Notebook(raiz)
        cuaderno.pack(fill="both", expand=True, padx=8, pady=8)

        cuaderno.add(VistaUsuarios(cuaderno), text="  Usuarios  ")
        cuaderno.add(VistaLibros(cuaderno), text="  Libros  ")
        cuaderno.add(VistaPrestamos(cuaderno), text="  Préstamos y Devoluciones  ")
"""SoftBiblio - Componentes de interfaz."""
from tkinter import ttk


def crear_entrada(padre, fila, columna, etiqueta, ancho=25):
    """Etiqueta + campo de texto en un grid. Devuelve el Entry."""
    ttk.Label(padre, text=etiqueta).grid(
        row=fila, column=columna, padx=5, pady=4, sticky="e"
    )
    entrada = ttk.Entry(padre, width=ancho)
    entrada.grid(row=fila, column=columna + 1, padx=5, pady=4)
    return entrada


def crear_tabla(padre, columnas, encabezados, anchos):
    """Treeview con scrollbar vertical. Devuelve el Treeview."""
    marco = ttk.Frame(padre)
    marco.pack(fill="both", expand=True, padx=5, pady=(0, 5))

    tabla = ttk.Treeview(marco, columns=columnas, show="headings", height=10)
    scroll = ttk.Scrollbar(marco, orient="vertical", command=tabla.yview)
    tabla.configure(yscrollcommand=scroll.set)

    for col, enc, ancho in zip(columnas, encabezados, anchos):
        tabla.heading(col, text=enc)
        tabla.column(col, width=ancho, anchor="w")

    scroll.pack(side="right", fill="y")
    tabla.pack(side="left", fill="both", expand=True)
    return tabla


def crear_buscador(padre, comando):
    """Barra de búsqueda (busca al escribir Enter o pulsar Buscar).
    Devuelve (marco, entrada) para poder agregar widgets extra."""
    marco = ttk.Frame(padre)
    marco.pack(fill="x", padx=5, pady=(0, 5))
    ttk.Label(marco, text="Buscar:").pack(side="left", padx=(0, 5))
    entrada = ttk.Entry(marco, width=45)
    entrada.pack(side="left", fill="x", expand=True)
    ttk.Button(marco, text="Buscar", command=comando).pack(side="left", padx=(5, 0))
    entrada.bind("<Return>", lambda evento: comando())
    return marco, entrada
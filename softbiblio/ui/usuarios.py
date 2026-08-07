from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from servicio_usuarios import crear_usuario, listar_usuarios, obtener_usuario, actualizar_usuario
from validaciones import ErrorValidacion, ROLES, ESTADOS


class UsuariosScreen(ttk.Frame):
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        self.busqueda = tk.StringVar()
        self.estado = tk.StringVar(value="Todos")
        self._render()

    def _render(self):
        ttk.Label(self, text="Listado de usuarios", style="Title.TLabel").pack(anchor="w")
        barra = ttk.Frame(self)
        barra.pack(fill="x", pady=(10, 12))
        ttk.Entry(barra, textvariable=self.busqueda, width=34, style="Search.TEntry").pack(side="left")
        ttk.Combobox(barra, textvariable=self.estado, values=("Todos",) + ESTADOS, width=12, state="readonly").pack(side="left", padx=8)
        ttk.Button(barra, text="Buscar", style="Secondary.TButton", command=self.refrescar).pack(side="left", padx=4)
        ttk.Button(barra, text="Nuevo usuario", style="Primary.TButton", command=lambda: self.app.mostrar_pantalla("registrar")).pack(side="right")
        ttk.Button(barra, text="Historial", style="Secondary.TButton", command=lambda: self.app.mostrar_pantalla("historial")).pack(side="right", padx=8)

        columnas = ("id", "nombre", "cedula", "rol", "estado", "fecha")
        self.tabla = ttk.Treeview(self, columns=columnas, show="headings")
        encabezados = {
            "id": "#",
            "nombre": "Nombre completo",
            "cedula": "Cédula",
            "rol": "Rol",
            "estado": "Estado",
            "fecha": "Fecha de registro",
        }
        anchuras = {"id": 60, "nombre": 240, "cedula": 120, "rol": 120, "estado": 90, "fecha": 160}
        for col in columnas:
            self.tabla.heading(col, text=encabezados[col])
            self.tabla.column(col, width=anchuras[col], anchor="w")
        self.tabla.pack(fill="both", expand=True, pady=(0, 10))
        self.tabla.bind("<Double-1>", self._editar_seleccion)
        botones = ttk.Frame(self)
        botones.pack(fill="x")
        ttk.Button(botones, text="Editar seleccionado", style="Primary.TButton", command=self._editar_seleccion).pack(side="left")
        ttk.Button(botones, text="Actualizar lista", style="Secondary.TButton", command=self.refrescar).pack(side="left", padx=8)
        self.refrescar()

    def refrescar(self):
        for item in self.tabla.get_children():
            self.tabla.delete(item)
        for usuario in listar_usuarios(self.busqueda.get(), self.estado.get()):
            self.tabla.insert("", "end", values=(
                usuario["idUsuario"],
                f'{usuario["nombre"]} {usuario["apellidos"]}',
                usuario["cedula"],
                usuario["rol"],
                usuario["estado"],
                usuario["fechaRegistro"],
            ))
        self.app._mensaje("Listado actualizado.")

    def _editar_seleccion(self, event=None):
        item = self.tabla.focus()
        if not item:
            return
        id_usuario = int(self.tabla.item(item)["values"][0])
        self.app.mostrar_pantalla("editar", idUsuario=id_usuario)


class UsuarioFormScreen(ttk.Frame):
    def __init__(self, parent, app, modo: str, idUsuario: int | None = None):
        super().__init__(parent)
        self.app = app
        self.modo = modo
        self.idUsuario = idUsuario
        self.vars = {k: tk.StringVar() for k in ("nombre", "apellidos", "cedula", "correo", "telefono", "direccion", "rol", "estado")}
        self._render()
        if idUsuario is not None:
            self._cargar()

    def _render(self):
        titulo = "Registrar nuevo usuario" if self.modo == "registrar" else "Actualizar usuario"
        ttk.Label(self, text=titulo, style="Title.TLabel").pack(anchor="w")
        self.form = ttk.Frame(self, style="Card.TFrame")
        self.form.pack(fill="both", expand=True, pady=12)
        for col in (0, 1):
            self.form.columnconfigure(col, weight=1)

        izquierda = ttk.Frame(self.form, style="Card.TFrame")
        derecha = ttk.Frame(self.form, style="Card.TFrame")
        izquierda.grid(row=0, column=0, sticky="nsew", padx=(16, 10), pady=16)
        derecha.grid(row=0, column=1, sticky="nsew", padx=(10, 16), pady=16)

        campos_izq = [("Nombre*", "nombre"), ("Apellidos*", "apellidos"), ("Cédula*", "cedula"), ("Email*", "correo"), ("Teléfono*", "telefono")]
        campos_der = [("Dirección*", "direccion"), ("Rol*", "rol", True), ("Estado*", "estado", True)]
        self._crear_campos(izquierda, campos_izq)
        self._crear_campos(derecha, campos_der)
        ttk.Label(derecha, text="* Campos obligatorios", style="CardTitle.TLabel").grid(row=10, column=0, sticky="w", pady=(8, 0))

        if self.modo == "editar":
            self.entry_cedula.config(state="disabled")

        acciones = ttk.Frame(self)
        acciones.pack(fill="x", pady=(0, 8))
        ttk.Button(acciones, text="← Volver al listado", style="Secondary.TButton", command=lambda: self.app.mostrar_pantalla("listado")).pack(side="left")
        ttk.Button(acciones, text="Cancelar", style="Secondary.TButton", command=lambda: self.app.mostrar_pantalla("listado")).pack(side="right")
        ttk.Button(acciones, text="Guardar", style="Primary.TButton", command=self.guardar).pack(side="right", padx=8)

    def _crear_campos(self, contenedor, campos):
        contenedor.columnconfigure(0, weight=1)
        fila = 0
        for item in campos:
            etiqueta, clave = item[0], item[1]
            es_combo = len(item) > 2 and item[2]
            ttk.Label(contenedor, text=etiqueta, style="CardTitle.TLabel").grid(row=fila, column=0, sticky="w", pady=(0, 2))
            if es_combo:
                valores = ROLES if clave == "rol" else ESTADOS
                widget = ttk.Combobox(contenedor, textvariable=self.vars[clave], values=valores, state="readonly")
            else:
                widget = ttk.Entry(contenedor, textvariable=self.vars[clave], width=34)
            widget.grid(row=fila + 1, column=0, sticky="ew", pady=(0, 12))
            setattr(self, f"entry_{clave}", widget)
            fila += 2

    def _cargar(self):
        usuario = obtener_usuario(self.idUsuario)
        if not usuario:
            self.app._mensaje("El usuario solicitado no existe.")
            self.app.mostrar_pantalla("listado")
            return
        for clave in self.vars:
            self.vars[clave].set(usuario.get(clave, ""))

    def guardar(self):
        datos = {k: v.get() for k, v in self.vars.items()}
        if self.modo == "editar":
            datos["idUsuario"] = self.idUsuario
        try:
            if self.modo == "registrar":
                nuevo_id = crear_usuario(datos, self.app.usuario_responsable.get())
                self.app._mensaje(f"Usuario registrado correctamente con código #{nuevo_id}.")
            else:
                actualizar_usuario(datos, self.app.usuario_responsable.get())
                self.app._mensaje("Usuario actualizado correctamente.")
            self.app.mostrar_pantalla("listado")
        except ErrorValidacion as exc:
            self.app._mensaje(str(exc))

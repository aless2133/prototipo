from dataclasses import dataclass


@dataclass(slots=True)
class Usuario:
    idUsuario: int | None
    nombre: str
    apellidos: str
    cedula: str
    correo: str
    telefono: str
    direccion: str
    rol: str
    estado: str
    fechaRegistro: str | None = None
    idBibliotecario: int | None = None


@dataclass(slots=True)
class HistorialCambio:
    idCambio: int | None
    idUsuario: int
    campoModificado: str
    valorAnterior: str
    valorNuevo: str
    fechaCambio: str | None
    usuarioResponsable: str

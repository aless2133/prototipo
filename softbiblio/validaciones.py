import re

ROLES = ("Lector", "Estudiante", "Docente", "Investigador", "Administrativo")
ESTADOS = ("Activo", "Inactivo")


class ErrorValidacion(ValueError):
    pass


def limpiar_texto(valor: str) -> str:
    return " ".join((valor or "").strip().split())


def validar_correo(correo: str) -> None:
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", correo or ""):
        raise ErrorValidacion("El correo electrónico no tiene un formato válido.")


def validar_cedula(cedula: str) -> None:
    if not re.fullmatch(r"\d{10}", cedula or ""):
        raise ErrorValidacion("La cédula debe tener exactamente 10 dígitos.")


def validar_telefono(telefono: str) -> None:
    if not re.fullmatch(r"\d{7,10}", telefono or ""):
        raise ErrorValidacion("El teléfono debe tener entre 7 y 10 dígitos.")


def validar_usuario(datos: dict, es_actualizacion: bool = False) -> dict:
    nombre = limpiar_texto(datos.get("nombre"))
    apellidos = limpiar_texto(datos.get("apellidos"))
    cedula = limpiar_texto(datos.get("cedula"))
    correo = limpiar_texto(datos.get("correo"))
    telefono = limpiar_texto(datos.get("telefono"))
    direccion = limpiar_texto(datos.get("direccion"))
    rol = limpiar_texto(datos.get("rol"))
    estado = limpiar_texto(datos.get("estado"))

    if not nombre:
        raise ErrorValidacion("El nombre es obligatorio.")
    if not apellidos:
        raise ErrorValidacion("Los apellidos son obligatorios.")
    validar_cedula(cedula)
    validar_correo(correo)
    validar_telefono(telefono)
    if not direccion:
        raise ErrorValidacion("La dirección es obligatoria.")
    if rol not in ROLES:
        raise ErrorValidacion("Seleccione un rol válido.")
    if estado not in ESTADOS:
        raise ErrorValidacion("Seleccione un estado válido.")

    limpio = {
        "nombre": nombre,
        "apellidos": apellidos,
        "cedula": cedula,
        "correo": correo,
        "telefono": telefono,
        "direccion": direccion,
        "rol": rol,
        "estado": estado,
    }
    if es_actualizacion:
        limpio["idUsuario"] = int(datos["idUsuario"])
    return limpio


def cambios_detectados(antes: dict, despues: dict) -> list[tuple[str, str, str]]:
    campos = ("nombre", "apellidos", "cedula", "correo", "telefono", "direccion", "rol", "estado")
    cambios = []
    for campo in campos:
        viejo = str(antes.get(campo, "") or "")
        nuevo = str(despues.get(campo, "") or "")
        if viejo != nuevo:
            cambios.append((campo, viejo, nuevo))
    return cambios

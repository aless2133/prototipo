"""SoftBiblio - Validaciones reutilizables."""
import re
from datetime import datetime, timedelta

FORMATO_FECHA = "%Y-%m-%d"
PATRON_CORREO = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


def validar_correo(correo):
    """Formato de correo válido (caso de uso <<include>>)."""
    return re.match(PATRON_CORREO, correo or "") is not None


def validar_cedula(cedula):
    """Cédula de 6 a 13 dígitos numéricos."""
    return (cedula or "").isdigit() and 6 <= len(cedula) <= 13


def validar_texto(texto, minimo=2):
    return len((texto or "").strip()) >= minimo


def validar_entero_positivo(valor):
    try:
        return int(valor) >= 1
    except (TypeError, ValueError):
        return False


def hoy():
    return datetime.now().strftime(FORMATO_FECHA)


def ahora():
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def sumar_dias(fecha_str, dias):
    fecha = datetime.strptime(fecha_str, FORMATO_FECHA)
    return (fecha + timedelta(days=dias)).strftime(FORMATO_FECHA)


def dias_entre(fecha_limite, fecha_devolucion):
    """Días de retraso (> 0 si se devolvió tarde)."""
    limite = datetime.strptime(fecha_limite, FORMATO_FECHA)
    devuelto = datetime.strptime(fecha_devolucion, FORMATO_FECHA)
    return (devuelto - limite).days
"""SoftBiblio - Capa de datos de Préstamos y Devoluciones."""
from config.database import DIAS_PRESTAMO, MULTA_POR_DIA, conectar, consultar
from utils.validaciones import hoy, sumar_dias, dias_entre


def listar(busqueda="", solo_pendientes=False):
    """Buscador por usuario, título, código de libro o código de préstamo
    (criterio de aceptación 2 de HU-04)."""
    sql = """SELECT p.id, p.codigo_prestamo,
                    u.nombre || ' ' || u.apellido,
                    l.titulo, p.fecha_prestamo, p.fecha_limite,
                    COALESCE(p.fecha_devolucion, '-'),
                    p.multa, p.estado
             FROM prestamos p
             JOIN usuarios u ON u.id = p.usuario_id
             JOIN libros l ON l.id = p.libro_id"""
    condiciones, params = [], []
    if solo_pendientes:
        condiciones.append("p.estado = 'Prestado'")
    if busqueda:
        like = f"%{busqueda}%"
        condiciones.append(
            "(u.nombre LIKE ? OR u.apellido LIKE ? OR l.titulo LIKE ? "
            "OR l.codigo_libro LIKE ? OR p.codigo_prestamo LIKE ?)"
        )
        params.extend([like] * 5)
    if condiciones:
        sql += " WHERE " + " AND ".join(condiciones)
    sql += " ORDER BY p.id DESC"
    return consultar(sql, params)


def _generar_codigo(conexion):
    codigos = [f[0] for f in conexion.execute("SELECT codigo_prestamo FROM prestamos")]
    numeros = [int(c[4:]) for c in codigos if c.startswith("PRE-") and c[4:].isdigit()]
    return f"PRE-{max(numeros, default=0) + 1:04d}"


def registrar_prestamo(usuario_id, libro_id):
    """Presta un libro: valida usuario activo y disponibilidad (transacción)."""
    conexion = conectar()
    try:
        usuario = conexion.execute(
            "SELECT estado FROM usuarios WHERE id = ?", (usuario_id,)
        ).fetchone()
        if usuario is None:
            return False, "Seleccione un usuario válido."
        if usuario[0] != "Activo":
            return False, "El usuario seleccionado está inactivo."

        libro = conexion.execute(
            "SELECT disponibles FROM libros WHERE id = ?", (libro_id,)
        ).fetchone()
        if libro is None:
            return False, "Seleccione un libro válido."
        if libro[0] < 1:
            return False, "No hay ejemplares disponibles de ese libro."

        fecha_limite = sumar_dias(hoy(), DIAS_PRESTAMO)
        conexion.execute(
            "UPDATE libros SET disponibles = disponibles - 1 WHERE id = ?",
            (libro_id,),
        )
        conexion.execute(
            """INSERT INTO prestamos
               (codigo_prestamo, usuario_id, libro_id,
                fecha_prestamo, fecha_limite, estado)
               VALUES (?, ?, ?, ?, ?, 'Prestado')""",
            (_generar_codigo(conexion), usuario_id, libro_id, hoy(), fecha_limite),
        )
        conexion.commit()
        return True, f"Préstamo registrado. Fecha límite de devolución: {fecha_limite}."
    finally:
        conexion.close()


def registrar_devolucion(prestamo_id):
    """HU-04: registra devolución, actualiza disponibilidad y calcula multa."""
    conexion = conectar()
    try:
        fila = conexion.execute(
            "SELECT estado, libro_id, fecha_limite FROM prestamos WHERE id = ?",
            (prestamo_id,),
        ).fetchone()
        if fila is None:
            return False, "Seleccione un préstamo de la tabla."
        if fila[0] == "Devuelto":
            return False, "El préstamo seleccionado ya fue devuelto."

        _, libro_id, fecha_limite = fila
        dias_mora = max(0, dias_entre(fecha_limite, hoy()))
        multa = round(dias_mora * MULTA_POR_DIA, 2)

        conexion.execute(
            """UPDATE prestamos
               SET estado = 'Devuelto', fecha_devolucion = ?, multa = ?
               WHERE id = ?""",
            (hoy(), multa, prestamo_id),
        )
        conexion.execute(
            "UPDATE libros SET disponibles = disponibles + 1 WHERE id = ?",
            (libro_id,),
        )
        conexion.commit()

        if multa > 0:
            return True, (f"Devolución registrada con {dias_mora} día(s) "
                          f"de retraso. Multa: ${multa:.2f}")
        return True, "Devolución registrada a tiempo. Sin multa."
    finally:
        conexion.close()
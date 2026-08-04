"""SoftBiblio - Capa de datos de Libros."""
from config.database import conectar, consultar
from utils.validaciones import validar_entero_positivo, validar_texto


def listar(busqueda=""):
    """Buscador por título, autor, código o ISBN."""
    sql = """SELECT id, codigo_libro, titulo, autor,
                    COALESCE(isbn, '-'), COALESCE(anio, '-'),
                    ejemplares, disponibles
             FROM libros"""
    params = ()
    if busqueda:
        like = f"%{busqueda}%"
        sql += " WHERE titulo LIKE ? OR autor LIKE ? OR codigo_libro LIKE ? OR isbn LIKE ?"
        params = (like, like, like, like)
    sql += " ORDER BY titulo"
    return consultar(sql, params)


def opciones_disponibles():
    """Libros con ejemplares disponibles para el combobox de préstamos."""
    return consultar("""SELECT id, codigo_libro || ' - ' || titulo
                               || ' (disp: ' || disponibles || ')'
                        FROM libros WHERE disponibles > 0 ORDER BY titulo""")


def generar_codigo_libro():
    codigos = [f[0] for f in consultar("SELECT codigo_libro FROM libros")]
    numeros = [int(c[4:]) for c in codigos if c.startswith("LIB-") and c[4:].isdigit()]
    return f"LIB-{max(numeros, default=0) + 1:04d}"


def validar_datos(datos):
    if not validar_texto(datos["titulo"]) or not validar_texto(datos["autor"]):
        return "Título y autor son obligatorios."
    if not validar_entero_positivo(datos["ejemplares"]):
        return "Ejemplares debe ser un entero mayor o igual a 1."
    return None


def registrar(datos):
    error = validar_datos(datos)
    if error:
        return False, error
    conexion = conectar()
    try:
        conexion.execute(
            """INSERT INTO libros
               (codigo_libro, titulo, autor, isbn, anio, ejemplares, disponibles)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (generar_codigo_libro(), datos["titulo"], datos["autor"],
             datos["isbn"], datos["anio"],
             int(datos["ejemplares"]), int(datos["ejemplares"])),
        )
        conexion.commit()
        return True, "Libro registrado correctamente."
    finally:
        conexion.close()


def actualizar(libro_id, datos):
    error = validar_datos(datos)
    if error:
        return False, error
    conexion = conectar()
    try:
        actual = conexion.execute(
            "SELECT ejemplares, disponibles FROM libros WHERE id = ?",
            (libro_id,),
        ).fetchone()
        if actual is None:
            return False, "Libro no encontrado."
        prestados = actual[0] - actual[1]
        nuevos_disponibles = int(datos["ejemplares"]) - prestados
        if nuevos_disponibles < 0:
            return False, (f"Hay {prestados} ejemplar(es) prestado(s); "
                           f"no puede registrar menos de {prestados}.")
        conexion.execute(
            """UPDATE libros
               SET titulo = ?, autor = ?, isbn = ?, anio = ?,
                   ejemplares = ?, disponibles = ?
               WHERE id = ?""",
            (datos["titulo"], datos["autor"], datos["isbn"], datos["anio"],
             int(datos["ejemplares"]), nuevos_disponibles, libro_id),
        )
        conexion.commit()
        return True, "Libro actualizado correctamente."
    finally:
        conexion.close()
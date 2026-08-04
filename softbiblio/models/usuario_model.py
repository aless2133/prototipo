"""SoftBiblio - Capa de datos de Usuarios."""
from config.database import conectar, consultar
from utils.validaciones import ahora, validar_cedula, validar_correo, validar_texto


def listar(busqueda=""):
    """Lista usuarios con buscador sobre nombre, apellido, cédula, correo y código."""
    sql = """SELECT id, codigo_socio, nombre, apellido, cedula, correo,
                    telefono, estado
             FROM usuarios"""
    params = ()
    if busqueda:
        like = f"%{busqueda}%"
        sql += """ WHERE nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ?
                   OR correo LIKE ? OR codigo_socio LIKE ?"""
        params = (like, like, like, like, like)
    sql += " ORDER BY id DESC"
    return consultar(sql, params)


def opciones_activos():
    """Usuarios activos para el combobox de préstamos."""
    return consultar("""SELECT id, codigo_socio || ' - ' || nombre || ' ' || apellido
                        FROM usuarios WHERE estado = 'Activo' ORDER BY nombre""")


def campo_duplicado(campo, valor, id_excluir=None):
    """Verifica unicidad (cédula / correo) excluyendo al propio registro."""
    sql = f"SELECT 1 FROM usuarios WHERE {campo} = ?"
    params = [valor]
    if id_excluir is not None:
        sql += " AND id != ?"
        params.append(id_excluir)
    return consultar(sql, params) != []


def generar_codigo_socio():
    """generarCodigoSocio() del UML: nunca colisiona aunque se borren registros."""
    codigos = [f[0] for f in consultar("SELECT codigo_socio FROM usuarios")]
    numeros = [int(c[4:]) for c in codigos if c.startswith("SOC-") and c[4:].isdigit()]
    return f"SOC-{max(numeros, default=0) + 1:04d}"


def validar_datos(datos):
    if not validar_texto(datos["nombre"]) or not validar_texto(datos["apellido"]):
        return "Nombre y apellido son obligatorios."
    if not validar_cedula(datos["cedula"]):
        return "Cédula inválida: debe tener de 6 a 13 dígitos."
    if not validar_correo(datos["correo"]):
        return "El correo no tiene un formato válido."
    return None


def registrar(datos):
    """HU-01: valida y registra. Devuelve (ok, mensaje)."""
    error = validar_datos(datos)
    if error:
        return False, error
    if campo_duplicado("cedula", datos["cedula"]):
        return False, "Ya existe un usuario registrado con esa cédula."
    if campo_duplicado("correo", datos["correo"]):
        return False, "Ya existe un usuario registrado con ese correo."

    conexion = conectar()
    try:
        conexion.execute(
            """INSERT INTO usuarios
               (codigo_socio, nombre, apellido, cedula, correo, telefono,
                estado, fecha_registro)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (generar_codigo_socio(), datos["nombre"], datos["apellido"],
             datos["cedula"], datos["correo"], datos["telefono"],
             datos["estado"], ahora()),
        )
        conexion.commit()
        return True, "Usuario registrado correctamente."
    finally:
        conexion.close()


def actualizar(usuario_id, datos):
    """HU-02: actualiza datos manteniendo la unicidad."""
    error = validar_datos(datos)
    if error:
        return False, error
    if campo_duplicado("cedula", datos["cedula"], usuario_id):
        return False, "Otro usuario ya tiene esa cédula."
    if campo_duplicado("correo", datos["correo"], usuario_id):
        return False, "Otro usuario ya tiene ese correo."

    conexion = conectar()
    try:
        conexion.execute(
            """UPDATE usuarios
               SET nombre = ?, apellido = ?, cedula = ?, correo = ?,
                   telefono = ?, estado = ?
               WHERE id = ?""",
            (datos["nombre"], datos["apellido"], datos["cedula"],
             datos["correo"], datos["telefono"], datos["estado"], usuario_id),
        )
        conexion.commit()
        return True, "Usuario actualizado correctamente."
    finally:
        conexion.close()
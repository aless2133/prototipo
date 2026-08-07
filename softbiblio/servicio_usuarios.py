from __future__ import annotations

from collections import Counter
from base_datos import obtener_conexion
from validaciones import ErrorValidacion, validar_usuario, cambios_detectados


def _fila_a_dict(fila):
    return dict(fila) if fila else None


def listar_usuarios(busqueda: str = "", estado: str = "Todos") -> list[dict]:
    consulta = "SELECT * FROM usuarios"
    filtros = []
    parametros: list[str] = []
    if busqueda:
        filtros.append(
            "(nombre LIKE ? OR apellidos LIKE ? OR cedula LIKE ? OR correo LIKE ? OR rol LIKE ?)"
        )
        patron = f"%{busqueda.strip()}%"
        parametros.extend([patron] * 5)
    if estado and estado != "Todos":
        filtros.append("estado = ?")
        parametros.append(estado)
    if filtros:
        consulta += " WHERE " + " AND ".join(filtros)
    consulta += " ORDER BY idUsuario DESC"
    with obtener_conexion() as conexion:
        filas = conexion.execute(consulta, parametros).fetchall()
    return [dict(fila) for fila in filas]


def obtener_usuario(id_usuario: int) -> dict | None:
    with obtener_conexion() as conexion:
        fila = conexion.execute(
            "SELECT * FROM usuarios WHERE idUsuario = ?",
            (id_usuario,),
        ).fetchone()
    return _fila_a_dict(fila)


def _cedula_duplicada(cedula: str, excluir_id: int | None = None) -> bool:
    consulta = "SELECT COUNT(*) AS total FROM usuarios WHERE cedula = ?"
    parametros: list[object] = [cedula]
    if excluir_id is not None:
        consulta += " AND idUsuario <> ?"
        parametros.append(excluir_id)
    with obtener_conexion() as conexion:
        total = conexion.execute(consulta, parametros).fetchone()["total"]
    return total > 0


def _registrar_historial(id_usuario: int, cambios: list[tuple[str, str, str]], responsable: str) -> None:
    if not cambios:
        return
    with obtener_conexion() as conexion:
        for campo, anterior, nuevo in cambios:
            conexion.execute(
                """
                INSERT INTO historial_cambios
                (idUsuario, campoModificado, valorAnterior, valorNuevo, usuarioResponsable)
                VALUES (?, ?, ?, ?, ?)
                """,
                (id_usuario, campo, anterior, nuevo, responsable),
            )
        conexion.commit()


def crear_usuario(datos: dict, responsable: str = "Bibliotecario") -> int:
    limpio = validar_usuario(datos)
    if _cedula_duplicada(limpio["cedula"]):
        raise ErrorValidacion("Ya existe un usuario con esa cédula.")
    with obtener_conexion() as conexion:
        cursor = conexion.execute(
            """
            INSERT INTO usuarios
            (nombre, apellidos, cedula, correo, telefono, direccion, rol, estado, idBibliotecario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                limpio["nombre"],
                limpio["apellidos"],
                limpio["cedula"],
                limpio["correo"],
                limpio["telefono"],
                limpio["direccion"],
                limpio["rol"],
                limpio["estado"],
            ),
        )
        id_usuario = cursor.lastrowid
        conexion.commit()
    _registrar_historial(
        id_usuario,
        [(campo, "", str(valor)) for campo, valor in limpio.items()],
        responsable,
    )
    return id_usuario


def actualizar_usuario(datos: dict, responsable: str = "Bibliotecario") -> None:
    limpio = validar_usuario(datos, es_actualizacion=True)
    actual = obtener_usuario(limpio["idUsuario"])
    if not actual:
        raise ErrorValidacion("El usuario seleccionado no existe.")
    if _cedula_duplicada(limpio["cedula"], excluir_id=limpio["idUsuario"]):
        raise ErrorValidacion("Ya existe otro usuario con esa cédula.")
    cambios = cambios_detectados(actual, limpio)
    if not cambios:
        raise ErrorValidacion("No se detectaron cambios para actualizar.")
    with obtener_conexion() as conexion:
        conexion.execute(
            """
            UPDATE usuarios
            SET nombre = ?, apellidos = ?, cedula = ?, correo = ?, telefono = ?,
                direccion = ?, rol = ?, estado = ?
            WHERE idUsuario = ?
            """,
            (
                limpio["nombre"],
                limpio["apellidos"],
                limpio["cedula"],
                limpio["correo"],
                limpio["telefono"],
                limpio["direccion"],
                limpio["rol"],
                limpio["estado"],
                limpio["idUsuario"],
            ),
        )
        conexion.commit()
    _registrar_historial(limpio["idUsuario"], cambios, responsable)


def eliminar_usuario(id_usuario: int) -> None:
    with obtener_conexion() as conexion:
        conexion.execute("DELETE FROM historial_cambios WHERE idUsuario = ?", (id_usuario,))
        conexion.execute("DELETE FROM usuarios WHERE idUsuario = ?", (id_usuario,))
        conexion.commit()


def listar_historial(limite: int = 200) -> list[dict]:
    with obtener_conexion() as conexion:
        filas = conexion.execute(
            """
            SELECT hc.*, u.nombre || ' ' || u.apellidos AS nombreCompleto
            FROM historial_cambios hc
            JOIN usuarios u ON u.idUsuario = hc.idUsuario
            ORDER BY hc.idCambio DESC
            LIMIT ?
            """,
            (limite,),
        ).fetchall()
    return [dict(fila) for fila in filas]


def resumen_estadistico() -> dict:
    usuarios = listar_usuarios()
    total = len(usuarios)
    activos = sum(1 for u in usuarios if u["estado"] == "Activo")
    inactivos = total - activos
    por_rol = Counter(u["rol"] for u in usuarios)
    recientes = usuarios[:5]
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos,
        "por_rol": dict(por_rol),
        "recientes": recientes,
    }

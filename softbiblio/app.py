from ui.base import AppShell
from ui.dashboard import DashboardScreen
from ui.usuarios import UsuariosScreen, UsuarioFormScreen
from ui.historial import HistorialScreen
from ui.reportes import ReportesScreen
from ui.configuracion import ConfiguracionScreen


def iniciar_app():
    app = AppShell()
    app.registrar_pantalla("dashboard", DashboardScreen)
    app.registrar_pantalla("usuarios", UsuariosScreen)
    app.registrar_pantalla("listado", UsuariosScreen)
    app.registrar_pantalla("registrar", lambda parent, shell: UsuarioFormScreen(parent, shell, "registrar"))
    app.registrar_pantalla("editar", lambda parent, shell, idUsuario=None: UsuarioFormScreen(parent, shell, "editar", idUsuario=idUsuario))
    app.registrar_pantalla("historial", HistorialScreen)
    app.registrar_pantalla("reportes", ReportesScreen)
    app.registrar_pantalla("configuracion", ConfiguracionScreen)
    app.mostrar_pantalla("dashboard")
    app.mainloop()


if __name__ == "__main__":
    iniciar_app()

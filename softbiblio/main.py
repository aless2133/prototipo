"""SoftBiblio - Software de Gestión de Biblioteca."""
import tkinter as tk

from config.database import crear_esquema
from views.app_principal import AppPrincipal


def main():
    crear_esquema() 
    raiz = tk.Tk()
    AppPrincipal(raiz)
    raiz.mainloop()


if __name__ == "__main__":
    main()
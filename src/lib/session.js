/**
 * SoftBiblio · src/lib/session.js
 * Envoltorio seguro sobre sessionStorage. Este es un prototipo sin backend:
 * la sesión solo vive en el navegador de la pestaña actual. Si el archivo se
 * abre con doble clic (protocolo file://) algunos navegadores bloquean el
 * acceso a sessionStorage; por eso cada operación cae en una variable de
 * memoria como respaldo para que la demo nunca se rompa.
 */

const SESSION_KEY = 'softbiblio:session';
let memoryFallback = null;

function isStorageAvailable() {
  try {
    const testKey = '__softbiblio_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch (_err) {
    return false;
  }
}

const storageOk = isStorageAvailable();

export const Session = {
  /** Guarda la sesión activa. `data` debe ser serializable a JSON. */
  set(data) {
    const payload = JSON.stringify(data);
    if (storageOk) {
      window.sessionStorage.setItem(SESSION_KEY, payload);
    }
    memoryFallback = payload;
  },

  /** Recupera la sesión activa o `null` si no existe. */
  get() {
    const raw = storageOk ? window.sessionStorage.getItem(SESSION_KEY) : memoryFallback;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  },

  /** Cierra la sesión activa. */
  clear() {
    if (storageOk) {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
    memoryFallback = null;
  },
};

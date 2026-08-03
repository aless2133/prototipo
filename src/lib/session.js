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
  set(data) {
    const payload = JSON.stringify(data);
    if (storageOk) {
      window.sessionStorage.setItem(SESSION_KEY, payload);
    }
    memoryFallback = payload;
  },

  get() {
    const raw = storageOk ? window.sessionStorage.getItem(SESSION_KEY) : memoryFallback;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  },
  clear() {
    if (storageOk) {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
    memoryFallback = null;
  },
};

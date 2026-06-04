const DB_NAME = 'dashboard';
const DB_VERSION = 1;
const STORES = {
  rides:    { keyPath: 'id',   indexes: [['date', 'date']] },
  expenses: { keyPath: 'id',   indexes: [['date', 'date']] },
  hizb_log: { keyPath: 'date' },
  cards:    { keyPath: 'id',   indexes: [['dueDate', 'dueDate']] },
  goals:    { keyPath: 'id' },
  todos:    { keyPath: 'id' },
};

let _dbPromise = null;

export function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [name, cfg] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: cfg.keyPath });
          (cfg.indexes || []).forEach(([idx, key]) => store.createIndex(idx, key));
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

async function tx(store, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}
function p(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(store, value) { return p((await tx(store, 'readwrite')).put(value)); }
export async function add(store, value) { return p((await tx(store, 'readwrite')).add(value)); }
export async function get(store, key)   { return p((await tx(store)).get(key)); }
export async function del(store, key)   { return p((await tx(store, 'readwrite')).delete(key)); }
export async function all(store)        { return p((await tx(store)).getAll()); }
export async function clear(store)      { return p((await tx(store, 'readwrite')).clear()); }

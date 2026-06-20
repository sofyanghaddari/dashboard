const DB_NAME = 'dashboard';
const DB_VERSION = 7;
const STORES = {
  rides:             { keyPath: 'id',   indexes: [['date', 'date']] },
  expenses:          { keyPath: 'id',   indexes: [['date', 'date']] },
  hizb_log:          { keyPath: 'date' },
  cards:             { keyPath: 'id',   indexes: [['dueDate', 'dueDate']] },
  goals:             { keyPath: 'id' },
  todos:             { keyPath: 'id' },
  shifts:            { keyPath: 'id',   indexes: [['startTime', 'startTime']] },
  notes:             { keyPath: 'id',   indexes: [['updatedAt', 'updatedAt']] },
  habits:            { keyPath: 'id' },
  habit_log:         { keyPath: 'id' },
  pots:              { keyPath: 'id' },
  invoices:          { keyPath: 'id',   indexes: [['date', 'date']] },
  purchase_invoices: { keyPath: 'id',   indexes: [['date', 'date']] },
  km_log:            { keyPath: 'id',   indexes: [['date', 'date']] },
  clients:           { keyPath: 'id' },
  taxi_expenses:     { keyPath: 'id' },
  agenda_events:     { keyPath: 'id',   indexes: [['date', 'date']] },
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

let _onWrite = null;
let _onStorageError = null;
export function onWrite(cb) { _onWrite = cb; }
export function onStorageError(cb) { _onStorageError = cb; }

function injectUpdatedAt(value) {
  // Object-spread om mutatie van caller-object te vermijden
  return { ...value, _updatedAt: Date.now() };
}

export async function put(store, value) {
  const v = injectUpdatedAt(value);
  try {
    const res = await p((await tx(store, 'readwrite')).put(v));
    if (_onWrite) _onWrite();
    return res;
  } catch (e) {
    if (e.name === 'QuotaExceededError' && _onStorageError) _onStorageError();
    throw e;
  }
}
export async function add(store, value) {
  const v = injectUpdatedAt(value);
  try {
    const res = await p((await tx(store, 'readwrite')).add(v));
    if (_onWrite) _onWrite();
    return res;
  } catch (e) {
    if (e.name === 'QuotaExceededError' && _onStorageError) _onStorageError();
    throw e;
  }
}
export async function get(store, key)   { return p((await tx(store)).get(key)); }
export async function del(store, key)   {
  const res = await p((await tx(store, 'readwrite')).delete(key));
  if (_onWrite) _onWrite();
  return res;
}
export async function all(store)        { return p((await tx(store)).getAll()); }
export async function clear(store)      {
  const res = await p((await tx(store, 'readwrite')).clear());
  if (_onWrite) _onWrite();
  return res;
}

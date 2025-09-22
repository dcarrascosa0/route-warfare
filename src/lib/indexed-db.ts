// frontend/src/lib/indexed-db.ts

const DB_NAME = 'RouteWarsDB';
const DB_VERSION = 1;
const ROUTE_STORE = 'offlineRoutes';
const TERRITORY_STORE = 'offlineTerritoryActions';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(ROUTE_STORE)) {
        dbInstance.createObjectStore(ROUTE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!dbInstance.objectStoreNames.contains(TERRITORY_STORE)) {
        dbInstance.createObjectStore(TERRITORY_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject('IndexedDB error: ' + (event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function addOfflineRoute(routeData: any) {
  const db = await openDB();
  const transaction = db.transaction(ROUTE_STORE, 'readwrite');
  const store = transaction.objectStore(ROUTE_STORE);
  store.add(routeData);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflineRoutes() {
  const db = await openDB();
  const transaction = db.transaction(ROUTE_STORE, 'readonly');
  const store = transaction.objectStore(ROUTE_STORE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineRoute(id: string) {
  const db = await openDB();
  const transaction = db.transaction(ROUTE_STORE, 'readwrite');
  const store = transaction.objectStore(ROUTE_STORE);
  store.delete(id);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addOfflineTerritoryAction(actionData: any) {
    const db = await openDB();
    const transaction = db.transaction(TERRITORY_STORE, 'readwrite');
    const store = transaction.objectStore(TERRITORY_STORE);
    store.add(actionData);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function getOfflineTerritoryActions() {
    const db = await openDB();
    const transaction = db.transaction(TERRITORY_STORE, 'readonly');
    const store = transaction.objectStore(TERRITORY_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function removeOfflineTerritoryAction(id: string) {
    const db = await openDB();
    const transaction = db.transaction(TERRITORY_STORE, 'readwrite');
    const store = transaction.objectStore(TERRITORY_STORE);
    store.delete(id);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
}

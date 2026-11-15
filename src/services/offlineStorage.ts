import type { MeasurementCreatePayload } from "./healthService";

export interface QueuedMeasurement extends MeasurementCreatePayload {
  client_measurement_id: string;
  recorded_at: string;
}

interface CachedValue<T> {
  key: string;
  value: T;
}

const DATABASE_NAME = "astrohealth-offline";
const DATABASE_VERSION = 1;
const PENDING_STORE = "pending-measurements";
const CACHE_STORE = "api-cache";

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not allow storing data offline."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore(PENDING_STORE, {
          keyPath: "client_measurement_id",
        });
        database.createObjectStore(CACHE_STORE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return databasePromise;
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));
        let result: T;

        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      })
  );
}

export function saveQueuedMeasurement(
  measurement: QueuedMeasurement
): Promise<void> {
  return runTransaction(PENDING_STORE, "readwrite", (store) =>
    store.put(measurement)
  ).then(() => undefined);
}

export function listQueuedMeasurements(): Promise<QueuedMeasurement[]> {
  return runTransaction(PENDING_STORE, "readonly", (store) => store.getAll());
}

export function removeQueuedMeasurement(
  clientMeasurementId: string
): Promise<undefined> {
  return runTransaction(PENDING_STORE, "readwrite", (store) =>
    store.delete(clientMeasurementId)
  );
}

export async function cacheApiValue<T>(key: string, value: T): Promise<void> {
  await runTransaction(CACHE_STORE, "readwrite", (store) =>
    store.put({ key, value } satisfies CachedValue<T>)
  );
}

export async function getCachedApiValue<T>(key: string): Promise<T | null> {
  const cached = await runTransaction<CachedValue<T> | undefined>(
    CACHE_STORE,
    "readonly",
    (store) => store.get(key)
  );
  return cached?.value ?? null;
}

import { StateStorage } from 'zustand/middleware';

class IndexedDBStorage implements StateStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private pDB: Promise<IDBDatabase> | null = null;

  constructor(dbName = 'MLStudioDB', storeName = 'store') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in non-browser environments');
    }
    if (this.db) return this.db;
    if (this.pDB) return this.pDB;

    this.pDB = new Promise((resolve, reject) => {
      // Use standard browser indexedDB setup
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.pDB = null;
        resolve(this.db);
      };

      request.onerror = () => {
        this.pDB = null;
        reject(request.error);
      };
    });

    return this.pDB;
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return await new Promise<string | null>((resolve) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(name);

        request.onsuccess = () => {
          resolve(request.result !== undefined ? request.result : null);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.warn('indexedDB getItem failed, returning null', e);
      }
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, name);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('indexedDB setItem failed', e);
        throw e;
      }
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(name);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('indexedDB removeItem failed', e);
      }
    }
  }
}

export const indexedDBStore = new IndexedDBStorage();

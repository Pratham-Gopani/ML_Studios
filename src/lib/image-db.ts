export interface ImageDataset {
  images: (number[] | Float32Array)[];
  labels: number[];
  classNames?: string[];
  inputShape: [number, number, number];
}

class ImageDB {
  private dbName = 'MLStudioImagesDB';
  private storeName = 'images';
  private db: IDBDatabase | null = null;
  private pDB: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available in non-browser environments'));
    }
    if (this.db) return Promise.resolve(this.db);
    if (this.pDB) return this.pDB;

    this.pDB = new Promise((resolve, reject) => {
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

  async save(id: string, data: ImageDataset): Promise<void> {
    try {
      const db = await this.getDB();
      // Ensure we deep copy arrays of Float32Arrays if needed, but structured clone preserves them perfectly.
      // To be safe, we store images directly.
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      if (typeof window !== 'undefined') {
        console.log(`Image dataset cached in IndexedDB for ID: ${id}`);
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to save image dataset to IndexedDB:', err);
      }
    }
  }

  async load(id: string): Promise<ImageDataset | null> {
    try {
      const db = await this.getDB();
      return await new Promise<ImageDataset | null>((resolve) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to load image dataset from IndexedDB:', err);
      }
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to delete image dataset from IndexedDB:', err);
      }
    }
  }
}

export const imageDB = new ImageDB();

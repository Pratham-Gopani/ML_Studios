import { openDB } from 'idb';

const DB_NAME = 'MLStudioProjects';
const STORE_NAME = 'projects';

export interface StoredProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  state: any;
  modelBlob?: Blob;
}

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveProject(
  project: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const db = await getDB();
  const id = project.id || crypto.randomUUID();
  const now = Date.now();
  const existing = await db.get(STORE_NAME, id);
  const full: StoredProject = {
    id,
    name: project.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state: project.state,
    modelBlob: project.modelBlob,
  };
  await db.put(STORE_NAME, full);
  return id;
}

export async function loadProject(id: string): Promise<StoredProject | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function getAllProjects(): Promise<StoredProject[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function deleteProject(id: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

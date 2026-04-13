import { openDB, DBSchema, IDBPDatabase } from "idb";

interface PendingAttendance {
  id?: number;
  session_id: string;
  student_id: string;
  status: string;
  scanned_at: string;
  geo_lat?: number;
  geo_lng?: number;
  synced: boolean;
  created_at: string;
}

interface OfflineQueueDB extends DBSchema {
  pendingAttendance: {
    key: number;
    value: PendingAttendance;
    indexes: { "by-synced": number };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineQueueDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineQueueDB>("attendance-offline-queue", 1, {
      upgrade(db) {
        const store = db.createObjectStore("pendingAttendance", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-synced", "synced");
      },
    });
  }
  return dbPromise;
}

export async function addPendingAttendance(
  attendance: Omit<PendingAttendance, "id" | "synced" | "created_at">
): Promise<number> {
  const db = await getDB();
  const id = await db.add("pendingAttendance", {
    ...attendance,
    synced: false,
    created_at: new Date().toISOString(),
  });
  return id;
}

export async function getPendingAttendance(): Promise<PendingAttendance[]> {
  const db = await getDB();
  return db.getAllFromIndex("pendingAttendance", "by-synced", 0);
}

export async function markAsSynced(id: number): Promise<void> {
  const db = await getDB();
  await db.put(
    "pendingAttendance",
    { id, synced: true },
    id
  );
}

export async function deletePendingAttendance(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("pendingAttendance", id);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("pendingAttendance", "by-synced", 0);
}
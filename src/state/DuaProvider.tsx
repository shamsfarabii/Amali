import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Dua, DuaInput } from '@/types/dua';
import { sortFolders, type Folder } from '@/types/folder';
import type { ImportMode, ImportPlan } from '@/backup/planImport';
import * as repo from '@/db/duaRepository';

interface DuaContextValue {
  duas: Dua[];
  /** Sorted by name. */
  folders: Folder[];
  loading: boolean;
  error: string | null;
  getById: (id: string) => Dua | undefined;
  getFolder: (id: string | null) => Folder | undefined;
  createDua: (input: DuaInput) => Promise<Dua>;
  updateDua: (existing: Dua, input: DuaInput) => Promise<Dua>;
  /** Deletes a dua and returns it so the deletion can be undone. */
  removeDua: (id: string) => Promise<Dua | undefined>;
  restoreDua: (dua: Dua) => Promise<void>;
  /** Name must already be validated with validateFolderName. */
  createFolder: (name: string) => Promise<Folder>;
  renameFolder: (folder: Folder, name: string) => Promise<void>;
  /** Deletes the folder; its duas stay in the collection without a folder. */
  deleteFolder: (id: string) => Promise<void>;
  applyImport: (plan: ImportPlan, mode: ImportMode) => Promise<void>;
}

const DuaContext = createContext<DuaContextValue | null>(null);

async function loadCollection() {
  const [duas, folders] = await Promise.all([repo.getAll(), repo.getAllFolders()]);
  return { duas, folders: sortFolders(folders) };
}

/**
 * Holds the whole collection in memory. Every write goes to SQLite first;
 * the in-memory state only changes after the write succeeds.
 */
export function DuaProvider({ children }: { children: ReactNode }) {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection()
      .then((collection) => {
        setDuas(collection.duas);
        setFolders(collection.folders);
      })
      .catch(() => setError('Could not load your duas.'))
      .finally(() => setLoading(false));
  }, []);

  const getById = useCallback((id: string) => duas.find((d) => d.id === id), [duas]);
  const getFolder = useCallback(
    (id: string | null) => (id ? folders.find((f) => f.id === id) : undefined),
    [folders],
  );

  const createDua = useCallback(async (input: DuaInput) => {
    const dua = await repo.create(input);
    setDuas((prev) => [dua, ...prev]);
    return dua;
  }, []);

  const updateDua = useCallback(async (existing: Dua, input: DuaInput) => {
    const dua = await repo.update(existing, input);
    setDuas((prev) => prev.map((d) => (d.id === dua.id ? dua : d)));
    return dua;
  }, []);

  const removeDua = useCallback(
    async (id: string) => {
      const removed = duas.find((d) => d.id === id);
      await repo.remove(id);
      setDuas((prev) => prev.filter((d) => d.id !== id));
      return removed;
    },
    [duas],
  );

  const restoreDua = useCallback(
    async (dua: Dua) => {
      // The folder may have been deleted in the meantime.
      const folderGone = dua.folderId !== null && !folders.some((f) => f.id === dua.folderId);
      const restored = folderGone ? { ...dua, folderId: null } : dua;
      await repo.restore(restored);
      setDuas((prev) => [...prev, restored].sort((a, b) => b.createdAt - a.createdAt));
    },
    [folders],
  );

  const createFolder = useCallback(async (name: string) => {
    const folder = await repo.createFolder(name);
    setFolders((prev) => sortFolders([...prev, folder]));
    return folder;
  }, []);

  const renameFolder = useCallback(async (folder: Folder, name: string) => {
    const renamed = await repo.renameFolder(folder, name);
    setFolders((prev) => sortFolders(prev.map((f) => (f.id === renamed.id ? renamed : f))));
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await repo.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setDuas((prev) => prev.map((d) => (d.folderId === id ? { ...d, folderId: null } : d)));
  }, []);

  const applyImport = useCallback(async (plan: ImportPlan, mode: ImportMode) => {
    await repo.applyImport(plan, mode);
    const collection = await loadCollection();
    setDuas(collection.duas);
    setFolders(collection.folders);
  }, []);

  const value = useMemo(
    () => ({
      duas,
      folders,
      loading,
      error,
      getById,
      getFolder,
      createDua,
      updateDua,
      removeDua,
      restoreDua,
      createFolder,
      renameFolder,
      deleteFolder,
      applyImport,
    }),
    [
      duas,
      folders,
      loading,
      error,
      getById,
      getFolder,
      createDua,
      updateDua,
      removeDua,
      restoreDua,
      createFolder,
      renameFolder,
      deleteFolder,
      applyImport,
    ],
  );

  return <DuaContext.Provider value={value}>{children}</DuaContext.Provider>;
}

export function useDuas(): DuaContextValue {
  const ctx = useContext(DuaContext);
  if (!ctx) throw new Error('useDuas must be used inside <DuaProvider>');
  return ctx;
}

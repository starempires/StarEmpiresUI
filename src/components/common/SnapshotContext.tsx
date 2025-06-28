// src/contexts/SnapshotContext.tsx
import { createContext, useContext } from 'react';

export interface SnapshotContextType {
  snapshot: any;
  setSnapshot: (snap: any) => void;
}

export const SnapshotContext = createContext<SnapshotContextType>({
  snapshot: null,
  setSnapshot: () => {},
});

export function useSnapshot() {
  return useContext(SnapshotContext);
}
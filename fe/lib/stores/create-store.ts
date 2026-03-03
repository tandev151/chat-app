import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

/**
 * Standard pattern: create a store with type TStore, then a typed useStore hook
 * that supports shallow equality for selectors to avoid unnecessary re-renders.
 */
export const createAppStore = <TStore extends object>(
  initializer: (set: (partial: Partial<TStore> | ((state: TStore) => Partial<TStore>)) => void) => TStore
) => {
  const store = createStore(initializer);

  const useAppStore = <T>(selector: (state: TStore) => T): T =>
    useStore(store, useShallow(selector as (state: unknown) => T));

  return { store, useAppStore };
};

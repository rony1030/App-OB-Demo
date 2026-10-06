'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export function useCanvasHistory<T>(initial: T) {
  const [data, setData] = useState<T>(initial);
  const dataRef = useRef<T>(initial);
  const undoStackRef = useRef<T[]>([]);
  const redoStackRef = useRef<T[]>([]);
  const liveSnapshotRef = useRef<T | null>(null);
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });

  const setDataAndRef = useCallback((next: T) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const setDataCommitted = useCallback(
    (next: T) => {
      if (JSON.stringify(next) === JSON.stringify(dataRef.current)) return;
      const before = liveSnapshotRef.current ?? dataRef.current;
      liveSnapshotRef.current = null;
      undoStackRef.current = [...undoStackRef.current, before].slice(-MAX_HISTORY);
      redoStackRef.current = [];
      setHistoryCounts({ undo: undoStackRef.current.length, redo: 0 });
      setDataAndRef(next);
    },
    [setDataAndRef]
  );

  const beginEdit = useCallback(() => {
    if (liveSnapshotRef.current === null) liveSnapshotRef.current = structuredClone(dataRef.current);
  }, []);

  const updateLive = useCallback(
    (next: T) => {
      setDataAndRef(next);
    },
    [setDataAndRef]
  );

  const commitEdit = useCallback(() => {
    const before = liveSnapshotRef.current;
    liveSnapshotRef.current = null;
    if (before === null || JSON.stringify(before) === JSON.stringify(dataRef.current)) return;
    undoStackRef.current = [...undoStackRef.current, before].slice(-MAX_HISTORY);
    redoStackRef.current = [];
    setHistoryCounts({ undo: undoStackRef.current.length, redo: 0 });
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, dataRef.current];
    setHistoryCounts({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
    setDataAndRef(previous);
  }, [setDataAndRef]);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, dataRef.current];
    setHistoryCounts({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
    setDataAndRef(next);
  }, [setDataAndRef]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditingField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isEditingField) return;
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [undo, redo]);

  return {
    data,
    setData: setDataCommitted,
    setDataLive: updateLive,
    beginEdit,
    commitEdit,
    undo,
    redo,
    canUndo: historyCounts.undo > 0,
    canRedo: historyCounts.redo > 0,
  };
}

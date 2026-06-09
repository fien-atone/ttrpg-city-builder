/** Immutable deep-set by dot path, e.g. set(world, 'geography.biome', 'forest'). */
export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...cur[k] };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

/** Read a value by dot path (used by generic field editors). */
export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? o : (o as any)[k]), obj);
}

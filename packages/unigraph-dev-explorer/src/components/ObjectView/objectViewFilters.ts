export type objectViewFilter<T> = (objects: T[]) => T[]

export const filterPresets: Record<string, objectViewFilter<any>> = {
    "no-filter": (objects) => objects,
    "no-deleted": (objects) => objects.filter((obj) => (obj && obj['dgraph.type'].includes('Deleted')) ? null : obj)
}
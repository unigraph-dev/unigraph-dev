export type ObjectViewFilter<T> = (objects: T[], views?: any) => T[]

export const filterPresets: Record<string, ObjectViewFilter<any>> = {
    "no-filter": (objects) => objects,
    "no-deleted": (objects) => objects.filter((obj) => (obj && obj['dgraph.type'] && obj['dgraph.type'].includes('Deleted')) ? null : obj),
    "no-noview": (objects, views) => objects.filter((obj) => Object.keys(views).includes(obj['type']['unigraph.id']) ? obj : null)
}
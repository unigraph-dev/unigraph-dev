const { uids } = context.params;

console.log('Obsidian synced notes changed: ', uids);
unigraph.updateSyncResource('$/entity/obsidian_sync_resource', uids);

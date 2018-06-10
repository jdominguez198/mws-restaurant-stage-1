const _store = 'mws-store';

const IDB_MAIN_COLLECTION = 'mws';
const IDB_SYNCING_COLLECTION = 'mws-reviews-sync';

const dbPromise = idb.open(_store, 1, upgradeDB => {
    upgradeDB.createObjectStore(IDB_MAIN_COLLECTION);
    upgradeDB.createObjectStore(IDB_SYNCING_COLLECTION);
});

idbKeyval = {
    currentCollection: IDB_MAIN_COLLECTION,
    setCollection(collection) {
        idbKeyval.currentCollection = collection;
    },
    get(key) {
        return dbPromise.then(db => {
            return db.transaction(idbKeyval.currentCollection)
                .objectStore(idbKeyval.currentCollection).get(key);
        });
    },
    getAll() {
        return dbPromise
            .then(function(db) {
                return db
                    .transaction(idbKeyval.currentCollection, 'readonly')
                    .objectStore(idbKeyval.currentCollection)
                    .getAll();
            });
    },
    set(key, val) {
        return dbPromise.then(db => {
            const tx = db.transaction(idbKeyval.currentCollection, 'readwrite');
            tx.objectStore(idbKeyval.currentCollection).put(val, key);
            return tx.complete;
        });
    },
    delete(key) {
        return dbPromise.then(db => {
            const tx = db.transaction(idbKeyval.currentCollection, 'readwrite');
            tx.objectStore(idbKeyval.currentCollection).delete(key);
            return tx.complete;
        });
    },
    clear() {
        return dbPromise.then(db => {
            const tx = db.transaction(idbKeyval.currentCollection, 'readwrite');
            tx.objectStore(idbKeyval.currentCollection).clear();
            return tx.complete;
        });
    },
    keys() {
        return dbPromise.then(db => {
            const tx = db.transaction(idbKeyval.currentCollection);
            const keys = [];
            const store = tx.objectStore(idbKeyval.currentCollection);

            // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
            // openKeyCursor isn't supported by Safari, so we fall back
            (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                if (!cursor) return;
                keys.push(cursor.key);
                cursor.continue();
            });

            return tx.complete.then(() => keys);
        });
    }
};

function getIDBInstance() {
    return idbKeyval;
}
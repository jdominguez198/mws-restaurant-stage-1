const _store = 'mws-store';
const _collection = 'mws';

const dbPromise = idb.open(_store, 1, upgradeDB => {
    upgradeDB.createObjectStore(_collection);
});

const idbKeyval = {
    get(key) {
        return dbPromise.then(db => {
            return db.transaction(_collection)
                .objectStore(_collection).get(key);
        });
    },
    getAll() {
        return dbPromise
            .then(function(db) {
                return db
                    .transaction(_collection, 'readonly')
                    .objectStore(_collection)
                    .getAll();
            });
    },
    set(key, val) {
        return dbPromise.then(db => {
            const tx = db.transaction(_collection, 'readwrite');
            tx.objectStore(_collection).put(val, key);
            return tx.complete;
        });
    },
    delete(key) {
        return dbPromise.then(db => {
            const tx = db.transaction(_collection, 'readwrite');
            tx.objectStore(_collection).delete(key);
            return tx.complete;
        });
    },
    clear() {
        return dbPromise.then(db => {
            const tx = db.transaction(_collection, 'readwrite');
            tx.objectStore(_collection).clear();
            return tx.complete;
        });
    },
    keys() {
        return dbPromise.then(db => {
            const tx = db.transaction(_collection);
            const keys = [];
            const store = tx.objectStore(_collection);

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
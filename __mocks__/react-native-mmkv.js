// react-native-mmkv is backed by a native TurboModule (Nitro) that doesn't
// exist in the Jest/Node test environment. Any real device/emulator run
// still uses the real native module — this in-memory fake only stands in
// for `jest test`, so App.test.tsx (and anything else that transitively
// imports services/storage.ts) can actually run.
class FakeMMKV {
    store = new Map();
    set(key, value) { this.store.set(key, value); }
    getString(key) {
        const v = this.store.get(key);
        return typeof v === 'string' ? v : undefined;
    }
    getBoolean(key) {
        const v = this.store.get(key);
        return typeof v === 'boolean' ? v : undefined;
    }
    getNumber(key) {
        const v = this.store.get(key);
        return typeof v === 'number' ? v : undefined;
    }
    remove(key) { this.store.delete(key); }
    clearAll() { this.store.clear(); }
}

module.exports = {
    createMMKV: () => new FakeMMKV(),
    MMKV: FakeMMKV,
};

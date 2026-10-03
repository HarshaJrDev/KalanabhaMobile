




class FakeMMKV {
  store = new Map();
  set(key, value) {
    this.store.set(key, value);
  }
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
  remove(key) {
    this.store.delete(key);
  }
  clearAll() {
    this.store.clear();
  }
}

module.exports = {
  createMMKV: () => new FakeMMKV(),
  MMKV: FakeMMKV,
};

export const StorageService = {
  save(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Erro ao salvar no storage:", e);
    }
  },

  load(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Erro ao carregar do storage:", e);
      return null;
    }
  }
};

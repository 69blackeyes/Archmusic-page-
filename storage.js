const StorageModule = (() => {
  const KEYS = {
    FAVORITES: 'listenfree_favorites',
    HISTORY: 'listenfree_history',
    SETTINGS: 'listenfree_settings'
  };

  const getItem = (key, fallback = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Error reading LocalStorage', e);
      return fallback;
    }
  };

  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to LocalStorage', e);
    }
  };

  return {
    getFavorites: () => getItem(KEYS.FAVORITES),
    
    addFavorite: (track) => {
      const favs = getItem(KEYS.FAVORITES);
      if (!favs.some(t => t.id === track.id)) {
        favs.unshift(track);
        setItem(KEYS.FAVORITES, favs);
      }
    },

    removeFavorite: (trackId) => {
      let favs = getItem(KEYS.FAVORITES);
      favs = favs.filter(t => t.id !== trackId);
      setItem(KEYS.FAVORITES, favs);
    },

    isFavorite: (trackId) => {
      const favs = getItem(KEYS.FAVORITES);
      return favs.some(t => t.id === trackId);
    },

    getHistory: () => getItem(KEYS.HISTORY),

    addToHistory: (track) => {
      let history = getItem(KEYS.HISTORY);
      history = history.filter(t => t.id !== track.id);
      history.unshift(track);
      if (history.length > 30) history.pop();
      setItem(KEYS.HISTORY, history);
    },

    getSettings: () => getItem(KEYS.SETTINGS, { volume: 100, quality: 'default' }),

    saveSettings: (settingsObj) => {
      const current = getItem(KEYS.SETTINGS, { volume: 100, quality: 'default' });
      setItem(KEYS.SETTINGS, { ...current, ...settingsObj });
    },

    clearAll: () => {
      localStorage.removeItem(KEYS.FAVORITES);
      localStorage.removeItem(KEYS.HISTORY);
      localStorage.removeItem(KEYS.SETTINGS);
    }
  };
})();

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Recipe operations
    recipe: {
        getAll: () => ipcRenderer.invoke('recipe:getAll'),
        getById: (id) => ipcRenderer.invoke('recipe:getById', id),
        create: (recipe) => ipcRenderer.invoke('recipe:create', recipe),
        update: (recipe) => ipcRenderer.invoke('recipe:update', recipe),
        delete: (id) => ipcRenderer.invoke('recipe:delete', id),
        search: (query) => ipcRenderer.invoke('recipe:search', query),
        searchByIngredient: (ingredient) => ipcRenderer.invoke('recipe:searchByIngredient', ingredient),
    },

    // Settings operations
    settings: {
        get: (key) => ipcRenderer.invoke('settings:get', key),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
        getAll: () => ipcRenderer.invoke('settings:getAll'),
    },

    // Platform info
    platform: process.platform,

    // Utilities
    fetchUrl: (url) => ipcRenderer.invoke('app:fetchUrl', url),

    // AI operations
    ai: {
        generateImage: (params) => ipcRenderer.invoke('ai:generateImage', params),
    },
});

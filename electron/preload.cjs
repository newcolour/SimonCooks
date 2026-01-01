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
        export: (options) => ipcRenderer.invoke('recipe:export', options),
        import: () => ipcRenderer.invoke('recipe:import'),
    },

    // Settings operations
    settings: {
        get: (key) => ipcRenderer.invoke('settings:get', key),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
        getAll: () => ipcRenderer.invoke('settings:getAll'),
        export: () => ipcRenderer.invoke('settings:export'),
        import: () => ipcRenderer.invoke('settings:import'),
    },

    // Shopping List operations
    shoppingList: {
        getAll: () => ipcRenderer.invoke('shoppingList:getAll'),
        addItem: (item) => ipcRenderer.invoke('shoppingList:addItem', item),
        addMultiple: (items) => ipcRenderer.invoke('shoppingList:addMultiple', items),
        updateItem: (item) => ipcRenderer.invoke('shoppingList:updateItem', item),
        deleteItem: (id) => ipcRenderer.invoke('shoppingList:deleteItem', id),
        clearChecked: () => ipcRenderer.invoke('shoppingList:clearChecked'),
        clearAll: () => ipcRenderer.invoke('shoppingList:clearAll'),
        replaceAll: (items) => ipcRenderer.invoke('shoppingList:replaceAll', items),
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

const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Database setup
function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'simoncooks.db');

  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL, -- JSON
      instructions TEXT NOT NULL,
      cookingTime INTEGER, -- Food only
      servings INTEGER,
      notes TEXT,
      allergens TEXT, -- JSON
      categories TEXT, -- JSON
      imageUrl TEXT,
      nutrition TEXT, -- JSON (Food only)
      flavorProfile TEXT, -- JSON
      sourceUrl TEXT,
      aiGenerated INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      
      -- New Drink Fields
      type TEXT DEFAULT 'food',
      glassware TEXT,
      ice TEXT,
      tools TEXT, -- JSON
      isAlcoholic INTEGER DEFAULT 0,
      aiVariants TEXT -- JSON
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
  `);

  // Migrations for existing columns
  const migrationColumns = [
    'nutrition', 'flavorProfile', 'sourceUrl',
    'type', 'glassware', 'ice', 'tools', 'isAlcoholic', 'aiVariants'
  ];

  migrationColumns.forEach(col => {
    try {
      db.exec(`ALTER TABLE recipes ADD COLUMN ${col} TEXT`);
      // specific defaults/types handling if needed, but sqlite is flexible
      if (col === 'type') {
        db.exec(`UPDATE recipes SET type = 'food' WHERE type IS NULL`);
      }
    } catch {
      // Column exists
    }
  });

  // Create Indexes (must be after migrations to ensure columns exist)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
    CREATE INDEX IF NOT EXISTS idx_recipes_categories ON recipes(categories);
    CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(type);
  `);

  // Create FTS5 virtual table for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
      id,
      title,
      ingredients,
      allergens,
      categories,
      content='recipes',
      content_rowid='rowid'
    );
    
    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS recipes_ai AFTER INSERT ON recipes BEGIN
      INSERT INTO recipes_fts(id, title, ingredients, allergens, categories)
      VALUES (new.id, new.title, new.ingredients, new.allergens, new.categories);
    END;
    
    CREATE TRIGGER IF NOT EXISTS recipes_ad AFTER DELETE ON recipes BEGIN
      INSERT INTO recipes_fts(recipes_fts, id, title, ingredients, allergens, categories)
      VALUES('delete', old.id, old.title, old.ingredients, old.allergens, old.categories);
    END;
    
    CREATE TRIGGER IF NOT EXISTS recipes_au AFTER UPDATE ON recipes BEGIN
      INSERT INTO recipes_fts(recipes_fts, id, title, ingredients, allergens, categories)
      VALUES('delete', old.id, old.title, old.ingredients, old.allergens, old.categories);
      INSERT INTO recipes_fts(id, title, ingredients, allergens, categories)
      VALUES (new.id, new.title, new.ingredients, new.allergens, new.categories);
    END;
  `);

  console.log('Database initialized at:', dbPath);
}

function createWindow() {
  // Determine icon path based on environment
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.icns')
    : path.join(__dirname, '../public/icon.icns');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Set system theme source
  nativeTheme.themeSource = 'system';

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});

// IPC Handlers for Recipe CRUD operations
ipcMain.handle('recipe:getAll', () => {
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY updatedAt DESC').all();
  return recipes.map(r => {
    const base = {
      ...r,
      ingredients: JSON.parse(r.ingredients || '[]'),
      allergens: JSON.parse(r.allergens || '[]'),
      categories: JSON.parse(r.categories || '[]'),
      flavorProfile: r.flavorProfile ? JSON.parse(r.flavorProfile) : null,
      aiGenerated: Boolean(r.aiGenerated),
      // Default to food if type is missing (legacy records)
      type: r.type || 'food'
    };

    if (base.type === 'drink') {
      return {
        ...base,
        tools: JSON.parse(r.tools || '[]'),
        isAlcoholic: Boolean(r.isAlcoholic),
        aiVariants: r.aiVariants ? JSON.parse(r.aiVariants) : undefined,
        // Drinks might filter out nutrition/cookingTime if they are null
      };
    } else {
      return {
        ...base,
        nutrition: r.nutrition ? JSON.parse(r.nutrition) : null,
        // Ensure type is explicitly set for typescript
        type: 'food'
      };
    }
  });
});

ipcMain.handle('recipe:getById', (_, id) => {
  const r = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
  if (!r) return null;

  const base = {
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]'),
    allergens: JSON.parse(r.allergens || '[]'),
    categories: JSON.parse(r.categories || '[]'),
    flavorProfile: r.flavorProfile ? JSON.parse(r.flavorProfile) : null,
    aiGenerated: Boolean(r.aiGenerated),
    type: r.type || 'food'
  };

  if (base.type === 'drink') {
    return {
      ...base,
      tools: JSON.parse(r.tools || '[]'),
      isAlcoholic: Boolean(r.isAlcoholic),
      aiVariants: r.aiVariants ? JSON.parse(r.aiVariants) : undefined
    };
  } else {
    return {
      ...base,
      nutrition: r.nutrition ? JSON.parse(r.nutrition) : null
    };
  }
});

ipcMain.handle('recipe:create', (_, recipe) => {
  try {
    console.log('[Main] Creating recipe:', { title: recipe.title, type: recipe.type });
    const stmt = db.prepare(`
    INSERT INTO recipes(
    id, title, description, ingredients, instructions, cookingTime, servings, notes,
    allergens, categories, imageUrl, nutrition, flavorProfile, sourceUrl, aiGenerated,
    createdAt, updatedAt,
    type, glassware, ice, tools, isAlcoholic, aiVariants
  )
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    // Safe getters for optional fields depending on type
    const isFood = recipe.type !== 'drink';

    stmt.run(
      recipe.id,
      recipe.title,
      recipe.description || '',
      JSON.stringify(recipe.ingredients),
      recipe.instructions,
      recipe.cookingTime || null,
      recipe.servings || null,
      recipe.notes || '',
      JSON.stringify(recipe.allergens || []),
      JSON.stringify(recipe.categories || []),
      recipe.imageUrl || null,
      isFood ? (recipe.nutrition ? JSON.stringify(recipe.nutrition) : null) : null,
      recipe.flavorProfile ? JSON.stringify(recipe.flavorProfile) : null,
      recipe.sourceUrl || null,
      recipe.aiGenerated ? 1 : 0,
      now,
      now,
      recipe.type || 'food',
      !isFood ? (recipe.glassware || null) : null,
      !isFood ? (recipe.ice || null) : null,
      !isFood ? JSON.stringify(recipe.tools || []) : null,
      !isFood ? (recipe.isAlcoholic ? 1 : 0) : 0,
      !isFood ? (recipe.aiVariants ? JSON.stringify(recipe.aiVariants) : null) : null
    );

    console.log('[Main] Recipe created successfully');
    return { ...recipe, createdAt: now, updatedAt: now };
  } catch (err) {
    console.error('[Main] Failed to create recipe:', err);
    throw err;
  }
});

ipcMain.handle('recipe:update', (_, recipe) => {
  try {
    console.log('[Main] Updating recipe:', { id: recipe.id, title: recipe.title, type: recipe.type });
    const stmt = db.prepare(`
    UPDATE recipes SET
  title = ?, description = ?, ingredients = ?, instructions = ?,
    cookingTime = ?, servings = ?, notes = ?, allergens = ?,
    categories = ?, imageUrl = ?, nutrition = ?, flavorProfile = ?, sourceUrl = ?,
    aiGenerated = ?, updatedAt = ?,
    type = ?, glassware = ?, ice = ?, tools = ?, isAlcoholic = ?, aiVariants = ?
      WHERE id = ?
        `);

    const now = new Date().toISOString();
    const isFood = recipe.type !== 'drink';

    stmt.run(
      recipe.title,
      recipe.description || '',
      JSON.stringify(recipe.ingredients),
      recipe.instructions,
      recipe.cookingTime || null,
      recipe.servings || null,
      recipe.notes || '',
      JSON.stringify(recipe.allergens || []),
      JSON.stringify(recipe.categories || []),
      recipe.imageUrl || null,
      isFood ? (recipe.nutrition ? JSON.stringify(recipe.nutrition) : null) : null,
      recipe.flavorProfile ? JSON.stringify(recipe.flavorProfile) : null,
      recipe.sourceUrl || null,
      recipe.aiGenerated ? 1 : 0,
      now,
      recipe.type || 'food',
      !isFood ? (recipe.glassware || null) : null,
      !isFood ? (recipe.ice || null) : null,
      !isFood ? JSON.stringify(recipe.tools || []) : null,
      !isFood ? (recipe.isAlcoholic ? 1 : 0) : 0,
      !isFood ? (recipe.aiVariants ? JSON.stringify(recipe.aiVariants) : null) : null,
      recipe.id
    );

    console.log('[Main] Recipe updated successfully');
    return { ...recipe, updatedAt: now };
  } catch (err) {
    console.error('[Main] Failed to update recipe:', err);
    throw err;
  }
});

ipcMain.handle('recipe:delete', (_, id) => {
  const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
  stmt.run(id);
  return true;
});

ipcMain.handle('ai:generateImage', async (_, { provider, prompt, settings }) => {
  try {
    if (provider === 'cloudflare') {
      let { cloudflareAccountId, cloudflareApiToken, imageModel } = settings;

      // Sanitize inputs
      cloudflareAccountId = cloudflareAccountId ? cloudflareAccountId.trim() : '';
      cloudflareApiToken = cloudflareApiToken ? cloudflareApiToken.trim() : '';

      if (!cloudflareAccountId || !cloudflareApiToken) {
        throw new Error('Missing Cloudflare credentials');
      }

      // Validation: Account ID should NOT be an email
      if (cloudflareAccountId.includes('@')) {
        throw new Error(`Invalid Account ID: "${cloudflareAccountId}". Please use the 32-character ID from your Dashboard URL, NOT your email.`);
      }

      console.log('[Main] Generating image via Cloudflare:', { model: imageModel, accountId: cloudflareAccountId });

      // FIX: Ensure we use a Cloudflare model. If the user switched from Gemini, imageModel might still be 'gemini-...'
      // Cloudflare models always start with '@cf/'. If not, force Flux.
      const isCfModel = imageModel && imageModel.startsWith('@cf/');
      const modelId = isCfModel ? imageModel : '@cf/black-forest-labs/flux-1-schnell';

      console.log('[Main] Using Model ID:', modelId);

      const url = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/${modelId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          num_steps: 4
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Main] Cloudflare API Error:', response.status, errText);
        throw new Error(`Cloudflare API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();

      if (data.success && data.result?.image) {
        return `data:image/jpeg;base64,${data.result.image}`;
      }

      console.error('[Main] Cloudflare response missing image:', data);
      throw new Error('No image returned from Cloudflare');
    }

    throw new Error(`Provider ${provider} not supported in backend proxy`);
  } catch (err) {
    console.error('[Main] AI Generation Failed:', err);
    throw err;
  }
});

ipcMain.handle('recipe:search', (_, query) => {
  if (!query || query.trim() === '') {
    return ipcMain.emit('recipe:getAll');
  }

  // Use FTS5 for search
  const searchQuery = query.split(' ').map(term => `"${term}" * `).join(' OR ');
  const recipes = db.prepare(`
    SELECT r.* FROM recipes r
    INNER JOIN recipes_fts fts ON r.id = fts.id
    WHERE recipes_fts MATCH ?
    ORDER BY rank
      `).all(searchQuery);

  return recipes.map(r => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]'),
    allergens: JSON.parse(r.allergens || '[]'),
    categories: JSON.parse(r.categories || '[]'),
    aiGenerated: Boolean(r.aiGenerated),
  }));
});

ipcMain.handle('recipe:searchByIngredient', (_, ingredient) => {
  const searchTerm = `% ${ingredient.toLowerCase()}% `;
  const recipes = db.prepare(`
  SELECT * FROM recipes 
    WHERE LOWER(ingredients) LIKE ?
    ORDER BY updatedAt DESC
      `).all(searchTerm);

  return recipes.map(r => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]'),
    allergens: JSON.parse(r.allergens || '[]'),
    categories: JSON.parse(r.categories || '[]'),
    aiGenerated: Boolean(r.aiGenerated),
  }));
});

// Settings handlers
ipcMain.handle('settings:get', (_, key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
});

ipcMain.handle('settings:set', (_, key, value) => {
  db.prepare(`
    INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)
    `).run(key, JSON.stringify(value));
  return true;
});

ipcMain.handle('settings:getAll', () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(row => {
    settings[row.key] = JSON.parse(row.value);
  });
  return settings;
});

// Proxy handler for fetching external URLs (bypassing CORS)
// Proxy handler for fetching external URLs (bypassing CORS and simple bot checks)
ipcMain.handle('app:fetchUrl', async (_, url) => {
  // Use a hidden window to fetch content, bypassing basic bot detections
  const win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Don't use offscreen - it can trigger bot detection
    }
  });

  try {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await win.loadURL(url, { userAgent });

    // Wait for page to potentially pass Cloudflare challenge
    // Poll for up to 60 seconds to allow user to complete CAPTCHA if needed
    let html = '';
    let attempts = 0;
    const maxAttempts = 120; // 120 * 500ms = 60 seconds max
    let shownWindow = false;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
      } catch (e) {
        // Page might be navigating, wait and retry
        attempts++;
        continue;
      }

      // Check if we're past the Cloudflare challenge
      if (!html.includes('Just a moment') && !html.includes('Checking your browser') && !html.includes('Verify you are human')) {
        // Wait for JavaScript content to render (important for sites like Food.com)
        console.log('Page loaded, waiting for JS content to render...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
        break;
      }

      // After 2 seconds, show the window to help Cloudflare pass
      if (attempts === 4 && !shownWindow) {
        console.log('Cloudflare detected, showing window for verification...');
        win.show();
        win.focus();
        shownWindow = true;
      }

      attempts++;
    }

    // Hide window if we showed it
    if (shownWindow) {
      win.hide();
    }

    console.log('Fetch complete, HTML length:', html.length);
    win.destroy();
    return html;
  } catch (error) {
    if (!win.isDestroyed()) win.destroy();
    console.error('Fetch error:', error);
    throw new Error(error.message);
  }
});

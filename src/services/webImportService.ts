import type { Recipe, Ingredient, AISettings } from '../types';

export interface SearchResult {
    title: string;
    url: string;
    site: string;
}

export type RecipeSource = 'all' | 'giallozafferano' | 'budgetbytes' | 'web';

// Search for recipes on supported websites
export async function searchRecipes(query: string, source: RecipeSource = 'all'): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // GialloZafferano
    if (source === 'all' || source === 'giallozafferano') {
        try {
            const url = `https://www.giallozafferano.it/ricerca-ricette/${encodeURIComponent(query)}`;
            const html = await fetchHtml(url);

            // Regex to find recipe links in GZ structure: 
            // <h2 class="gz-title"><a href="..." title="...">Title</a></h2>
            // We look for title attribute to get the clean title
            const linkRegex = /<h2[^>]*class="[^"]*gz-title[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"[^>]+title="([^"]+)"/gi;

            let match;
            const seenUrls = new Set<string>();

            while ((match = linkRegex.exec(html)) !== null) {
                const recipeUrl = match[1];
                const title = match[2];

                if (recipeUrl && title && !seenUrls.has(recipeUrl)) {
                    seenUrls.add(recipeUrl);
                    results.push({
                        url: recipeUrl,
                        title: title.replace(/&quot;/g, '"').replace(/&#39;/g, "'"), // Basic decode
                        site: 'GialloZafferano'
                    });
                }
            }
        } catch (e) {
            console.error('GialloZafferano search failed', e);
        }
    }

    // Budget Bytes (English - Budget-friendly recipes)
    if (source === 'all' || source === 'budgetbytes') {
        try {
            const url = `https://www.budgetbytes.com/?s=${encodeURIComponent(query)}`;
            const html = await fetchHtml(url);

            // Budget Bytes links are in format: https://www.budgetbytes.com/recipe-name/
            // Look for article links with recipe titles
            const linkRegex = /<a[^>]+href="(https:\/\/www\.budgetbytes\.com\/[a-z0-9-]+\/)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;

            let match;
            const seenUrls = new Set<string>(results.map(r => r.url));

            while ((match = linkRegex.exec(html)) !== null) {
                const recipeUrl = match[1];
                const title = match[2].trim();

                // Skip non-recipe links and duplicates
                if (!recipeUrl || !title || seenUrls.has(recipeUrl)) continue;

                // Skip category/tag pages
                if (recipeUrl.includes('/category/') || recipeUrl.includes('/tag/')) continue;

                seenUrls.add(recipeUrl);
                results.push({
                    url: recipeUrl,
                    title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
                    site: 'Budget Bytes'
                });
            }
        } catch (e) {
            console.error('Budget Bytes search failed', e);
        }
    }

    // DuckDuckGo (Experimental - searches web for recipes)
    if (source === 'all' || source === 'web') {
        try {
            // Use DuckDuckGo HTML version which is lighter
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' recipe')}`;
            const html = await fetchHtml(url);

            // DuckDuckGo HTML results are in format:
            // <a class="result__a" href="...">Title</a>
            const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

            let match;
            const seenUrls = new Set<string>(results.map(r => r.url));
            let ddgCount = 0;
            const maxDdgResults = 10; // Limit DuckDuckGo results

            while ((match = linkRegex.exec(html)) !== null && ddgCount < maxDdgResults) {
                let recipeUrl = match[1];
                const title = match[2].trim();

                // Skip if no URL, no title, or already seen
                if (!recipeUrl || !title || seenUrls.has(recipeUrl)) continue;

                // DuckDuckGo sometimes uses redirect URLs, try to extract actual URL
                if (recipeUrl.includes('duckduckgo.com/l/?')) {
                    const uddgMatch = recipeUrl.match(/uddg=([^&]+)/);
                    if (uddgMatch) {
                        recipeUrl = decodeURIComponent(uddgMatch[1]);
                    }
                }

                // Skip non-http links and common non-recipe sites
                if (!recipeUrl.startsWith('http')) continue;
                if (recipeUrl.includes('youtube.com') || recipeUrl.includes('amazon.com')) continue;

                // Skip sites we already search directly
                if (recipeUrl.includes('giallozafferano.it') || recipeUrl.includes('budgetbytes.com')) continue;

                // Extract domain for display
                let domain = '';
                try {
                    domain = new URL(recipeUrl).hostname.replace('www.', '');
                } catch { domain = 'web'; }

                seenUrls.add(recipeUrl);
                results.push({
                    url: recipeUrl,
                    title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'"),
                    site: `🧪 ${domain}`
                });
                ddgCount++;
            }
        } catch (e) {
            console.error('DuckDuckGo search failed', e);
        }
    }

    return results;
}

// Parse recipe from web URL using AI
// Parse recipe from web URL using AI
export async function importRecipeFromUrl(
    url: string,
    settings: AISettings
): Promise<Partial<Recipe>> {
    // First, fetch the webpage content
    const pageContent = await fetchPageContent(url);

    if (!pageContent) {
        throw new Error('Could not fetch recipe page content');
    }

    // Use AI to extract recipe data
    console.log('Page Content Length:', pageContent.length);
    if (pageContent.length < 500) {
        console.warn('Page content seems too short. Possible bot block or empty page.', pageContent);
    }
    const extractedRecipe = await extractRecipeWithAI(pageContent, settings);

    return {
        ...extractedRecipe,
        aiGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

async function fetchPageContent(url: string): Promise<string> {
    try {
        const html = await fetchHtml(url);

        // First, try to extract JSON-LD structured data (most recipe sites use this)
        const jsonLdData = extractJsonLd(html);
        if (jsonLdData) {
            console.log('Found JSON-LD recipe data');
            return JSON.stringify(jsonLdData);
        }

        // Fallback: Extract text content from HTML (basic parsing)
        console.log('No JSON-LD found, falling back to text extraction');
        const textContent = extractTextFromHtml(html);

        // Limit content length for API
        return textContent.slice(0, 15000);
    } catch (error) {
        console.error('Error fetching page:', error);
        throw new Error('Could not access the recipe URL. The site may be blocking external requests.');
    }
}

// Extract JSON-LD structured data from HTML (Recipe schema)
function extractJsonLd(html: string): Record<string, unknown> | null {
    try {
        // Find all JSON-LD scripts
        const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
                const data = JSON.parse(match[1]);

                // Check if it's a Recipe directly
                if (data['@type'] === 'Recipe') {
                    return data;
                }

                // Check if it's inside @graph array
                if (data['@graph'] && Array.isArray(data['@graph'])) {
                    const recipe = data['@graph'].find((item: Record<string, unknown>) => item['@type'] === 'Recipe');
                    if (recipe) return recipe;
                }

                // Check if it's an array of types
                if (Array.isArray(data)) {
                    const recipe = data.find((item: Record<string, unknown>) => item['@type'] === 'Recipe');
                    if (recipe) return recipe;
                }
            } catch {
                // Invalid JSON, try next match
                continue;
            }
        }
    } catch (e) {
        console.error('Error parsing JSON-LD:', e);
    }
    return null;
}

function extractTextFromHtml(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments

    // Replace block tags with newlines to preserve structure
    text = text.replace(/<\/(div|p|li|ul|ol|tr|h[1-6]|header|footer|nav|section|article|aside|main)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/td>/gi, ' '); // Add space between table cells

    // Remove all HTML tags but keep content
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up whitespace by line
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
}

const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract the recipe information from the provided webpage content.

Extract the following information and respond ONLY with valid JSON:
  "type": "food or drink",
  "title": "Recipe title",
  "description": "Brief description of the dish",
  "ingredients": [
    {"name": "ingredient name", "amount": "quantity", "unit": "measurement unit"}
  ],
  "instructions": "Step-by-step cooking instructions with clear separation.",
  "cookingTime": 30,
  "servings": 4,
  "allergens": ["list", "of", "allergens"],
  "categories": ["cuisine type", "meal type"],
  "glassware": "suggested glass type (if drink)",
  "ice": "ice type e.g. Cubes, Crushed (if drink)",
  "tools": ["list", "of", "tools"],
  "isAlcoholic": true
}

CRITICAL INSTRUCTIONS:
1. Pay extreme attention to ingredient quantities and units. Do not miss them.
2. If instructions are in a list, combine them but preserve order.
3. Ensure no HTML tags remain in the output.
4. Translate content to the language of the provided text (or English if unclear).
5. Double check that all ingredients listed in the text are included.
6. If the page content appears to be a CAPTCHA, error page, or does not contain a recipe, respond with: {"error": "No recipe found in content"}.`;

async function extractRecipeWithAI(
    content: string,
    settings: AISettings
): Promise<Partial<Recipe>> {
    let response: string;

    // Normalize provider
    const provider = settings.provider === 'ollama' ? 'ollama' : settings.provider;
    const apiKey = settings.apiKey || '';
    const model = settings.model;

    if (provider === 'gemini') {
        response = await callGeminiForExtraction(apiKey, content, model);
    } else if (provider === 'openai') {
        response = await callOpenAIForExtraction(apiKey, content, model);
    } else if (provider === 'anthropic') {
        response = await callAnthropicForExtraction(apiKey, content, model);
    } else if (provider === 'ollama') {
        response = await callOllamaForExtraction(content, settings);
    } else {
        throw new Error('Unsupported AI provider for recipe import');
    }

    // Parse JSON from response
    // Parse JSON from response
    console.log('AI Raw Input Preview:', content.substring(0, 200) + '...');
    console.log('AI Raw Response:', response);

    let jsonStr = '';
    // Try to find markdown code block first
    const codeBlockMatch = response.match(/```json?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
    } else {
        // Fallback: Miner strategy - find the valid JSON block
        let startIndex = response.indexOf('{');
        const endIndex = response.lastIndexOf('}');

        // Try up to 3 start positions to avoid infinite loops on long texts
        let attempts = 0;
        while (startIndex !== -1 && startIndex < endIndex && attempts < 3) {
            const candidate = response.substring(startIndex, endIndex + 1);
            // Quick check: does it look like our schema?
            if (candidate.includes('"title"')) {
                jsonStr = candidate;
                break;
            }
            startIndex = response.indexOf('{', startIndex + 1);
            attempts++;
        }

        // If miner failed, naive fallback
        if (!jsonStr && startIndex !== -1 && endIndex !== -1) {
            jsonStr = response.substring(response.indexOf('{'), endIndex + 1);
        }
    }

    if (!jsonStr) {
        console.warn('No JSON found in response');
        throw new Error('Could not parse recipe from AI response - no JSON found. Raw response: ' + response.substring(0, 100));
    }

    // Cleaning step: Remove control characters that might break JSON (except newlines/tabs)
    // eslint-disable-next-line no-control-regex
    jsonStr = jsonStr.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');

    let parsed;
    try {
        parsed = JSON.parse(jsonStr.trim());
    } catch (e) {
        console.error('JSON Parse Failed:', e);
        console.error('Faulty JSON String:', jsonStr);
        // Attempt simple repair for common issues
        try {
            // Remove trailing commas
            const fixedJson = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            parsed = JSON.parse(fixedJson);
        } catch {
            throw new Error('Could not parse recipe from AI response - invalid JSON');
        }
    }

    if (parsed.error) {
        throw new Error('AI Error: ' + parsed.error);
    }

    // Debug: Log parsed structure
    console.log('Parsed Recipe Object:', JSON.stringify(parsed, null, 2));

    // Handle nested structures: {"recipe": {...}}, {"ricetta": {...}}, {"data": {...}}
    let recipeData = parsed;
    if (parsed.recipe && typeof parsed.recipe === 'object') {
        recipeData = parsed.recipe;
    } else if (parsed.ricetta && typeof parsed.ricetta === 'object') {
        recipeData = parsed.ricetta;
    } else if (parsed.data && typeof parsed.data === 'object') {
        recipeData = parsed.data;
    }

    // Support both AI output format, Italian names, and JSON-LD schema fields
    const rawTitle = recipeData.title || recipeData.titolo || recipeData.nome || recipeData.name || 'Imported Recipe';
    const rawDescription = recipeData.description || recipeData.descrizione || '';
    const rawIngredients = recipeData.ingredients || recipeData.ingredienti || recipeData.recipeIngredient || [];
    const rawInstructions = recipeData.instructions || recipeData.istruzioni || recipeData.procedimento || recipeData.recipeInstructions || '';
    const cookingTime = recipeData.cookingTime || recipeData.tempoDiCottura || recipeData.tempo || recipeData.totalTime || recipeData.cookTime;
    const servings = recipeData.servings || recipeData.porzioni || recipeData.dosi || recipeData.recipeYield;
    const allergens = recipeData.allergens || recipeData.allergeni || [];
    const categories = recipeData.categories || recipeData.categorie || recipeData.recipeCategory || [];

    // Ensure string types (AI might return arrays)
    const title = typeof rawTitle === 'string' ? rawTitle : String(rawTitle);
    const description = typeof rawDescription === 'string' ? rawDescription : String(rawDescription);

    // Handle instructions - can be string, array of strings, or array of HowToStep/HowToSection objects
    let instructions = '';
    if (typeof rawInstructions === 'string') {
        instructions = rawInstructions;
    } else if (Array.isArray(rawInstructions)) {
        const instructionParts: string[] = [];
        for (const item of rawInstructions) {
            if (typeof item === 'string') {
                instructionParts.push(item);
            } else if (item && typeof item === 'object') {
                // HowToStep: {text: "..."}
                if (item.text) {
                    instructionParts.push(String(item.text));
                }
                // HowToSection: {name: "...", itemListElement: [...]}
                else if (item.itemListElement && Array.isArray(item.itemListElement)) {
                    if (item.name) instructionParts.push(`\n## ${item.name}`);
                    for (const step of item.itemListElement) {
                        if (typeof step === 'string') {
                            instructionParts.push(step);
                        } else if (step && step.text) {
                            instructionParts.push(String(step.text));
                        }
                    }
                }
            }
        }
        instructions = instructionParts.join('\n');
    } else {
        instructions = String(rawInstructions || '');
    }

    // Clean up instructions - remove image reference numbers from GialloZafferano etc.
    // These appear as single digits AFTER ingredient names, like "cipolla 1", "sedano 2"
    // IMPROVED REGEX:
    // 1. Matches 1-2 digits (\d{1,2})
    // 2. Ensures entire number is matched ((?!\d) - next char is not digit)
    // 3. Ensures not part of range or fraction ((?![-/.]) - next char is not -, /, .)
    // 4. Ensures not followed by units ((?!\s*unit))
    instructions = instructions
        .replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ])\s+(\d{1,2})(?!\d|[-/.])(?!\s*(?:cm|mm|m|g|kg|mg|ml|l|litri|minuti|min|ore|h|gradi|°|secondi|sec|porzioni|persone|volte|fette|pezzi))/gi, '$1')
        // Remove multiple spaces
        .replace(/\s{2,}/g, ' ')
        // Clean up resulting double punctuation (e.g. "cipola 1," -> "cipolla ,")
        .replace(/\s+,/g, ',')
        .replace(/\s+\./g, '.')
        .replace(/,\s*,/g, ',')
        .replace(/\.\s*\./g, '.')
        .trim();

    // Validate and transform ingredients - handle nested/grouped structures
    // AI might return: 
    // - flat array: [{name, amount, unit}, ...]
    // - grouped object: {ragu: [...], bechamel: [...]}
    // - sectioned array: [{section: "Ragù", items: [...]}, ...]

    console.log('Raw Ingredients Type:', typeof rawIngredients);
    console.log('Raw Ingredients Is Array:', Array.isArray(rawIngredients));
    console.log('Raw Ingredients:', JSON.stringify(rawIngredients, null, 2));

    let flatIngredients: Array<string | { name?: string; nome?: string; amount?: string | number; quantita?: string | number; unit?: string; unita?: string }> = [];

    if (Array.isArray(rawIngredients)) {
        // Check if it's an array of sections with "items" or "ingredienti"
        const firstItem = rawIngredients[0];
        if (firstItem && (firstItem.items || firstItem.ingredienti)) {
            // Sectioned format: [{section: "...", items: [...]}]
            for (const section of rawIngredients) {
                const sectionItems = section.items || section.ingredienti || [];
                const sectionName = section.section || section.sezione || section.name || section.nome || '';
                for (const item of sectionItems) {
                    // Prepend section name to ingredient for context
                    flatIngredients.push({
                        ...item,
                        name: sectionName ? `[${sectionName}] ${item.name || item.nome || ''}` : (item.name || item.nome || ''),
                    });
                }
            }
        } else {
            // Regular flat array
            flatIngredients = rawIngredients;
        }
    } else if (rawIngredients && typeof rawIngredients === 'object') {
        // Object format: {ragu: [...], bechamel: [...]}
        for (const [sectionName, sectionItems] of Object.entries(rawIngredients)) {
            if (Array.isArray(sectionItems)) {
                for (const item of sectionItems as Array<{ name?: string; nome?: string; amount?: string | number; quantita?: string | number; unit?: string; unita?: string }>) {
                    flatIngredients.push({
                        ...item,
                        name: `[${sectionName}] ${item.name || item.nome || ''}`,
                    });
                }
            }
        }
    }

    console.log('Flattened Ingredients Count:', flatIngredients.length);

    // Map ingredients - handle both string format and object format
    const ingredients: Ingredient[] = flatIngredients.map((ing) => {
        // If ingredient is a plain string (e.g., "500 g di farina")
        if (typeof ing === 'string') {
            // Try to parse amount/unit from beginning of string
            // Pattern: "500 g di farina" -> amount: "500", unit: "g", name: "farina"
            // Pattern: "q.b. sale" -> amount: "q.b.", unit: "", name: "sale"
            const match = ing.match(/^([\d.,/]+\s*(?:g|kg|ml|l|cl|cucchiai?|cucchiaini?|tazze?|pizzico|q\.?b\.?)?)\s*(?:di\s+)?(.+)$/i);
            if (match) {
                const [, amountUnit, name] = match;
                // Try to separate amount and unit
                const amountMatch = amountUnit.match(/^([\d.,/]+)\s*(.*)$/);
                if (amountMatch) {
                    return {
                        name: name.trim(),
                        amount: amountMatch[1].trim(),
                        unit: amountMatch[2].trim(),
                    };
                }
                return {
                    name: name.trim(),
                    amount: amountUnit.trim(),
                    unit: '',
                };
            }
            // If no pattern matches, use the whole string as name
            return {
                name: ing.trim(),
                amount: '',
                unit: '',
            };
        }

        // Object format
        return {
            name: String(ing.name || ing.nome || '').trim(),
            amount: String(ing.amount || ing.quantita || '').trim(),
            unit: String(ing.unit || ing.unita || '').trim(),
        };
    }).filter(ing => ing.name.length > 0); // Filter out empty ingredients

    // Enhanced type detection
    const rawType = String(recipeData.type || recipeData.tipo || '').toLowerCase();
    const drinkKeywords = ['drink', 'bevanda', 'cocktail', 'mocktail', 'smoothie', 'shake', 'coffee', 'tea', 'beverage', 'liquor'];
    const isDrink = drinkKeywords.some(k => rawType.includes(k));

    return {
        title,
        description,
        ingredients,
        instructions,
        cookingTime: typeof cookingTime === 'number' ? cookingTime : undefined,
        servings: typeof servings === 'number' ? servings : undefined,
        allergens: Array.isArray(allergens) ? allergens : [],
        categories: Array.isArray(categories) ? categories : [],
        type: isDrink ? 'drink' : 'food',
        glassware: recipeData.glassware || recipeData.bicchiere,
        ice: recipeData.ice || recipeData.ghiaccio,
        tools: Array.isArray(recipeData.tools || recipeData.strumenti) ? (recipeData.tools || recipeData.strumenti) : [],
        isAlcoholic: recipeData.isAlcoholic !== undefined ? recipeData.isAlcoholic : (recipeData.alcolico !== undefined ? recipeData.alcolico : false),
    };
}

async function callGeminiForExtraction(apiKey: string, content: string, model?: string): Promise<string> {
    const modelId = model || 'gemini-2.0-flash';
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${RECIPE_EXTRACTION_PROMPT}\n\nWebpage content:\n${content}` }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                    maxOutputTokens: 4096,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAIForExtraction(apiKey: string, content: string, model?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: RECIPE_EXTRACTION_PROMPT },
                { role: 'user', content: `Extract recipe from:\n${content}` }
            ],
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callAnthropicForExtraction(apiKey: string, content: string, model?: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: model || 'claude-3-5-haiku-20241022',
            max_tokens: 4096,
            system: RECIPE_EXTRACTION_PROMPT,
            messages: [
                { role: 'user', content: `Extract recipe from:\n${content}` }
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
}



async function callOllamaForExtraction(content: string, settings: AISettings): Promise<string> {
    const endpoint = settings.ollamaEndpoint || 'http://localhost:11434';
    // Ensure endpoint doesn't end with slash
    const baseUrl = endpoint.replace(/\/$/, '');
    const url = `${baseUrl}/api/chat`;

    const model = settings.ollamaModel || settings.model || 'llama3';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: RECIPE_EXTRACTION_PROMPT },
                    { role: 'user', content: `Extract recipe from:\n${content}` }
                ],
                format: 'json', // Force JSON output mode
                stream: false,
                options: { temperature: 0.1 } // Lower temperature for extraction
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data.message?.content || '';
    } catch (e) {
        console.error('Ollama Call Failed:', e);
        throw e;
    }
}

async function fetchHtml(url: string): Promise<string> {
    // Use Electron IPC if available (bypasses CORS)
    if (window.electronAPI && window.electronAPI.fetchUrl) {
        return await window.electronAPI.fetchUrl(url);
    }

    // Fallback for browser dev mode (CORS might fail)
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SimonCooks/1.0; Recipe Fetcher)',
            'Accept': 'text/html'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
}

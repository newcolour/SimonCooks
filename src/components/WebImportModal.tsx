import { useState } from 'react';
import { X, Globe, Download, Loader, AlertTriangle, CheckCircle, Search, Link as LinkIcon } from 'lucide-react';
import { importRecipeFromUrl, searchRecipes, type SearchResult, type RecipeSource } from '../services/webImportService';
import type { Recipe, AppSettings } from '../types';
import { getTranslation } from '../i18n';
import './WebImportModal.css';

interface WebImportModalProps {
    settings: AppSettings;
    onClose: () => void;
    onImportComplete: (recipe: Partial<Recipe>) => void;
}

export function WebImportModal({ settings, onClose, onImportComplete }: WebImportModalProps) {
    const [mode, setMode] = useState<'url' | 'search'>('url');
    const [url, setUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [searchSource, setSearchSource] = useState<RecipeSource>('all');

    // Get translations
    const t = getTranslation(settings.language || 'en');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setError(null);
        try {
            const results = await searchRecipes(searchQuery, searchSource);
            setSearchResults(results);
            if (results.length === 0) {
                setError(t.common.noResults);
            }
        } catch (err) {
            console.error(err);
            setError(t.common.error);
        } finally {
            setSearching(false);
        }
    };

    const handleImport = async (importUrl: string = url) => {
        if (!importUrl) return;

        // Basic URL validation
        try {
            new URL(importUrl);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        const apiKey = settings.ai.apiKey;
        if (!apiKey && settings.ai.provider !== 'ollama') {
            setError(t.ai.noApiKey);
            return;
        }


        setLoading(true);
        setLoadingUrl(importUrl);
        setError(null);

        try {
            const recipe = await importRecipeFromUrl(
                importUrl,
                settings.ai
            );

            setSuccess(true);
            setTimeout(() => {
                onImportComplete(recipe);
                onClose();
            }, 1000);

        } catch (err) {
            console.error('Import failed:', err);
            setError(err instanceof Error ? err.message : t.webImport.error);
        } finally {
            setLoading(false);
            setLoadingUrl(null);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content web-import-modal">
                <div className="modal-header">
                    <h2>
                        <Globe className="modal-icon" />
                        {t.webImport.title}
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="import-tabs">
                        <button
                            className={`import-tab ${mode === 'url' ? 'active' : ''}`}
                            onClick={() => setMode('url')}
                        >
                            <LinkIcon size={16} style={{ display: 'inline', marginRight: 4 }} />
                            URL Import
                        </button>
                        <button
                            className={`import-tab ${mode === 'search' ? 'active' : ''}`}
                            onClick={() => setMode('search')}
                        >
                            <Search size={16} style={{ display: 'inline', marginRight: 4 }} />
                            Search Online
                        </button>
                    </div>

                    <p className="modal-description">
                        {mode === 'url' ? t.webImport.subtitle : 'Search for recipes online'}
                    </p>

                    {mode === 'url' ? (
                        <div className="input-group">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder={t.webImport.urlPlaceholder}
                                className="url-input"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleImport(url)}
                            />
                        </div>
                    ) : (
                        <div className="search-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Search on:
                                </label>
                                <select
                                    value={searchSource}
                                    onChange={(e) => setSearchSource(e.target.value as RecipeSource)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="giallozafferano">🇮🇹 GialloZafferano</option>
                                    <option value="budgetbytes">🇺🇸 Budget Bytes</option>
                                    <option value="web">🧪 Web Search (experimental)</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Carbonara, Tiramisù..."
                                    className="url-input"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button className="btn-primary" onClick={handleSearch} disabled={searching}>
                                    {searching ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map((result, idx) => {
                                        const isImporting = loadingUrl === result.url;
                                        return (
                                            <div
                                                key={idx}
                                                className={`search-result-item ${isImporting ? 'importing' : ''}`}
                                                onClick={() => !loading && handleImport(result.url)}
                                            >
                                                {isImporting ? (
                                                    <div className="importing-indicator">
                                                        <Loader size={18} className="animate-spin" />
                                                        <span>{t.webImport.importing}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="result-title">{result.title}</span>
                                                        <span className="result-site">{result.site}</span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            <CheckCircle size={16} />
                            {t.webImport.success}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        {t.recipe.cancel}
                    </button>
                    {mode === 'url' && (
                        <button
                            className="btn-primary"
                            onClick={() => handleImport(url)}
                            disabled={loading || !url || success}
                        >
                            {loading ? (
                                <>
                                    <Loader size={16} className="animate-spin" />
                                    {t.webImport.importing}
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    {t.webImport.import}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

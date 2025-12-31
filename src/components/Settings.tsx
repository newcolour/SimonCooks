import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, AISettings } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { AI_PROVIDERS, IMAGE_PROVIDERS, PROVIDER_MODELS, IMAGE_MODELS, fetchOllamaModels, type OllamaModel } from '../services/aiService';
import { LANGUAGES } from '../i18n';
import {
    Settings as SettingsIcon,
    Key,
    Server,
    Palette,
    Save,
    RotateCcw,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    Cpu
} from 'lucide-react';
import './Settings.css';

// API key links for each provider
const API_KEY_LINKS: Record<string, { url: string; label: string }> = {
    openai: { url: 'https://platform.openai.com/api-keys', label: 'Get OpenAI API key' },
    anthropic: { url: 'https://console.anthropic.com/settings/keys', label: 'Get Anthropic API key' },
    gemini: { url: 'https://aistudio.google.com/app/apikey', label: 'Get Gemini API key' },
    pollinations: { url: 'https://enter.pollinations.ai/', label: 'Get Pollinations API key' },
    cloudflare: { url: 'https://dash.cloudflare.com/profile/api-tokens', label: 'Get Cloudflare Token' },
};

// Format file size
function formatSize(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
}

// Ollama Settings Sub-component
interface OllamaSettingsProps {
    localSettings: AISettings;
    setLocalSettings: (settings: AISettings) => void;
    language: Language;
}

function OllamaSettings({ localSettings, setLocalSettings, language }: OllamaSettingsProps) {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const t = getTranslation(language);

    const loadModels = useCallback(async () => {
        setLoadingModels(true);
        setModelsError(null);
        try {
            const endpoint = localSettings.ollamaEndpoint || 'http://localhost:11434';
            const fetchedModels = await fetchOllamaModels(endpoint);
            setModels(fetchedModels);
            if (fetchedModels.length === 0) {
                setModelsError(t.settings.noModels);
            }
        } catch {
            setModelsError(t.common.error);
        } finally {
            setLoadingModels(false);
        }
    }, [localSettings.ollamaEndpoint, t.settings.noModels, t.common.error]);

    useEffect(() => {
        loadModels();
    }, [loadModels]);

    return (
        <>
            <div className="form-group">
                <label>
                    <Server size={16} />
                    {t.settings.ollamaEndpoint}
                </label>
                <input
                    type="url"
                    value={localSettings.ollamaEndpoint || 'http://localhost:11434'}
                    onChange={(e) => setLocalSettings({ ...localSettings, ollamaEndpoint: e.target.value })}
                    placeholder="http://localhost:11434"
                />
            </div>
            <div className="form-group">
                <label>
                    <Cpu size={16} />
                    {t.settings.ollamaModel}
                    <button
                        type="button"
                        className="refresh-models-btn"
                        onClick={loadModels}
                        disabled={loadingModels}
                    >
                        <RefreshCw size={14} className={loadingModels ? 'animate-spin' : ''} />
                        {t.settings.refresh}
                    </button>
                </label>
                {models.length > 0 ? (
                    <select
                        value={localSettings.ollamaModel || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, ollamaModel: e.target.value })}
                        className="model-select"
                    >
                        <option value="">{t.recipe.selectRecipe}</option>
                        {models.map((model) => (
                            <option key={model.name} value={model.name}>
                                {model.name} ({formatSize(model.size)})
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={localSettings.ollamaModel || 'llama3.2'}
                        onChange={(e) => setLocalSettings({ ...localSettings, ollamaModel: e.target.value })}
                        placeholder="llama3.2"
                    />
                )}
                {modelsError && (
                    <span className="models-error">{modelsError}</span>
                )}
            </div>
        </>
    );
}

interface SettingsProps {
    settings: AppSettings;
    onUpdateAI: (settings: Partial<AISettings>) => Promise<void>;
    onUpdateTheme: (theme: AppSettings['theme']) => Promise<void>;
    onUpdateLanguage: (language: AppSettings['language']) => Promise<void>;
    onReset: () => Promise<void>;
}

export function Settings({ settings, onUpdateAI, onUpdateTheme, onUpdateLanguage, onReset }: SettingsProps) {
    const [localSettings, setLocalSettings] = useState<AISettings>(settings.ai);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default language to English if not set
    const language = settings.language || 'en';
    const t = getTranslation(language);

    const selectedProvider = AI_PROVIDERS.find(p => p.id === localSettings.provider);
    const selectedImageProvider = IMAGE_PROVIDERS.find(p => p.id === localSettings.imageProvider);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await onUpdateAI(localSettings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.common.error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm(t.recipe.deleteConfirm)) { // Reusing confirmation message or add new one? I'll use deleteConfirm for now but better "Are you sure?"
            await onReset();
            setLocalSettings(settings.ai);
        }
    };

    return (
        <div className="settings">
            <div className="settings-header">
                <div className="settings-title">
                    <SettingsIcon size={28} />
                    <h1>{t.settings.title}</h1>
                </div>
                <p className="settings-subtitle">
                    {t.settings.subtitle}
                </p>
            </div>

            <div className="settings-content">
                {/* AI Provider Section */}
                <section className="settings-section">
                    <h2>{t.settings.aiProvider}</h2>
                    <p className="section-description">
                        {t.settings.aiProviderDesc}
                    </p>

                    <div className="provider-grid">
                        {AI_PROVIDERS.map(provider => (
                            <button
                                key={provider.id}
                                className={`provider-card ${localSettings.provider === provider.id ? 'selected' : ''}`}
                                onClick={() => setLocalSettings({ ...localSettings, provider: provider.id })}
                            >
                                <span className="provider-name">{provider.name}</span>
                                <div className="provider-features">
                                    {!provider.requiresApiKey && <span className="feature">Free/Local</span>}
                                    {provider.supportsImageGeneration && <span className="feature">Images</span>}
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedProvider?.requiresApiKey && (
                        <div className="form-group">
                            <label>
                                <Key size={16} />
                                {t.settings.apiKey}
                                {API_KEY_LINKS[localSettings.provider] && (
                                    <a
                                        href={API_KEY_LINKS[localSettings.provider].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="api-key-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t.settings.getApiKey}
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </label>
                            <input
                                type="password"
                                value={localSettings.apiKey || ''}
                                onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                                placeholder={`Enter your ${selectedProvider.name} API key`}
                            />
                        </div>
                    )}

                    {/* Model selector for cloud providers */}
                    {selectedProvider?.requiresApiKey && PROVIDER_MODELS[localSettings.provider] && (
                        <div className="form-group">
                            <label>
                                <Cpu size={16} />
                                {t.settings.model}
                            </label>
                            <select
                                value={localSettings.model || PROVIDER_MODELS[localSettings.provider][0]?.id || ''}
                                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                                className="model-select"
                            >
                                {PROVIDER_MODELS[localSettings.provider].map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {localSettings.provider === 'ollama' && (
                        <OllamaSettings
                            localSettings={localSettings}
                            setLocalSettings={setLocalSettings}
                            language={language}
                        />
                    )}
                </section>

                {/* Image Generation Section */}
                <section className="settings-section">
                    <h2>{t.settings.imageGeneration}</h2>
                    <p className="section-description">
                        {t.settings.imageGenerationDesc}
                    </p>

                    <div className="provider-grid">
                        {IMAGE_PROVIDERS.map(provider => (
                            <button
                                key={provider.id}
                                className={`provider-card ${localSettings.imageProvider === provider.id ? 'selected' : ''}`}
                                onClick={() => setLocalSettings({ ...localSettings, imageProvider: provider.id })}
                            >
                                <span className="provider-name">{provider.name}</span>
                            </button>
                        ))}
                    </div>

                    {selectedImageProvider?.requiresApiKey && localSettings.imageProvider !== localSettings.provider && localSettings.imageProvider !== 'cloudflare' && (
                        <div className="form-group">
                            <label>
                                <Key size={16} />
                                {t.settings.imageApiKey}
                                {API_KEY_LINKS[localSettings.imageProvider || ''] && (
                                    <a
                                        href={API_KEY_LINKS[localSettings.imageProvider || ''].url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="api-key-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {API_KEY_LINKS[localSettings.imageProvider || ''].label}
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </label>
                            <input
                                type="password"
                                value={localSettings.imageApiKey || ''}
                                onChange={(e) => setLocalSettings({ ...localSettings, imageApiKey: e.target.value })}
                                placeholder="Enter API key for image generation"
                            />
                        </div>
                    )}

                    {localSettings.imageProvider === 'cloudflare' && (
                        <>
                            <div className="form-group">
                                <label>
                                    <Key size={16} />
                                    Cloudflare Account ID
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.cloudflareAccountId || ''}
                                    onChange={(e) => setLocalSettings({ ...localSettings, cloudflareAccountId: e.target.value })}
                                    placeholder="Found in Cloudflare Dashboard URL"
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <Key size={16} />
                                    Cloudflare API Token
                                    <a
                                        href={API_KEY_LINKS.cloudflare.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="api-key-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {API_KEY_LINKS.cloudflare.label}
                                        <ExternalLink size={12} />
                                    </a>
                                </label>
                                <input
                                    type="password"
                                    value={localSettings.cloudflareApiToken || ''}
                                    onChange={(e) => setLocalSettings({ ...localSettings, cloudflareApiToken: e.target.value })}
                                    placeholder="Token with 'Workers AI: Read' permission"
                                />
                                <p className="help-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Create a Custom Token with <strong>Account &gt; Workers AI &gt; Read</strong> permissions.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Image Model selector */}
                    {localSettings.imageProvider && IMAGE_MODELS[localSettings.imageProvider] && (
                        <div className="form-group">
                            <label>
                                <Cpu size={16} />
                                {t.settings.imageModel}
                            </label>
                            <select
                                value={
                                    // Only use saved model if it exists in available models
                                    (localSettings.imageModel &&
                                        IMAGE_MODELS[localSettings.imageProvider || 'openai']?.some(m => m.id === localSettings.imageModel))
                                        ? localSettings.imageModel
                                        : IMAGE_MODELS[localSettings.imageProvider || 'openai']?.[0]?.id || ''
                                }
                                onChange={(e) => setLocalSettings({ ...localSettings, imageModel: e.target.value })}
                                className="model-select"
                            >
                                {IMAGE_MODELS[localSettings.imageProvider || 'openai']?.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </section>

                {/* Theme Section */}
                <section className="settings-section">
                    <h2>
                        <Palette size={20} />
                        {t.settings.appearance}
                    </h2>
                    <p className="section-description">
                        {t.settings.appearanceDesc}
                    </p>

                    <div className="theme-grid">
                        {/* Base Themes */}
                        <button
                            className={`theme-card ${settings.theme === 'dark' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('dark')}
                        >
                            <div className="theme-preview dark-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">{t.settings.dark}</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'light' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('light')}
                        >
                            <div className="theme-preview light-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">{t.settings.light}</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'system' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('system')}
                        >
                            <div className="theme-preview system-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">{t.settings.system}</span>
                        </button>

                        {/* Color Themes */}
                        <button
                            className={`theme-card ${settings.theme === 'ocean' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('ocean')}
                        >
                            <div className="theme-preview ocean-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🌊 Ocean</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'forest' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('forest')}
                        >
                            <div className="theme-preview forest-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🌲 Forest</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'sunset' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('sunset')}
                        >
                            <div className="theme-preview sunset-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🌅 Sunset</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'rose' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('rose')}
                        >
                            <div className="theme-preview rose-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🌸 Rose</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'slate' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('slate')}
                        >
                            <div className="theme-preview slate-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🪨 Slate</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'lavender' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('lavender')}
                        >
                            <div className="theme-preview lavender-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">💜 Lavender</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'sand' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('sand')}
                        >
                            <div className="theme-preview sand-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">🏖️ Sand</span>
                        </button>

                        <button
                            className={`theme-card ${settings.theme === 'sky' ? 'selected' : ''}`}
                            onClick={() => onUpdateTheme('sky')}
                        >
                            <div className="theme-preview sky-preview">
                                <div className="preview-sidebar"></div>
                                <div className="preview-content"></div>
                            </div>
                            <span className="theme-name">☁️ Sky</span>
                        </button>
                    </div>
                </section>

                {/* Language Section */}
                <section className="settings-section">
                    <h2>
                        {t.settings.language}
                    </h2>
                    <p className="section-description">
                        {t.settings.languageDesc}
                    </p>

                    <div className="theme-options">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.id}
                                className={`theme-btn ${settings.language === lang.id ? 'selected' : ''}`}
                                onClick={() => onUpdateLanguage(lang.id)}
                            >
                                {lang.flag} {lang.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Status Messages */}
                {saved && (
                    <div className="status-message success">
                        <CheckCircle size={18} />
                        {t.settings.saved}
                    </div>
                )}

                {error && (
                    <div className="status-message error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="settings-actions">
                    <button className="btn-reset" onClick={handleReset}>
                        <RotateCcw size={18} />
                        {t.settings.reset}
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        <Save size={18} />
                        {saving ? t.settings.saving : t.settings.save}
                    </button>
                </div>
            </div>
        </div>
    );
}

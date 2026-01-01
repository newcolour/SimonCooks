import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, AISettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
    ai: {
        provider: 'gemini',
        apiKey: '',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3.2',
        imageProvider: 'openai',
        imageApiKey: '',
    },
    theme: 'system',
    language: 'en',
};

interface UseSettingsReturn {
    settings: AppSettings;
    loading: boolean;
    error: string | null;
    updateAISettings: (aiSettings: Partial<AISettings>) => Promise<void>;
    updateTheme: (theme: AppSettings['theme']) => Promise<void>;
    updateLanguage: (language: AppSettings['language']) => Promise<void>;
    resetSettings: () => Promise<void>;
    importSettings: (newSettings?: Partial<AppSettings>) => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (window.electronAPI) {
                const aiSettings = await window.electronAPI.settings.get('ai') as AISettings | null;
                const theme = await window.electronAPI.settings.get('theme') as AppSettings['theme'] | null;
                const language = await window.electronAPI.settings.get('language') as AppSettings['language'] | null;
                const tourCompleted = await window.electronAPI.settings.get('tourCompleted') as boolean | null;

                setSettings({
                    ai: aiSettings || DEFAULT_SETTINGS.ai,
                    theme: theme || DEFAULT_SETTINGS.theme,
                    language: language || DEFAULT_SETTINGS.language,
                    tourCompleted: tourCompleted ?? false,
                });
            } else {
                // Fallback for web development
                const stored = localStorage.getItem('simoncooks_settings');
                if (stored) {
                    setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.settings.set('ai', newSettings.ai);
                await window.electronAPI.settings.set('theme', newSettings.theme);
                await window.electronAPI.settings.set('language', newSettings.language);
                await window.electronAPI.settings.set('tourCompleted', newSettings.tourCompleted);
            } else {
                // Fallback for web development
                localStorage.setItem('simoncooks_settings', JSON.stringify(newSettings));
            }
            setSettings(newSettings);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
            throw err;
        }
    }, []);

    const updateAISettings = useCallback(async (aiSettings: Partial<AISettings>) => {
        const newSettings: AppSettings = {
            ...settings,
            ai: { ...settings.ai, ...aiSettings },
        };
        await saveSettings(newSettings);
    }, [settings, saveSettings]);

    const updateTheme = useCallback(async (theme: AppSettings['theme']) => {
        const newSettings: AppSettings = {
            ...settings,
            theme,
        };
        await saveSettings(newSettings);
    }, [settings, saveSettings]);

    const updateLanguage = useCallback(async (language: AppSettings['language']) => {
        const newSettings: AppSettings = {
            ...settings,
            language,
        };
        await saveSettings(newSettings);
    }, [settings, saveSettings]);

    const resetSettings = useCallback(async () => {
        await saveSettings(DEFAULT_SETTINGS);
    }, [saveSettings]);

    const importSettings = useCallback(async (newSettings?: Partial<AppSettings>) => {
        if (newSettings && Object.keys(newSettings).length > 0) {
            // Web/Manual import
            const mergedSettings = { ...settings, ...newSettings };
            await saveSettings(mergedSettings);
        } else {
            // Just reload (Electron case)
            await fetchSettings();
        }
    }, [settings, saveSettings, fetchSettings]);

    return {
        settings,
        loading,
        error,
        updateAISettings,
        updateTheme,
        updateLanguage,
        resetSettings,
        importSettings,
    };
}

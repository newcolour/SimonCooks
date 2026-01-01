import { useState, useEffect, useRef } from 'react';
import type { Recipe, AISettings } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
// import { askCookingQuestion } from '../services/aiService'; // Re-enable when Whisper is integrated
import {
    ChevronLeft,
    ChevronRight,
    X,
    MicOff,
    Sparkles,
    CheckCircle,
    ChefHat,
    Loader,
    Play,
    Pause
} from 'lucide-react';
import { translateRecipe } from '../services/aiService';
import './CookingMode.css';

interface CookingModeProps {
    recipe: Recipe;
    aiSettings: AISettings;
    language: Language;
    onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CookingMode({ recipe, aiSettings, language, onClose }: CookingModeProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [displayRecipe, setDisplayRecipe] = useState<Recipe>(recipe);
    const [isTranslating, setIsTranslating] = useState(false);
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isThinking, _setIsThinking] = useState(false);
    const t = getTranslation(language);

    // Translate recipe on mount if needed
    useEffect(() => {
        const translateIfNeeded = async () => {
            // Check if we have AI credentials
            const hasAI = aiSettings.apiKey || aiSettings.provider === 'ollama';

            if (hasAI) {
                setIsTranslating(true);
                try {
                    // Always try to translate to ensure interface language match
                    // The AI service handles the "translate if needed" logic effectively by rewriting
                    const translated = await translateRecipe(aiSettings, recipe, language);
                    setDisplayRecipe(prev => ({ ...prev, ...translated } as Recipe));
                } catch (error) {
                    console.error("Translation failed, using original:", error);
                    // Fallback to original
                } finally {
                    setIsTranslating(false);
                }
            }
        };

        translateIfNeeded();
    }, [recipe, language, aiSettings]);

    const steps = displayRecipe.instructions
        .split(/\n+/)
        .filter(step => step.trim().length > 0);

    /* ============================================================
     * VOICE RECOGNITION - DISABLED
     * Awaiting local Whisper server integration.
     * The code below is preserved for future re-enablement.
     * ============================================================ */

    /*
    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'it' ? 'it-IT' : 'en-US';

            recognitionRef.current.onresult = handleSpeechResult;
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => {
                if (isListening) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // Already started or other error
                    }
                }
            };
        }
    }, [language, currentStep]);

    // Handle speech commands
    const handleSpeechResult = async (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript.toLowerCase().trim();

        console.log('Voice command:', text);

        // Basic Navigation Commands
        if (text.includes('next') || text.includes('forward') || text.includes('prossimo') || text.includes('avanti')) {
            handleNext();
        } else if (text.includes('back') || text.includes('previous') || text.includes('indietro') || text.includes('precedente')) {
            handlePrev();
        } else if (text.includes('repeat') || text.includes('read') || text.includes('ripeti') || text.includes('leggi')) {
            speakStep(currentStep);
        } else if ((text.includes('stop') || text.includes('close') || text.includes('exit')) && !text.includes('recipe')) {
            setIsListening(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        } else if (text.length > 10 && aiSettings.apiKey) {
            handleAIQuestion(text);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        } else {
            setIsListening(true);
            if (recognitionRef.current) recognitionRef.current.start();
        }
    };
    */

    // Use ref to keep track of utterance to prevent garbage collection bug
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load voices on mount
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log("Loaded voices:", voices.length);
            if (voices.length > 0) {
                setVoicesLoaded(true);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const getBestVoice = (langCode: string) => {
        const voices = window.speechSynthesis.getVoices();
        // 1. Try exact match (e.g. "Google Italiano")
        let bestVoice = voices.find(v => v.lang === langCode && v.name.includes('Google'));
        // 2. Try exact lang code match
        if (!bestVoice) bestVoice = voices.find(v => v.lang === langCode);
        // 3. Try partial lang code match (e.g. 'it' matching 'it-IT')
        if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
        return bestVoice;
    };

    const speakText = (text: string) => {
        window.speechSynthesis.cancel();

        const langCode = language === 'it' ? 'it-IT' : 'en-US';
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = langCode;

        // Select best voice
        const voice = getBestVoice(langCode);
        if (voice) {
            utterance.voice = voice;
            console.log(`Using voice: ${voice.name} (${voice.lang})`);
        } else {
            console.warn(`No voice found for ${langCode}, using default.`);
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            console.log("Speech started");
            setSpeechStatus('playing');
        };

        utterance.onend = () => {
            console.log("Speech ended");
            setSpeechStatus('idle');
            utteranceRef.current = null; // Clear ref
        };

        utterance.onerror = (e) => {
            console.error("Speech error event:", e);
            // @ts-ignore - 'error' property exists on SpeechSynthesisErrorEvent
            console.error("Speech error code:", e.error);
            setSpeechStatus('idle');
            utteranceRef.current = null;
        };

        // Keep ref to prevent GC
        utteranceRef.current = utterance;

        setSpeechStatus('playing');
        window.speechSynthesis.speak(utterance);
    };

    const speakStep = (index: number) => {
        // If we are already speaking this step and paused, just resume
        if (speechStatus === 'paused') {
            window.speechSynthesis.resume();
            setSpeechStatus('playing');
            return;
        }

        if (index < steps.length) {
            // Strip leading numbers (e.g. "1. ", "1) ") from the step text to avoid double counting
            const cleanStepText = steps[index].replace(/^\d+[.)]\s*/, '');
            speakText(`${t.cooking?.step || 'Step'} ${index + 1}. ${cleanStepText}`);
        } else {
            speakText(t.cooking?.completed || "Recipe completed! Enjoy your meal.");
        }
    };

    const toggleSpeech = () => {
        if (speechStatus === 'playing') {
            window.speechSynthesis.pause();
            setSpeechStatus('paused');
        } else if (speechStatus === 'paused') {
            window.speechSynthesis.resume();
            setSpeechStatus('playing');
        } else {
            speakStep(currentStep);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            const next = currentStep + 1;
            setCurrentStep(next);
            speakStep(next);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            const prev = currentStep - 1;
            setCurrentStep(prev);
            speakStep(prev);
        }
    };

    // Auto-read first step only after translation is done AND voices are loaded
    useEffect(() => {
        if (!isTranslating && voicesLoaded) {
            // Small timeout to ensure browser is ready
            const timer = setTimeout(() => {
                speakStep(0);
            }, 500);
            return () => clearTimeout(timer);
        }
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [isTranslating, voicesLoaded]); // Depend on isTranslating and voicesLoaded

    const isComplete = currentStep === steps.length;

    return (
        <div className="cooking-mode">
            <header className="cooking-header">
                <div className="cooking-title">
                    <ChefHat size={24} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'bottom' }} />
                    {recipe.title}
                </div>
                <div className="cooking-actions">
                    <button className="cooking-btn" onClick={toggleSpeech} title={speechStatus === 'playing' ? "Pause" : "Speak step"}>
                        {speechStatus === 'playing' ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="cooking-btn close" onClick={onClose} title={t.cooking?.close || "Close"}>
                        <X size={24} />
                    </button>
                </div>
            </header>

            <div className="cooking-content">
                {isTranslating && (
                    <div className="cooking-loading-overlay">
                        <div className="loading-content">
                            <Loader className="animate-spin" size={48} />
                            <h3>{t.recipe?.translating || "Translating..."}</h3>
                            <p>Preparing languages for speech model...</p>
                        </div>
                    </div>
                )}
                {/* Ingredients Sidebar (toggleable on mobile technically, but hidden for now) */}
                <div className="cooking-sidebar">
                    <h3>{t.recipe.ingredients}</h3>
                    <ul className="cooking-ingredients-list">
                        {displayRecipe.ingredients.map((ing, i) => (
                            <li key={i} className="cooking-ingredient">
                                <span className="amount">{ing.amount} {ing.unit}</span>
                                <span className="name">{ing.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Step Display */}
                <div className="cooking-main">
                    {!isComplete ? (
                        <>
                            <div className="step-indicator">
                                {t.cooking?.step || "Step"} {currentStep + 1} / {steps.length}
                            </div>
                            <div className="step-content">
                                {steps[currentStep]}
                            </div>
                        </>
                    ) : (
                        <div className="completed-view">
                            <CheckCircle size={80} color="var(--color-accent-primary)" />
                            <h2>{t.cooking?.completed || "All Done!"}</h2>
                            <p>{t.cooking?.enjoy || "Enjoy your meal!"}</p>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="cooking-controls">
                        <button
                            className="nav-btn"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            title={t.cooking?.prev || "Previous"}
                        >
                            <ChevronLeft size={32} />
                        </button>

                        <div className="voice-control disabled">
                            <button
                                className="mic-btn disabled"
                                disabled
                                title="🚧 Work in Progress - Local Whisper server required"
                            >
                                <MicOff size={32} />
                            </button>
                            <span className="voice-status wip">
                                🚧 Voice control coming soon
                            </span>
                        </div>

                        <button
                            className="nav-btn"
                            onClick={handleNext}
                            disabled={isComplete}
                            title={t.cooking?.next || "Next"}
                        >
                            <ChevronRight size={32} />
                        </button>
                    </div>

                    {/* AI Chat Overlay */}
                    <div className={`cooking-chat ${aiResponse || isThinking ? 'active' : ''}`}>
                        <div className="chat-response">
                            <Sparkles size={24} />
                            <div style={{ flex: 1 }}>
                                {isThinking ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader className="animate-spin" size={20} />
                                        Thinking...
                                    </div>
                                ) : (
                                    aiResponse
                                )}
                            </div>
                            <button className="chat-close" onClick={() => setAiResponse(null)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

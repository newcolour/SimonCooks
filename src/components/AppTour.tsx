import { useState } from 'react';
import { X, ChefHat, Search, Sparkles, Globe, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Language } from '../i18n';
import './AppTour.css';

interface TourSlide {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface AppTourProps {
    language: Language;
    onComplete: (showAgain: boolean) => void;
}

export function AppTour({ language, onComplete }: AppTourProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showAgain, setShowAgain] = useState(false);

    const slides: TourSlide[] = [
        {
            icon: <ChefHat size={48} />,
            title: language === 'it' ? 'Benvenuto su SimonCooks!' : 'Welcome to SimonCooks!',
            description: language === 'it'
                ? 'Il tuo assistente personale per ricette potenziato dall\'IA. Organizza, scopri e crea ricette deliziose.'
                : 'Your personal AI-powered recipe assistant. Organize, discover, and create delicious recipes.'
        },
        {
            icon: <BookOpen size={48} />,
            title: language === 'it' ? 'Gestisci le tue Ricette' : 'Manage Your Recipes',
            description: language === 'it'
                ? 'Aggiungi, modifica e organizza le tue ricette. Filtra per ricette veloci, a basso contenuto calorico o recenti.'
                : 'Add, edit, and organize your recipes. Filter by quick meals, low calorie, or recent recipes.'
        },
        {
            icon: <Search size={48} />,
            title: language === 'it' ? 'Ricerca Intelligente' : 'Smart Search',
            description: language === 'it'
                ? 'Cerca per nome, ingrediente, categoria o anche per le tue note personali.'
                : 'Search by name, ingredient, category, or even your personal notes.'
        },
        {
            icon: <Globe size={48} />,
            title: language === 'it' ? 'Importa dal Web' : 'Import from Web',
            description: language === 'it'
                ? 'Cerca ricette online o incolla un URL. L\'IA estrarrà automaticamente gli ingredienti e le istruzioni.'
                : 'Search recipes online or paste a URL. AI will automatically extract ingredients and instructions.'
        },
        {
            icon: <Sparkles size={48} />,
            title: language === 'it' ? 'Suggerimenti IA' : 'AI Suggestions',
            description: language === 'it'
                ? 'Descrivi cosa vuoi cucinare e l\'IA creerà una ricetta personalizzata basata sulle tue preferenze.'
                : 'Describe what you want to cook and AI will create a custom recipe based on your preferences.'
        }
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete(showAgain);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleSkip = () => {
        onComplete(showAgain);
    };

    return (
        <div className="tour-overlay">
            <div className="tour-modal">
                <button className="tour-close" onClick={handleSkip}>
                    <X size={20} />
                </button>

                <div className="tour-content">
                    <div className="tour-icon">
                        {slides[currentSlide].icon}
                    </div>
                    <h2 className="tour-title">{slides[currentSlide].title}</h2>
                    <p className="tour-description">{slides[currentSlide].description}</p>
                </div>

                <div className="tour-dots">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            className={`tour-dot ${idx === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(idx)}
                        />
                    ))}
                </div>

                <div className="tour-footer">
                    <label className="tour-checkbox">
                        <input
                            type="checkbox"
                            checked={showAgain}
                            onChange={(e) => setShowAgain(e.target.checked)}
                        />
                        <span>
                            {language === 'it' ? 'Mostra di nuovo all\'avvio' : 'Show again on startup'}
                        </span>
                    </label>

                    <div className="tour-buttons">
                        {currentSlide > 0 && (
                            <button className="tour-btn tour-btn-secondary" onClick={handlePrev}>
                                <ArrowLeft size={16} />
                                {language === 'it' ? 'Indietro' : 'Back'}
                            </button>
                        )}
                        <button className="tour-btn tour-btn-primary" onClick={handleNext}>
                            {currentSlide < slides.length - 1 ? (
                                <>
                                    {language === 'it' ? 'Avanti' : 'Next'}
                                    <ArrowRight size={16} />
                                </>
                            ) : (
                                language === 'it' ? 'Inizia!' : 'Get Started!'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

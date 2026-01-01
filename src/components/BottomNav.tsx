import {
    Home,
    BookOpen,
    Sparkles,
    Settings,
    ShoppingCart,
    Refrigerator
} from 'lucide-react';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import './BottomNav.css';

type ViewType = 'home' | 'recipes' | 'ai-suggest' | 'settings' | 'shopping' | 'fridge';

interface BottomNavProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    language: Language;
}

export function BottomNav({
    currentView,
    onViewChange,
    language
}: BottomNavProps) {
    const t = getTranslation(language);

    const navItems = [
        { id: 'home' as ViewType, icon: Home, label: t.nav.home },
        { id: 'recipes' as ViewType, icon: BookOpen, label: t.nav.recipes },
        { id: 'fridge' as ViewType, icon: Refrigerator, label: t.nav?.fridge || "Fridge" },
        { id: 'ai-suggest' as ViewType, icon: Sparkles, label: "AI" },
        { id: 'shopping' as ViewType, icon: ShoppingCart, label: t.nav?.shopping || 'Shop' },
        { id: 'settings' as ViewType, icon: Settings, label: t.nav.settings },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`bottom-nav-item ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => onViewChange(item.id)}
                >
                    <item.icon size={24} />
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}

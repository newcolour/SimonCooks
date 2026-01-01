

import { X, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import type { Recipe } from '../types';
import './ValidationConfirmModal.css';

interface ValidationConfirmModalProps {
    original: Recipe;
    suggested: Recipe;
    onConfirm: () => void;
    onCancel: () => void;
    language: string;
}

export function ValidationConfirmModal({ original, suggested, onConfirm, onCancel, language }: ValidationConfirmModalProps) {
    const t = {
        title: language === 'it' ? 'Verifica Porzioni' : 'Review Portion Updates',
        original: language === 'it' ? 'Originale' : 'Original',
        suggested: language === 'it' ? 'Suggerito' : 'Suggested',
        servings: language === 'it' ? 'Porzioni' : 'Servings',
        ingredients: language === 'it' ? 'Ingredienti' : 'Ingredients',
        confirm: language === 'it' ? 'Applica Modifiche' : 'Apply Changes',
        cancel: language === 'it' ? 'Annulla' : 'Cancel',
        noChanges: language === 'it' ? 'Nessuna modifica necessaria.' : 'No changes needed.',
        changeDetected: language === 'it' ? 'Rilevate modifiche alle porzioni.' : 'Portion adjustments detected.'
    };

    const hasServingsChange = original.servings !== suggested.servings;
    // Simple ingredients comparison (length or content)
    // We can do a detailed check, but for now just showing them side-by-side matches the requirement.

    return (
        <div className="validation-modal-overlay">
            <div className="validation-modal">
                <div className="validation-modal-header">
                    <h2>{t.title}</h2>
                    <button className="close-btn" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="validation-modal-content">
                    <div className="validation-comparison">
                        {/* Original */}
                        <div className="comparison-column original">
                            <h3>{t.original}</h3>
                            <div className="metric-box">
                                <span className="label">{t.servings}:</span>
                                <span className="value">{original.servings}</span>
                            </div>
                            <ul className="ingredient-list">
                                {original.ingredients.map((ing, i) => (
                                    <li key={i}>
                                        <span className="amount">{ing.amount} {ing.unit}</span> {ing.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Arrow */}
                        <div className="comparison-arrow">
                            <ArrowRight size={24} />
                        </div>

                        {/* Suggested */}
                        <div className="comparison-column suggested">
                            <h3>{t.suggested}</h3>
                            <div className={`metric-box ${hasServingsChange ? 'changed' : ''}`}>
                                <span className="label">{t.servings}:</span>
                                <span className="value">{suggested.servings}</span>
                            </div>
                            <ul className="ingredient-list">
                                {suggested.ingredients.map((ing, i) => {
                                    // Check if changed? Hard to correlate 1-to-1 without IDs, but index usually matches for AI fix
                                    const orig = original.ingredients[i];
                                    const isChanged = !orig || orig.amount !== ing.amount || orig.unit !== ing.unit;

                                    return (
                                        <li key={i} className={isChanged ? 'changed-item' : ''}>
                                            <span className="amount">{ing.amount} {ing.unit}</span> {ing.name}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    <div className="validation-summary">
                        <AlertTriangle size={16} />
                        <span>{t.changeDetected}</span>
                    </div>
                </div>

                <div className="validation-modal-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        {t.cancel}
                    </button>
                    <button className="btn-primary" onClick={onConfirm}>
                        <Check size={18} />
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}

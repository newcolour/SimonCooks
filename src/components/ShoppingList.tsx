import { useState, useEffect, useCallback } from 'react';
import type { ShoppingItem, AISettings } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import { mergeShoppingList, simpleShoppingMerge } from '../services/aiService';
import {
    ShoppingCart,
    Check,
    Trash2,
    Plus,
    X,
    Loader,
    CheckCircle,
    Sparkles
} from 'lucide-react';
import './ShoppingList.css';

interface ShoppingListProps {
    aiSettings: AISettings;
    language: Language;
}

export function ShoppingList({ aiSettings, language }: ShoppingListProps) {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');
    const [adding, setAdding] = useState(false);
    const t = getTranslation(language);

    const loadItems = useCallback(async () => {
        if (window.electronAPI?.shoppingList) {
            const data = await window.electronAPI.shoppingList.getAll();
            setItems(data);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleToggleChecked = async (item: ShoppingItem) => {
        const updated = { ...item, checked: !item.checked };
        await window.electronAPI.shoppingList.updateItem(updated);
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    };

    const handleDeleteItem = async (id: string) => {
        await window.electronAPI.shoppingList.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleClearChecked = async () => {
        await window.electronAPI.shoppingList.clearChecked();
        setItems(prev => prev.filter(i => !i.checked));
    };

    const handleClearAll = async () => {
        if (window.confirm(t.shopping?.clearAllConfirm || 'Clear entire shopping list?')) {
            await window.electronAPI.shoppingList.clearAll();
            setItems([]);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;

        setAdding(true);
        try {
            const hasAI = aiSettings.apiKey || aiSettings.provider === 'ollama';

            if (hasAI && items.length > 0) {
                // Use AI to merge
                const newIngredients = [{ name: newItemName, amount: newItemAmount, unit: newItemUnit }];
                try {
                    const merged = await mergeShoppingList(aiSettings, items, newIngredients);
                    const newItems: ShoppingItem[] = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                    await window.electronAPI.shoppingList.replaceAll(newItems);
                    setItems(newItems);
                } catch {
                    // Fallback to simple merge
                    const merged = simpleShoppingMerge(items, newIngredients);
                    const newItems: ShoppingItem[] = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                    await window.electronAPI.shoppingList.replaceAll(newItems);
                    setItems(newItems);
                }
            } else {
                // Simple add
                const newItem: ShoppingItem = {
                    id: crypto.randomUUID(),
                    name: newItemName,
                    amount: newItemAmount,
                    unit: newItemUnit,
                    checked: false
                };
                await window.electronAPI.shoppingList.addItem(newItem);
                setItems(prev => [newItem, ...prev]);
            }

            setNewItemName('');
            setNewItemAmount('');
            setNewItemUnit('');
        } finally {
            setAdding(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddItem();
        }
    };

    const checkedCount = items.filter(i => i.checked).length;
    const totalCount = items.length;

    if (loading) {
        return (
            <div className="shopping-list">
                <div className="shopping-loading">
                    <Loader size={32} className="animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="shopping-list">
            <div className="shopping-header">
                <div className="shopping-title">
                    <ShoppingCart size={28} />
                    <h1>{t.shopping?.title || 'Shopping List'}</h1>
                </div>
                <p className="shopping-subtitle">
                    {t.shopping?.subtitle || 'Your smart, AI-powered shopping list'}
                </p>
            </div>

            <div className="shopping-content">
                {/* Add New Item */}
                <div className="add-item-section">
                    <div className="add-item-row">
                        <input
                            type="text"
                            value={newItemAmount}
                            onChange={(e) => setNewItemAmount(e.target.value)}
                            placeholder={t.recipe?.amount || 'Qty'}
                            className="amount-input"
                        />
                        <input
                            type="text"
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value)}
                            placeholder={t.recipe?.unit || 'Unit'}
                            className="unit-input"
                        />
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.shopping?.addPlaceholder || 'Add item...'}
                            className="name-input"
                        />
                        <button
                            onClick={handleAddItem}
                            disabled={adding || !newItemName.trim()}
                            className="add-btn"
                        >
                            {adding ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
                        </button>
                    </div>
                    {(aiSettings.apiKey || aiSettings.provider === 'ollama') && (
                        <div className="ai-hint">
                            <Sparkles size={12} />
                            <span>{t.shopping?.aiMergeHint || 'AI will merge duplicates automatically'}</span>
                        </div>
                    )}
                </div>

                {/* Progress */}
                {totalCount > 0 && (
                    <div className="shopping-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                            />
                        </div>
                        <span className="progress-text">
                            {checkedCount}/{totalCount} {t.shopping?.itemsChecked || 'checked'}
                        </span>
                    </div>
                )}

                {/* Items List */}
                {items.length === 0 ? (
                    <div className="empty-list">
                        <ShoppingCart size={48} />
                        <p>{t.shopping?.emptyList || 'Your shopping list is empty'}</p>
                        <span>{t.shopping?.emptyListHint || 'Add items above or from any recipe'}</span>
                    </div>
                ) : (
                    <>
                        {/* Active Items */}
                        <ul className="shopping-items active-items">
                            {items.filter(i => !i.checked).map(item => (
                                <li key={item.id} className="shopping-item">
                                    <button
                                        className="check-btn"
                                        onClick={() => handleToggleChecked(item)}
                                    >
                                        <div className="unchecked-circle" />
                                    </button>
                                    <div className="item-content">
                                        <span className="item-amount">
                                            {item.amount}{item.unit ? ` ${item.unit}` : ''}
                                        </span>
                                        <span className="item-name">{item.name}</span>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteItem(item.id)}
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Completed Items */}
                        {items.some(i => i.checked) && (
                            <div className="completed-section">
                                <h3 className="completed-title">
                                    {t.shopping?.completed || 'Completed'}
                                </h3>
                                <ul className="shopping-items completed-items">
                                    {items.filter(i => i.checked).map(item => (
                                        <li key={item.id} className="shopping-item checked">
                                            <button
                                                className="check-btn"
                                                onClick={() => handleToggleChecked(item)}
                                            >
                                                <CheckCircle size={22} />
                                            </button>
                                            <div className="item-content">
                                                <span className="item-amount">
                                                    {item.amount}{item.unit ? ` ${item.unit}` : ''}
                                                </span>
                                                <span className="item-name">{item.name}</span>
                                            </div>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteItem(item.id)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {/* Actions */}
                {items.length > 0 && (
                    <div className="shopping-actions">
                        {checkedCount > 0 && (
                            <button className="clear-checked-btn" onClick={handleClearChecked}>
                                <Check size={16} />
                                {t.shopping?.clearChecked || 'Clear Checked'}
                            </button>
                        )}
                        <button className="clear-all-btn" onClick={handleClearAll}>
                            <Trash2 size={16} />
                            {t.shopping?.clearAll || 'Clear All'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

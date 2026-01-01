import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
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
import { get, set } from 'idb-keyval';

// ... imports

const SHOPPING_STORAGE_KEY = 'simoncooks_shopping';

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
        try {
            if (window.electronAPI?.shoppingList) {
                const data = await window.electronAPI.shoppingList.getAll();
                setItems(data);
            } else {
                // Mobile/Web Fallback
                const stored = await get<ShoppingItem[]>(SHOPPING_STORAGE_KEY);
                if (stored) setItems(stored);
            }
        } catch (error) {
            console.error('Failed to load shopping list:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const saveToStorage = async (newItems: ShoppingItem[]) => {
        if (!window.electronAPI?.shoppingList) {
            await set(SHOPPING_STORAGE_KEY, newItems);
        }
    };

    const handleToggleChecked = async (item: ShoppingItem) => {
        const updated = { ...item, checked: !item.checked };

        if (window.electronAPI?.shoppingList) {
            await window.electronAPI.shoppingList.updateItem(updated);
        }

        const newItems = items.map(i => i.id === item.id ? updated : i);
        setItems(newItems);
        await saveToStorage(newItems);
    };

    const handleDeleteItem = async (id: string) => {
        if (window.electronAPI?.shoppingList) {
            await window.electronAPI.shoppingList.deleteItem(id);
        }

        const newItems = items.filter(i => i.id !== id);
        setItems(newItems);
        await saveToStorage(newItems);
    };

    const handleClearChecked = async () => {
        if (window.electronAPI?.shoppingList) {
            await window.electronAPI.shoppingList.clearChecked();
        }

        const newItems = items.filter(i => !i.checked);
        setItems(newItems);
        await saveToStorage(newItems);
    };

    const handleClearAll = async () => {
        if (window.confirm(t.shopping?.clearAllConfirm || 'Clear entire shopping list?')) {
            if (window.electronAPI?.shoppingList) {
                await window.electronAPI.shoppingList.clearAll();
            }

            setItems([]);
            await saveToStorage([]);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;

        setAdding(true);
        try {
            const hasAI = aiSettings.apiKey || aiSettings.provider === 'ollama';
            let newItemsList: ShoppingItem[] = [];

            if (hasAI && items.length > 0) {
                // Use AI to merge
                const newIngredients = [{ name: newItemName, amount: newItemAmount, unit: newItemUnit }];
                try {
                    const merged = await mergeShoppingList(aiSettings, items, newIngredients);
                    newItemsList = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                } catch {
                    // Fallback to simple merge
                    const merged = simpleShoppingMerge(items, newIngredients);
                    newItemsList = merged.map(m => ({
                        id: crypto.randomUUID(),
                        name: m.name,
                        amount: m.amount,
                        unit: m.unit,
                        checked: m.checked
                    }));
                }

                if (window.electronAPI?.shoppingList) {
                    await window.electronAPI.shoppingList.replaceAll(newItemsList);
                }
                setItems(newItemsList);
                await saveToStorage(newItemsList);
            } else {
                // Simple add
                const newItem: ShoppingItem = {
                    id: crypto.randomUUID(),
                    name: newItemName,
                    amount: newItemAmount,
                    unit: newItemUnit,
                    checked: false
                };

                if (window.electronAPI?.shoppingList) {
                    await window.electronAPI.shoppingList.addItem(newItem);
                }

                newItemsList = [newItem, ...items];
                setItems(newItemsList);
                await saveToStorage(newItemsList);
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



    const isMobile = Capacitor.isNativePlatform();

    return (
        <div className={`shopping-list ${isMobile ? 'mobile' : ''}`}>
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
                    <div
                        className="add-item-row"
                        style={isMobile ? { display: 'flex', flexWrap: 'nowrap', gap: '6px', alignItems: 'center' } : undefined}
                    >
                        <input
                            type="text"
                            value={newItemAmount}
                            onChange={(e) => setNewItemAmount(e.target.value)}
                            placeholder={t.recipe?.amount || 'Qty'}
                            className="amount-input"
                            style={isMobile ? { width: '50px', minWidth: '50px', flexShrink: 0, padding: '0.6rem 0.4rem', border: '1px solid rgba(255,255,255,0.2)' } : undefined}
                        />
                        <input
                            type="text"
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value)}
                            placeholder={t.recipe?.unit || 'Unit'}
                            className="unit-input"
                            style={isMobile ? { width: '60px', minWidth: '60px', flexShrink: 0, padding: '0.6rem 0.4rem', border: '1px solid rgba(255,255,255,0.2)' } : undefined}
                        />
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.shopping?.addPlaceholder || 'Item'}
                            className="name-input"
                            style={isMobile ? { flex: 1, minWidth: '60px', padding: '0.6rem 0.4rem', border: '1px solid rgba(255,255,255,0.2)' } : undefined}
                        />
                        <button
                            onClick={handleAddItem}
                            disabled={adding || !newItemName.trim()}
                            className="add-btn"
                            style={isMobile ? { width: '38px', height: '38px', minWidth: '38px', flexShrink: 0 } : undefined}
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
                    <div
                        className="shopping-progress"
                        style={isMobile ? {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: '6px',
                            width: '100%'
                        } : undefined}
                    >
                        {isMobile ? (
                            <>
                                <span
                                    className="progress-text"
                                    style={{ fontSize: '0.85rem', textAlign: 'left' }}
                                >
                                    {checkedCount}/{totalCount} {t.shopping?.itemsChecked || 'checked'}
                                </span>
                                <div className="progress-bar" style={{ width: '100%' }}>
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {checkedCount}/{totalCount} {t.shopping?.itemsChecked || 'checked'}
                                </span>
                            </>
                        )}
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

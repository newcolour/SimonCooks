import { useState } from 'react';
import type { Recipe, Ingredient } from '../types';
import type { Language } from '../i18n';
import { getTranslation } from '../i18n';
import {
    X,
    Plus,
    Trash2,
    Save,
    Clock,
    Users,
    Utensils,
    Martini,
    Snowflake,
    Wrench,
    Wine
} from 'lucide-react';
import './RecipeEditor.css';

interface RecipeEditorProps {
    recipe?: Recipe;
    onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> | Recipe) => void;
    onCancel: () => void;
    language: Language;
}

const COMMON_CATEGORIES = [
    'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack',
    'Italian', 'Mexican', 'Asian', 'Indian', 'French',
    'American', 'Mediterranean', 'Vegetarian', 'Vegan', 'Gluten-Free'
];

const COMMON_DRINK_CATEGORIES = [
    'Cocktail', 'Mocktail', 'Smoothie', 'Shake', 'Coffee', 'Tea',
    'Party', 'Aperitif', 'Digestif', 'Hot Drink', 'Cold Drink'
];

const COMMON_ALLERGENS = [
    'Dairy', 'Eggs', 'Gluten', 'Nuts', 'Peanuts',
    'Shellfish', 'Soy', 'Fish', 'Sesame', 'Sulfites'
];

export function RecipeEditor({ recipe, onSave, onCancel, language }: RecipeEditorProps) {
    const [type, setType] = useState<'food' | 'drink'>(recipe?.type || 'food');
    const [title, setTitle] = useState(recipe?.title || '');
    const [description, setDescription] = useState(recipe?.description || '');
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        recipe?.ingredients || [{ name: '', amount: '', unit: '' }]
    );
    const [instructions, setInstructions] = useState(recipe?.instructions || '');
    const [cookingTime, setCookingTime] = useState(recipe?.cookingTime?.toString() || '');
    const [servings, setServings] = useState(recipe?.servings?.toString() || '');
    const [notes, setNotes] = useState(recipe?.notes || '');
    const [categories, setCategories] = useState<string[]>(recipe?.categories || []);
    const [allergens, setAllergens] = useState<string[]>(recipe?.allergens || []);
    const [imageUrl, setImageUrl] = useState(recipe?.imageUrl || '');

    // Drink specific state
    const [glassware, setGlassware] = useState(recipe?.type === 'drink' ? recipe.glassware : '');
    const [ice, setIce] = useState(recipe?.type === 'drink' ? recipe.ice : 'Nessuno');
    const [tools, setTools] = useState(recipe?.type === 'drink' ? recipe.tools.join(', ') : '');
    const [isAlcoholic, setIsAlcoholic] = useState(recipe?.type === 'drink' ? recipe.isAlcoholic : true);

    const t = getTranslation(language);
    const isEditing = !!recipe;

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const updated = [...ingredients];
        updated[index] = { ...updated[index], [field]: value };
        setIngredients(updated);
    };

    const toggleCategory = (cat: string) => {
        setCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const toggleAllergen = (allergen: string) => {
        setAllergens(prev =>
            prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const baseData = {
            title,
            description,
            ingredients: ingredients.filter(i => i.name.trim()),
            instructions,
            notes,
            categories,
            allergens,
            imageUrl,
            aiGenerated: recipe?.aiGenerated || false,
        };

        let recipeData: any;

        if (type === 'drink') {
            recipeData = {
                ...baseData,
                type: 'drink',
                glassware,
                ice,
                tools: tools.split(',').map(s => s.trim()).filter(Boolean),
                isAlcoholic,
                cookingTime: cookingTime ? parseInt(cookingTime) : undefined, // Mapped to prep time
                servings: servings ? parseInt(servings) : undefined,
            };
        } else {
            recipeData = {
                ...baseData,
                type: 'food',
                cookingTime: cookingTime ? parseInt(cookingTime) : undefined,
                servings: servings ? parseInt(servings) : undefined,
                nutrition: recipe?.type === 'food' ? recipe.nutrition : undefined, // Preserve nutrition if existing
            };
        }

        if (isEditing && recipe) {
            onSave({ ...recipe, ...recipeData });
        } else {
            onSave(recipeData);
        }
    };

    return (
        <div className="recipe-editor">
            <div className="recipe-editor-header">
                <h2>{isEditing ? t.recipe.edit : t.nav.newRecipe}</h2>
                <div className="type-toggle">
                    <button
                        type="button"
                        className={`type-btn ${type === 'food' ? 'active' : ''}`}
                        onClick={() => setType('food')}
                    >
                        <Utensils size={16} /> {t.recipe.food}
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${type === 'drink' ? 'active' : ''}`}
                        onClick={() => setType('drink')}
                    >
                        <Martini size={16} /> {t.recipe.drink}
                    </button>
                </div>
                <button className="close-btn" onClick={onCancel}>
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="recipe-editor-form">
                <div className="form-section">
                    <label className="form-label">{t.recipe.title} *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.recipe.title}
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">{t.recipe.description}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.recipe.description}
                        rows={2}
                        className="form-textarea"
                    />
                </div>

                {type === 'drink' && (
                    <div className="form-row">
                        <div className="form-section">
                            <label className="form-label">
                                <Martini size={16} />
                                {t.recipe.glassware}
                            </label>
                            <input
                                type="text"
                                value={glassware}
                                onChange={(e) => setGlassware(e.target.value)}
                                placeholder="e.g. Coupe, Highball"
                                className="form-input"
                            />
                        </div>
                        <div className="form-section">
                            <label className="form-label">
                                <Snowflake size={16} />
                                {t.recipe.ice}
                            </label>
                            <select
                                value={ice}
                                onChange={(e) => setIce(e.target.value)}
                                className="form-select"
                            >
                                <option value="Nessuno">{t.recipe.noIce}</option>
                                <option value="Cubetti">{t.recipe.cubes}</option>
                                <option value="Tritato">{t.recipe.crushed}</option>
                                <option value="Sfera">{t.recipe.sphere}</option>
                            </select>
                        </div>
                    </div>
                )}

                {type === 'drink' && (
                    <div className="form-section">
                        <div className="checkbox-wrapper">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isAlcoholic}
                                    onChange={(e) => setIsAlcoholic(e.target.checked)}
                                />
                                <span className="label-text">
                                    <Wine size={16} />
                                    {t.recipe.isAlcoholic}
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-section">
                        <label className="form-label">
                            <Clock size={16} />
                            {type === 'food' ? t.recipe.cookingTime : t.recipe.prepTime} (min)
                        </label>
                        <input
                            type="number"
                            value={cookingTime}
                            onChange={(e) => setCookingTime(e.target.value)}
                            placeholder="5"
                            min="1"
                            className="form-input"
                        />
                    </div>
                    <div className="form-section">
                        <label className="form-label">
                            <Users size={16} />
                            {t.recipe.servings}
                        </label>
                        <input
                            type="number"
                            value={servings}
                            onChange={(e) => setServings(e.target.value)}
                            placeholder={type === 'drink' ? '1' : '4'}
                            min="1"
                            className="form-input"
                        />
                    </div>
                </div>

                {type === 'drink' && (
                    <div className="form-section">
                        <label className="form-label">
                            <Wrench size={16} />
                            {t.recipe.tools}
                        </label>
                        <input
                            type="text"
                            value={tools}
                            onChange={(e) => setTools(e.target.value)}
                            placeholder="Shaker, Strainer, Jigger..."
                            className="form-input"
                        />
                    </div>
                )}

                <div className="form-section">
                    <label className="form-label">{t.recipe.ingredients} *</label>
                    <div className="ingredients-editor">
                        {ingredients.map((ing, idx) => (
                            <div key={idx} className="ingredient-row">
                                <input
                                    type="text"
                                    value={ing.amount}
                                    onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                                    placeholder={t.recipe.amount}
                                    className="form-input amount"
                                />
                                <input
                                    type="text"
                                    value={ing.unit}
                                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                    placeholder={t.recipe.unit}
                                    className="form-input unit"
                                />
                                <input
                                    type="text"
                                    value={ing.name}
                                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                                    placeholder={t.recipe.ingredientName}
                                    className="form-input name"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(idx)}
                                    className="remove-btn"
                                    disabled={ingredients.length === 1}
                                    title={t.recipe.delete}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddIngredient} className="add-btn">
                            <Plus size={16} />
                            {t.recipe.addIngredient}
                        </button>
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">{t.recipe.instructions} *</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder={t.recipe.instructions}
                        rows={6}
                        required
                        className="form-textarea"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">{t.recipe.categories}</label>
                    <div className="tags-selector">
                        {(type === 'food' ? COMMON_CATEGORIES : COMMON_DRINK_CATEGORIES).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className={`tag-btn ${categories.includes(cat) ? 'selected' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">{t.recipe.allergens}</label>
                    <div className="tags-selector allergens">
                        {COMMON_ALLERGENS.map(allergen => (
                            <button
                                key={allergen}
                                type="button"
                                onClick={() => toggleAllergen(allergen)}
                                className={`tag-btn ${allergens.includes(allergen) ? 'selected' : ''}`}
                            >
                                {allergen}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">{t.recipe.notes}</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.recipe.notes}
                        rows={3}
                        className="form-textarea"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">Image URL</label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="form-input"
                    />
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        {t.recipe.cancel}
                    </button>
                    <button type="submit" className="btn-primary">
                        <Save size={18} />
                        {t.recipe.save}
                    </button>
                </div>
            </form>
        </div>
    );
}

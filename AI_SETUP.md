# AI Features Setup Guide

SimonCooks offers powerful AI integrations to enhance your cooking experience. This guide covers how to set up the various AI Services for features like Recipe Generation, Image Generation (`Gemini`, `Cloudflare`), and Drink Remixing (`OpenAI`, `Anthropic`, `Ollama`).

## Supported AI Providers

The application currently supports the following providers:
1.  **Google Gemini** (Recommended for general use)
2.  **OpenAI**
3.  **Anthropic**
4.  **Ollama** (Local LLM)
5.  **Cloudflare Workers AI** (Specifically for Image Generation)

## How to Configure

1.  Open the **SimonCooks** application.
2.  Navigate to the **Settings** page (Gear icon in the sidebar).
3.  Scroll down to the **AI Settings** section.

### 1. Google Gemini
*   **Best for:** General recipe suggestions, ingredient analysis.
*   **Get Key:** [Google AI Studio](https://aistudio.google.com/app/apikey)
*   **Setup:**
    *   Select **Google Gemini** as the AI Provider.
    *   Paste your API Key in the field.
    *   (Optional) Use a custom model ID (default is `gemini-pro` or similar).

### 2. OpenAI (ChatGPT)
*   **Best for:** High-quality text generation, creative remixing.
*   **Get Key:** [OpenAI Platform](https://platform.openai.com/api-keys)
*   **Setup:**
    *   Select **OpenAI**.
    *   Paste your API Key (starts with `sk-...`).

### 3. Anthropic (Claude)
*   **Best for:** Nuanced instructions, natural language understanding.
*   **Get Key:** [Anthropic Console](https://console.anthropic.com/)
*   **Setup:**
    *   Select **Anthropic**.
    *   Paste your API Key.

### 4. Ollama (Local AI)
*   **Best for:** Privacy-focused, offline-capable generation (requires running Ollama locally).
*   **Get Key:** None required (Local URL).
*   **Setup:**
    *   Ensure Ollama is running (`ollama serve`).
    *   Select **Ollama**.
    *   Enter the model name you have pulled (e.g., `llama3`, `mistral`).
    *   Enter the URL (default: `http://localhost:11434`).

### 5. Cloudflare Workers AI (Image Generation)
*   **Best for:** Generating beautiful recipe images.
*   **Get Key:** [Cloudflare Dashboard](https://dash.cloudflare.com/) > AI > Workers AI.
*   **Setup:**
    *   You need your **Account ID** (found in the URL of your dashboard or sidebar).
    *   You need an **API Token** with Workers AI permission.
    *   **Model:** Uses `@cf/black-forest-labs/flux-1-schnell` by default for high-quality images.

## Features Enabled by AI
*   **Recipe Suggestions:** Generate recipes from a list of ingredients.
*   **Drink Remix:** Create variations of cocktails (e.g., "Make it spicy", "Virgin version").
*   **Visual Stylist:** Generate professional food photography for your recipes.
*   **Translation:** Translate recipes into different languages instantly.

## Troubleshooting
*   **"Failed to fetch"**: Check your internet connection or proxy settings.
*   **"Invalid Key"**: Double-check the key for whitespace or missing characters.
*   **"Model not found"**: Ensure the model name usually matches the provider's official ID (e.g., `gpt-4o`, `claude-3-5-sonnet-20240620`).

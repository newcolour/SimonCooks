# Image Generation Implementation

This document details the implementation of image generation providers in `src/services/aiService.ts`.

## 1. Google Gemini / Imagen

**Target Model:** `gemini-2.0-flash-exp`

### Integration Details

The application uses the Google Generative Language API.

**Key Features:**
*   **Safety Settings:** Explicitly set to `BLOCK_ONLY_HIGH` for all categories to prevent false positives on food textures.
*   **Error Handling:** Checks `finishReason` to strictly identify refusals.

```typescript
} else if (provider === 'gemini') {
    // ... logic for basic auth and safety settings
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        // ...
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            // ...
        ]
    });
}
```

## 2. Cloudflare Workers AI (Flux)

**Target Model:** `@cf/black-forest-labs/flux-1-schnell`

This provider offers a high-performance, cost-effective (often free tier compatible) alternative using the Flux Direct Diffusion model.

### Integration Details

The application calls the Cloudflare Workers AI REST API.

**Key Features:**
*   **Authentication:** Requires `Account ID` and `API Token`.
*   **Model:** `flux-1-schnell` (Fastest variant).
*   **Params:** `num_steps: 4` (Optimized for Schnell).

```typescript
} else if (provider === 'cloudflare') {
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`,
        {
            headers: { Authorization: `Bearer ${apiToken}` },
            body: JSON.stringify({ prompt: imagePrompt, num_steps: 4 })
        }
    );
    // Returns base64 image directly in result.image property
}
```

### Setup Instructions for Cloudflare

To enable Cloudflare image generation:

1.  **Get Cloudflare Account ID**:
    *   Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
    *   Copy the **Account ID** from the URL (e.g., `dash.cloudflare.com/<ACCOUNT_ID>`) or the Overview sidebar.

2.  **Create API Token**:
    *   Go to **[My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)**.
    *   Click **Create Token**.
    *   Select **Custom Token** (Get started).
    *   **Permissions**:
        *   Account > **Workers AI** > **Read**
    *   **Account Resources**: Select **All accounts** or your specific account.
    *   Click **Continue to Summary** > **Create Token**.

3.  **Configure SimonCooks**:
    *   Open **Settings** in the app.
    *   Select **Cloudflare Workers AI** under Image Generation.
    *   Paste your **Account ID** and **API Token**.

## 3. OpenAI DALL-E

**Target Models:** `dall-e-3` (Best Quality), `dall-e-2` (Faster/Cheaper)

### Integration Details

The application uses the OpenAI Images API.

**Key Features:**
*   **High Quality:** DALL-E 3 provides exceptional quality and prompt understanding.
*   **Model Selection:** Choose between DALL-E 3 for quality or DALL-E 2 for speed/cost.
*   **Standard Sizes:** 1024x1024 image generation.

```typescript
} else if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        headers: { Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: modelId,
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024'
        })
    });
    // Returns URL to generated image
}
```

### Setup Instructions for OpenAI

1.  **Get API Key**:
    *   Go to [OpenAI API Keys](https://platform.openai.com/api-keys).
    *   Create a new API key.
    *   **Important:** You'll need credits in your OpenAI account.

2.  **Configure SimonCooks**:
    *   Open **Settings** in the app.
    *   Select **DALL-E (OpenAI)** under Image Generation.
    *   Paste your **API Key**.
    *   Choose your preferred model (DALL-E 3 or DALL-E 2).

## 4. Pollinations.ai

**Target Models:** `flux` (Best Quality), `turbo` (Faster)

### Integration Details

The application uses the Pollinations.ai API, which now requires an API key.

**Key Features:**
*   **Free Tier:** Often includes generous free usage.
*   **Multiple Models:** Access to Flux and Turbo models.
*   **Fast Generation:** Optimized for speed.

```typescript
} else if (provider === 'pollinations') {
    const encoded = encodeURIComponent(imagePrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://gen.pollinations.ai/image/${encoded}?width=1024&height=1024&seed=${seed}&model=${modelId}&nologo=true&key=${apiKey}`;
    // Fetches and converts to base64
}
```

### Setup Instructions for Pollinations

1.  **Get API Key**:
    *   Visit [Pollinations.ai](https://pollinations.ai).
    *   Sign up and obtain your API key.

2.  **Configure SimonCooks**:
    *   Open **Settings** in the app.
    *   Select **Pollinations.ai** under Image Generation.
    *   Paste your **API Key**.

## 5. Stability AI

**Target Models:** 
*   `stable-diffusion-xl-1024-v1-0` (SDXL 1.0)
*   `stable-diffusion-v1-6` (SD 1.6)
*   `stable-image-ultra` (Ultra Quality)
*   `stable-image-core` (Core)

### Integration Details

The application uses the Stability AI Generation API.

**Key Features:**
*   **Professional Quality:** Industry-leading image generation.
*   **Multiple Model Options:** Choose from various Stable Diffusion versions.
*   **Fine-Tuned Control:** Advanced parameters for precise control.

```typescript
} else if (provider === 'stability') {
    const response = await fetch(`https://api.stability.ai/v1/generation/${modelId}/text-to-image`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            text_prompts: [{ text: imagePrompt, weight: 1 }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30
        })
    });
    // Returns base64 image
}
```

### Setup Instructions for Stability AI

1.  **Get API Key**:
    *   Go to [Stability AI Platform](https://platform.stability.ai).
    *   Create an account and generate an API key.
    *   **Note:** Requires paid credits.

2.  **Configure SimonCooks**:
    *   Open **Settings** in the app.
    *   Select **Stability AI** under Image Generation.
    *   Paste your **API Key**.
    *   Choose your preferred model.

---

## Testing Image Generation

### How to Test

1.  **Configure a Provider**: Follow the setup instructions above for your chosen provider.
2.  **Create or Open a Recipe**: Navigate to any recipe in SimonCooks.
3.  **Generate Image**: 
    *   Click the **"Generate Image"** or **"Regenerate Image"** button.
    *   The AI will analyze the recipe and create a professional food photo.
4.  **Compare Results** (Optional): The app supports a "Side-by-Side" comparison modal when enabled.

### Expected Results

*   **Generation Time:** 5-15 seconds depending on the provider.
*   **Image Quality:** High-resolution 1024x1024 images.
*   **Safety Handling:** Gemini uses relaxed safety settings to prevent false positives on food textures.
*   **Error Handling:** Clear error messages with 60-second timeout protection.

### Troubleshooting

*   **"API key required" error**: Verify you've entered the correct credentials in Settings.
*   **"Timed Out (60s)" error**: The provider may be overloaded; try again later.
*   **"Gemini Refused Generation"**: Check the safety threshold or try rephrasing the recipe.
*   **"Cloudflare Error 401"**: Verify your Account ID and API Token are correct.

---

## Usage in the App

The image generation feature is integrated into the recipe workflow:

1.  **Automatic Prompting**: SimonCooks uses a two-stage AI process:
    *   **Visual Stylist:** Analyzes the recipe and creates structured visual attributes.
    *   **Photographer:** Constructs the final prompt with photography tokens.

2.  **User Controls**:
    *   Generate/Regenerate buttons in the recipe detail view.
    *   Provider and model selection in Settings.
    *   Fallback mechanism if the primary provider fails.

3.  **Image Storage**:
    *   Generated images are saved as base64 data URLs.
    *   Can be regenerated at any time with different providers.

---

## Provider Comparison

| Provider | Speed | Quality | Cost | Best For |
|----------|-------|---------|------|----------|
| **Cloudflare Flux** | ⚡⚡⚡ Very Fast | ⭐⭐⭐ Good | 💰 Free Tier | Quick iterations, budget projects |
| **Gemini/Imagen** | ⚡⚡ Fast | ⭐⭐⭐⭐ Excellent | 💰💰 Moderate | Detailed food photography |
| **DALL-E 3** | ⚡ Medium | ⭐⭐⭐⭐⭐ Best | 💰💰💰 Higher | Professional results |
| **Pollinations.ai** | ⚡⚡⚡ Very Fast | ⭐⭐⭐ Good | 💰 Free Tier | Experimentation |
| **Stability AI** | ⚡⚡ Fast | ⭐⭐⭐⭐ Excellent | 💰💰 Moderate | Custom model selection |

---

## Recommendations

*   **For Development/Testing**: Start with **Pollinations.ai** or **Cloudflare Flux** (free tiers).
*   **For Production**: Use **DALL-E 3** or **Gemini Imagen** for consistent, high-quality results.
*   **For Customization**: **Stability AI** offers the most control over generation parameters.
*   **For Speed**: **Cloudflare Flux-1 Schnell** is optimized for ultra-fast generation (4 steps).

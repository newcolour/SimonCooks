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

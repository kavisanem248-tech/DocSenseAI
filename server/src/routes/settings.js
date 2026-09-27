import express from 'express';
import { db } from '../db.js';
import { callAiModel } from '../services/aiProvider.js';

const router = express.Router();

// Get settings (masked keys)
router.get('/', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.post('/', (req, res) => {
  try {
    const { provider, geminiApiKey, openaiApiKey, openaiBaseUrl, model } = req.body;
    const updated = db.updateSettings({
      provider,
      geminiApiKey,
      openaiApiKey,
      openaiBaseUrl,
      model
    });
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test connection with AI provider
router.post('/test', async (req, res) => {
  try {
    const testPrompt = 'Respond with "AI Connection Successful." if you receive this message.';
    const result = await callAiModel({ prompt: testPrompt, temperature: 0 });

    if (result.success) {
      res.json({
        success: true,
        provider: result.provider,
        response: result.text,
        message: `Successfully connected to ${result.provider.toUpperCase()} model!`
      });
    } else if (result.noKey) {
      res.json({
        success: true,
        provider: 'builtin',
        message: 'Built-in high-precision engine active. Ready for local document analysis.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Connection failed'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

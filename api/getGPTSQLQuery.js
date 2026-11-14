const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { data, fieldExplanations, userInput } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(503).json({ error: 'AI service is not configured' });
    }
    const response = await fetch('https://api.moonshot.cn/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'chat',
        input: {
          data,
          fieldExplanations,
          userInput,
        },
        parameters: {
          temperature: 0.7,
          max_output_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
      }),
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Moonshot request failed');
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;

const { suggestRequestRefinement } = require('../services/aiService');

async function getRequestSuggestions(req, res) {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required for suggestions.' });
    }

    try {
        const suggestions = await suggestRequestRefinement(title, description || '');
        return res.json(suggestions);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { getRequestSuggestions };

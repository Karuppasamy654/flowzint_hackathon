const Notification = require('../models/Notification');

async function getNotifications(req, res) {
    const userId = req.user?.id || 'anonymous';
    if (userId === 'anonymous') {
        return res.json([]);
    }

    try {
        const list = await Notification.find({ userId }).sort({ createdAt: -1 });
        return res.json(list);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function markAsRead(req, res) {
    const id = req.params.id;
    try {
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }
        return res.json(notification);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getNotifications, markAsRead };

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reportedUserId: { type: String, required: true },
    reporterUserId: { type: String, required: true },
    reason: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);

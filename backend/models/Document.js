const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agencyName: {
    type: String,
    required: true
  },
  agencyEmail: {
    type: String,
    required: true
  },
  businessLicense: {
    type: String,
    required: true
  },
  taxCertificate: {
    type: String,
    required: true
  },
  authorizationLetter: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  }
});

module.exports = mongoose.model('Document', documentSchema);

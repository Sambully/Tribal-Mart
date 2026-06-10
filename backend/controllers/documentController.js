const Document = require('../models/Document');

// Get agency's documents
exports.getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.findOne({ agency: req.user._id });
    
    if (!documents) {
      return res.json(null);
    }

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload documents
// Accepts EITHER:
//   - JSON body  : { businessLicense, taxCertificate, authorizationLetter }  ← Cloudinary URLs
//   - multipart  : 3 file fields (legacy path, kept for backwards compatibility)
exports.uploadDocuments = async (req, res) => {
  try {
    // Prefer JSON URLs (Cloudinary flow). Fall back to multipart files.
    let businessLicenseUrl = req.body?.businessLicense;
    let taxCertificateUrl = req.body?.taxCertificate;
    let authorizationLetterUrl = req.body?.authorizationLetter;

    if (!businessLicenseUrl || !taxCertificateUrl || !authorizationLetterUrl) {
      // Legacy multipart fallback
      const { businessLicense, taxCertificate, authorizationLetter } = req.files || {};
      if (!businessLicense || !taxCertificate || !authorizationLetter) {
        return res.status(400).json({ message: 'All documents are required' });
      }
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      businessLicenseUrl = `${serverUrl}/uploads/documents/${businessLicense[0].filename}`;
      taxCertificateUrl = `${serverUrl}/uploads/documents/${taxCertificate[0].filename}`;
      authorizationLetterUrl = `${serverUrl}/uploads/documents/${authorizationLetter[0].filename}`;
    }

    // Upsert
    let documents = await Document.findOne({ agency: req.user._id });

    if (documents) {
      documents.businessLicense = businessLicenseUrl;
      documents.taxCertificate = taxCertificateUrl;
      documents.authorizationLetter = authorizationLetterUrl;
      documents.status = 'pending';
      documents.uploadedAt = new Date();
      documents.rejectionReason = '';
    } else {
      documents = new Document({
        agency: req.user._id,
        agencyName: req.user.name,
        agencyEmail: req.user.email,
        businessLicense: businessLicenseUrl,
        taxCertificate: taxCertificateUrl,
        authorizationLetter: authorizationLetterUrl,
        status: 'pending',
      });
    }

    await documents.save();

    res.json({ message: 'Documents uploaded successfully', documents });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
};

// Get all pending documents (Admin only)
exports.getPendingDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ status: 'pending' }).sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all documents (Admin only)
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve or reject documents (Admin only)
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { documentId, status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const documents = await Document.findById(documentId);

    if (!documents) {
      return res.status(404).json({ message: 'Documents not found' });
    }

    documents.status = status;
    documents.reviewedAt = new Date();
    documents.reviewedBy = req.user._id;
    
    if (status === 'rejected') {
      documents.rejectionReason = rejectionReason;
    }

    await documents.save();

    res.json({ message: `Documents ${status} successfully`, documents });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if agency is verified
exports.checkVerification = async (req, res) => {
  try {
    const documents = await Document.findOne({ agency: req.user._id });
    
    const isVerified = documents && documents.status === 'approved';
    
    res.json({ isVerified, status: documents?.status || 'none' });
  } catch (error) {
    console.error('Error checking verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

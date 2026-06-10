import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import './DocumentApproval.css';

const DocumentApproval = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [viewerError, setViewerError] = useState(false);

  // Proactively probe the document URL when the viewer opens — iframes
  // don't fire onError for HTTP 404s (the server still responds with HTML),
  // so we HEAD-check first and show the friendly fallback if the file is gone.
  useEffect(() => {
    if (!viewingDocument) return;
    const url = (function getDocUrl(p) {
      if (!p) return null;
      if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      if (p.startsWith('/')) return `${base}${p}`;
      if (/^(businessLicense|taxCertificate|authorizationLetter)-/i.test(p)) {
        return `${base}/uploads/documents/${p}`;
      }
      return `${base}/uploads/products/${p}`;
    })(viewingDocument.url);
    if (!url) return;
    setViewerError(false);
    fetch(url, { method: 'HEAD' })
      .then((r) => { if (!r.ok) setViewerError(true); })
      .catch(() => setViewerError(true));
  }, [viewingDocument]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login/admin');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/login/admin');
      return;
    }

    setUser(parsedUser);
    fetchDocuments();
  }, [navigate]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/api/documents/all');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId) => {
    if (!window.confirm('Are you sure you want to approve these documents?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.post('/api/documents/update-status', {
        documentId,
        status: 'approved'
      });
      alert('Documents approved successfully!');
      fetchDocuments();
      setSelectedDoc(null);
    } catch (error) {
      alert('Failed to approve documents');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (documentId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/api/documents/update-status', {
        documentId,
        status: 'rejected',
        rejectionReason
      });
      alert('Documents rejected');
      fetchDocuments();
      setSelectedDoc(null);
      setRejectionReason('');
    } catch (error) {
      alert('Failed to reject documents');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredDocuments = documents.filter(doc => filter === 'all' || doc.status === filter);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-badge-doc pending', text: 'Pending', icon: '◐' },
      approved: { class: 'status-badge-doc approved', text: 'Approved', icon: '✓' },
      rejected: { class: 'status-badge-doc rejected', text: 'Rejected', icon: '✗' }
    };
    return badges[status];
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Document Verification</h1>
            <p>Review and approve agency documents</p>
          </div>
          <div className="header-actions">
            <button className="header-btn" title="Notifications">
              <span>◆</span>
            </button>
            <div className="user-profile">
              <div className="profile-avatar admin">{user.name.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({documents.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({documents.filter(d => d.status === 'pending').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({documents.filter(d => d.status === 'approved').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({documents.filter(d => d.status === 'rejected').length})
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">∅</div>
            <h3>No documents found</h3>
            <p>No {filter !== 'all' ? filter : ''} documents at the moment</p>
          </div>
        ) : (
          <section className="dashboard-section">
            <div className="documents-grid">
              {filteredDocuments.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="doc-card-header">
                    <div>
                      <h3>{doc.agencyName}</h3>
                      <p className="doc-email">{doc.agencyEmail}</p>
                    </div>
                    <div className={getStatusBadge(doc.status).class}>
                      <span>{getStatusBadge(doc.status).icon}</span>
                      {getStatusBadge(doc.status).text}
                    </div>
                  </div>

                  <div className="doc-card-body">
                    <div className="doc-info-row">
                      <span className="doc-label">Business License</span>
                      <div className="doc-value-with-btn">
                        <span className="doc-value">{doc.businessLicense?.split('/').pop() || 'N/A'}</span>
                        <button 
                          className="view-doc-btn"
                          onClick={() => { setViewerError(false); setViewingDocument({ type: 'businessLicense', url: doc.businessLicense, name: 'Business License' }); }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                    <div className="doc-info-row">
                      <span className="doc-label">Tax Certificate</span>
                      <div className="doc-value-with-btn">
                        <span className="doc-value">{doc.taxCertificate?.split('/').pop() || 'N/A'}</span>
                        <button 
                          className="view-doc-btn"
                          onClick={() => { setViewerError(false); setViewingDocument({ type: 'taxCertificate', url: doc.taxCertificate, name: 'Tax Certificate' }); }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                    <div className="doc-info-row">
                      <span className="doc-label">Authorization Letter</span>
                      <div className="doc-value-with-btn">
                        <span className="doc-value">{doc.authorizationLetter?.split('/').pop() || 'N/A'}</span>
                        <button 
                          className="view-doc-btn"
                          onClick={() => { setViewerError(false); setViewingDocument({ type: 'authorizationLetter', url: doc.authorizationLetter, name: 'Authorization Letter' }); }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                    <div className="doc-info-row">
                      <span className="doc-label">Uploaded</span>
                      <span className="doc-value">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {doc.reviewedAt && (
                      <div className="doc-info-row">
                        <span className="doc-label">Reviewed</span>
                        <span className="doc-value">{new Date(doc.reviewedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {doc.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>

                  {doc.status === 'pending' && (
                    <div className="doc-card-actions">
                      <button 
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(doc._id)}
                        disabled={processing}
                      >
                        Approve
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => setSelectedDoc(doc)}
                        disabled={processing}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Document Viewer Modal */}
        {viewingDocument && (
          <div className="modal-overlay" onClick={() => setViewingDocument(null)}>
            <div className="modal-content document-viewer" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{viewingDocument.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setViewingDocument(null)}
                >
                  ✕
                </button>
              </div>
              <div className="document-display">
                {viewerError ? (
                  <div style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: '#fff7ed',
                    border: '1px dashed #f59e0b',
                    borderRadius: 12,
                    color: '#7c2d12'
                  }}>
                    <div style={{ fontSize: '2.6rem', marginBottom: '0.6rem' }}>📂</div>
                    <h4 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--font-display, Georgia)', color: '#7c2d12' }}>
                      File not available on the server
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                      This document record exists but the underlying file is missing — likely an interrupted upload.
                      Please ask the agency to re-upload their KYC documents.
                    </p>
                  </div>
                ) : viewingDocument.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={getImageUrl(viewingDocument.url)}
                    title={viewingDocument.name}
                    onError={() => setViewerError(true)}
                    style={{
                      width: '100%',
                      height: '500px',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <img
                    src={getImageUrl(viewingDocument.url)}
                    alt={viewingDocument.name}
                    onError={() => setViewerError(true)}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '600px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
              <div className="modal-footer">
                <a
                  href={getImageUrl(viewingDocument.url)}
                  download
                  className="download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
                <button 
                  className="close-viewer-btn"
                  onClick={() => setViewingDocument(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {selectedDoc && (
          <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Reject Documents</h3>
              <p>Agency: <strong>{selectedDoc.agencyName}</strong></p>
              <textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                className="rejection-textarea"
              />
              <div className="modal-actions">
                <button 
                  className="modal-btn cancel-btn"
                  onClick={() => {
                    setSelectedDoc(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn confirm-btn"
                  onClick={() => handleReject(selectedDoc._id)}
                  disabled={processing || !rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentApproval;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import { uploadMultipleToCloudinary } from '../services/cloudinary';
import AgencySidebar from '../components/AgencySidebar';
import AgentSidebar from '../components/AgentSidebar';
import '../Dashboard/Dashboard.css';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectAgencyId = searchParams.get('agencyId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAgent = storedUser?.role === 'agent';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    originalPrice: '',
    sellingPrice: '',
    quantity: '1',
    condition: 'Good',
    images: [],
    agencyId: ''
  });
  const [managedAgencies, setManagedAgencies] = useState([]);

  // Categories are loaded live from /api/categories so anything the
  // admin adds in the Categories screen shows up here immediately.
  const [categories, setCategories] = useState([
    'Electronics', 'Furniture', 'Clothing', 'Appliances', 'Toys', 'Vehicles', 'Others',
  ]);
  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  useEffect(() => {
    if (isAgent) {
      loadManagedAgencies();
      setIsVerified(true);
      setCheckingVerification(false);
    } else {
      checkVerificationStatus();
    }
    // Load live category list (public endpoint, no auth needed)
    api.get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          // If the current selection isn't in the new list, pick the first.
          setFormData((prev) =>
            res.data.includes(prev.category) ? prev : { ...prev, category: res.data[0] }
          );
        }
      })
      .catch((e) => console.warn('Failed to load categories, using defaults:', e?.message));
  }, []);

  const loadManagedAgencies = async () => {
    try {
      const res = await api.get('/api/agents/managed-agencies');
      setManagedAgencies(res.data);
      if (res.data.length > 0) {
        // Prefer the agency specified in the URL (?agencyId=...), else the first one
        const chosen = preselectAgencyId && res.data.find(a => a._id === preselectAgencyId);
        setFormData((prev) => ({ ...prev, agencyId: (chosen || res.data[0])._id }));
      }
    } catch (e) {
      console.error('Failed to load managed agencies', e);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await api.get('/api/documents/check-verification');
      setIsVerified(response.data.isVerified);
    } catch (error) {
      console.error('Error checking verification:', error);
      setIsVerified(false);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const onDrop = (acceptedFiles) => {
    setFormData({
      ...formData,
      images: [...formData.images, ...acceptedFiles]
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    }
  });

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.title || !formData.description || !formData.originalPrice || !formData.sellingPrice) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (isAgent && !formData.agencyId) {
      setError('Please select the agency you are listing for');
      setLoading(false);
      return;
    }

    if (Number(formData.sellingPrice) > Number(formData.originalPrice)) {
      setError('Selling price cannot be higher than original price');
      setLoading(false);
      return;
    }

    try {
      // Step 1: upload all product images directly to Cloudinary
      // (frontend → CDN). Returns array of public URLs.
      const imageUrls = formData.images.length > 0
        ? await uploadMultipleToCloudinary(formData.images)
        : [];

      // Step 2: send a normal JSON payload to the backend with the URLs.
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        originalPrice: Number(formData.originalPrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        condition: formData.condition,
        images: imageUrls,
      };
      if (isAgent) payload.agencyId = formData.agencyId;

      await api.post('/api/products', payload);

      setSuccess(isAgent
        ? 'Listed! Agency must approve before it goes to admin.'
        : 'Product added successfully! Pending admin approval.');
      setTimeout(() => {
        navigate(isAgent ? '/dashboard/agent' : '/dashboard/agency');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add product');
      console.error('Add product error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingVerification) {
    return (
      <div className="dashboard-container">
        {isAgent ? <AgentSidebar /> : <AgencySidebar />}
        <main className="dashboard-main">
          <div className="loading-state" style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-mid)' }}>Checking verification status…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {isAgent ? <AgentSidebar /> : <AgencySidebar />}
      <main className="dashboard-main">
      <div className="add-product-container">
        <button className="back-btn-add" onClick={() => navigate(isAgent ? '/dashboard/agent' : '/dashboard/agency')}>
          ← Back to Dashboard
        </button>

        {isAgent && (
          <div className="form-group-add" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="agencyId">Listing on behalf of *</label>
            {managedAgencies.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10, color: 'var(--fg-mid)' }}>
                You don't manage any agencies yet. An agency must approve your request first.
              </div>
            ) : (
              <select
                id="agencyId"
                name="agencyId"
                value={formData.agencyId}
                onChange={handleChange}
                required
              >
                {managedAgencies.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {!isAgent && isVerified === false && (
          <div className="verification-warning">
            <div className="warning-icon">!</div>
            <div className="warning-content">
              <h3>Verification Required</h3>
              <p>You need to upload and get your documents verified before you can add products.</p>
              <button 
                className="warning-btn" 
                onClick={() => navigate('/upload-documents')}
              >
                Upload Documents
              </button>
            </div>
          </div>
        )}

        <div className={`add-product-card ${!isVerified && !isAgent ? 'disabled-card' : ''}`}>
          <div className="add-product-header">
            <div className="header-icon">+</div>
            <h2>Add New Product</h2>
            <p>Add items for selling</p>
          </div>

          {error && <div className="error-message-add">{error}</div>}
          {success && <div className="success-message-add">{success}</div>}

          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="form-group-add">
                <label htmlFor="title">Product Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 14 Pro Max 256GB"
                  required
                />
              </div>

              <div className="form-group-add">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group-add">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the seized item..."
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group-add">
                <label htmlFor="originalPrice">Original Price (₹) *</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>

              <div className="form-group-add">
                <label htmlFor="sellingPrice">Selling Price (₹) *</label>
                <input
                  type="number"
                  id="sellingPrice"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="15000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group-add">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group-add">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group-add">
              <label>Product Images (optional)</label>
              <div 
                {...getRootProps()} 
                className={`dropzone ${isDragActive ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the images here...</p>
                ) : (
                  <div className="dropzone-content">
                    <div className="dropzone-icon">⬆</div>
                    <p>Drag & drop images here, or click to select</p>
                    <small>Supported: JPG, PNG, GIF, WebP</small>
                  </div>
                )}
              </div>

              {formData.images.length > 0 && (
                <div className="images-preview">
                  <p className="preview-title">Selected Images ({formData.images.length})</p>
                  <div className="images-list">
                    {formData.images.map((image, index) => (
                      <div key={index} className="image-item">
                        <div className="image-info">
                          <span className="image-name">{image.name}</span>
                          <span className="image-size">({(image.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {formData.originalPrice && formData.sellingPrice && (
              <div className="discount-badge">
                <span className="discount-label">Discount:</span>
                <span className="discount-value">
                  {((1 - formData.sellingPrice / formData.originalPrice) * 100).toFixed(0)}% OFF
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn-add agency"
              disabled={loading || !isVerified}
            >
              {loading ? 'Adding Product...' : !isVerified ? 'Verification Required' : 'Add Product & Submit for Approval'}
            </button>
          </form>

          <div className="info-box">
            <strong>ℹ Note:</strong> All products will be reviewed by admin before being listed publicly.
            You'll be notified once your product is approved or if any changes are needed.
          </div>
        </div>
      </div>
      </main>
    </div>
  );
};

export default AddProduct;
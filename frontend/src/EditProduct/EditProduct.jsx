import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import AgencySidebar from '../components/AgencySidebar';
import '../Dashboard/Dashboard.css';
import '../AddProduct/AddProduct.css';

const DEFAULT_CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Appliances', 'Toys', 'Vehicles', 'Others'];
const CONDITIONS   = ['New', 'Like New', 'Good', 'Fair'];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'Electronics',
    originalPrice: '', sellingPrice: '', quantity: '1', condition: 'Good',
  });
  const [existingImages, setExistingImages] = useState([]);
  const [CATEGORIES, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Pull live categories (admin-managed list)
    api.get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) setCategories(res.data);
      })
      .catch(() => { /* fall back to defaults silently */ });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        const p = res.data;
        setForm({
          title: p.title || '',
          description: p.description || '',
          category: p.category || 'Electronics',
          originalPrice: String(p.originalPrice || ''),
          sellingPrice:  String(p.sellingPrice  || ''),
          quantity:      String(p.quantity      || '1'),
          condition: p.condition || 'Good',
        });
        setExistingImages(p.images || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Could not load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.description || !form.originalPrice || !form.sellingPrice) {
      setError('Please fill all required fields'); return;
    }
    if (Number(form.sellingPrice) > Number(form.originalPrice)) {
      setError('Selling price cannot be higher than original price'); return;
    }
    setSaving(true);
    try {
      await api.put(`/api/products/${id}`, {
        ...form,
        originalPrice: Number(form.originalPrice),
        sellingPrice:  Number(form.sellingPrice),
        quantity:      Number(form.quantity),
      });
      setSuccess('Updated — listing returns to pending for admin review.');
      setTimeout(() => navigate('/my-products'), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <AgencySidebar />
        <main className="dashboard-main">
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-mid)' }}>Loading product…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <AgencySidebar />
      <main className="dashboard-main">
        <div className="add-product-container">
          <button className="back-btn-add" onClick={() => navigate('/my-products')}>
            ← Back to My Products
          </button>

          <div className="add-product-card">
            <div className="add-product-header">
              <div className="header-icon">✎</div>
              <h2>Edit Product</h2>
              <p>Changes return the listing to "pending" for admin re-review.</p>
            </div>

            {error && <div className="error-message-add">{error}</div>}
            {success && <div className="success-message-add">{success}</div>}

            <form onSubmit={onSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group-add">
                  <label>Title *</label>
                  <input type="text" name="title" value={form.title} onChange={onChange} required />
                </div>
                <div className="form-group-add">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={onChange} required>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group-add">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={onChange} rows="4" required />
              </div>

              <div className="form-row">
                <div className="form-group-add">
                  <label>Original Price (₹) *</label>
                  <input type="number" name="originalPrice" value={form.originalPrice} onChange={onChange} min="0" required />
                </div>
                <div className="form-group-add">
                  <label>Selling Price (₹) *</label>
                  <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={onChange} min="0" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-add">
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={form.quantity} onChange={onChange} min="0" />
                </div>
                <div className="form-group-add">
                  <label>Condition</label>
                  <select name="condition" value={form.condition} onChange={onChange}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {existingImages.length > 0 && (
                <div className="form-group-add">
                  <label>Current Images</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {existingImages.map((src, i) => (
                      <img key={i} src={getImageUrl(src)} alt={`existing ${i}`}
                        style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-soft)' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--fg-light)', marginTop: '0.5rem' }}>
                    To replace images, delete this listing and recreate it (image replacement is on the v1.1 roadmap).
                  </p>
                </div>
              )}

              <button type="submit" className="submit-btn-add" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProduct;

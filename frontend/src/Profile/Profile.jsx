import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';
import CustomerSidebar from '../components/CustomerSidebar';
import { useToast } from '../components/Toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/CustomerDashboard.css';
import './Profile.css';

const BLANK_ADDR = { label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('addresses');
  const [me, setMe] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState(BLANK_ADDR);
  const [pmForm, setPmForm] = useState({ kind: 'card', label: '', last4: '', upiId: '', bankName: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { navigate('/login/customer'); return; }
    loadAll();
  }, [navigate]);

  const loadAll = async () => {
    try {
      const [meRes, addrRes, pmRes] = await Promise.all([
        api.get('/api/profile/me'),
        api.get('/api/profile/addresses'),
        api.get('/api/profile/payment-methods'),
      ]);
      setMe(meRes.data);
      setAddresses(addrRes.data || []);
      setPayments(pmRes.data || []);
      // Sync the stored user (so avatar/name reflect immediately)
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        const merged = { ...stored, name: meRes.data.name, avatarUrl: meRes.data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (_) {}
    } catch (e) {
      console.error('Profile load', e);
    }
  };

  // ── Avatar ──────────────────────────────────────────────
  const onPickAvatar = () => fileInputRef.current?.click();
  const onUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      // Upload directly to Cloudinary, then tell the backend the URL.
      const avatarUrl = await uploadToCloudinary(file);
      const res = await api.put('/api/profile/me', { avatarUrl });
      const finalUrl = res.data?.avatarUrl || avatarUrl;
      toast.success('Profile photo updated');
      setMe((m) => ({ ...m, avatarUrl: finalUrl }));
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        localStorage.setItem('user', JSON.stringify({ ...stored, avatarUrl: finalUrl }));
      } catch (_) {}
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Addresses ───────────────────────────────────────────
  const startEditAddr = (a) => { setEditingAddr(a._id); setAddrForm({ ...a }); };
  const startAddAddr  = () => { setEditingAddr('new'); setAddrForm(BLANK_ADDR); };
  const cancelAddr    = () => { setEditingAddr(null); setAddrForm(BLANK_ADDR); };

  const saveAddr = async (e) => {
    e.preventDefault();
    try {
      if (editingAddr === 'new') {
        const res = await api.post('/api/profile/addresses', addrForm);
        setAddresses(res.data);
        toast.success('Address saved');
      } else {
        const res = await api.put(`/api/profile/addresses/${editingAddr}`, addrForm);
        setAddresses(res.data);
        toast.success('Address updated');
      }
      cancelAddr();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const deleteAddr = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await api.delete(`/api/profile/addresses/${id}`);
      setAddresses(res.data);
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const setDefaultAddr = async (id) => {
    try {
      const res = await api.put(`/api/profile/addresses/${id}`, { isDefault: true });
      setAddresses(res.data);
      toast.success('Set as default');
    } catch (_) { toast.error('Failed'); }
  };

  // ── Payment methods ─────────────────────────────────────
  const addPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...pmForm };
      // Tidy: only send relevant fields per kind
      if (payload.kind === 'card')        { delete payload.upiId; delete payload.bankName; }
      if (payload.kind === 'upi')         { delete payload.last4; delete payload.bankName; }
      if (payload.kind === 'netbanking')  { delete payload.last4; delete payload.upiId; }
      const res = await api.post('/api/profile/payment-methods', payload);
      setPayments(res.data);
      setPmForm({ kind: 'card', label: '', last4: '', upiId: '', bankName: '' });
      toast.success('Payment method saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const deletePm = async (id) => {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      const res = await api.delete(`/api/profile/payment-methods/${id}`);
      setPayments(res.data);
      toast.success('Removed');
    } catch (_) { toast.error('Failed'); }
  };

  if (!me) return null;

  return (
    <div className="dashboard-container cust-dash">
      <CustomerSidebar />
      <main className="dashboard-main">

        {/* Hero */}
        <section className="cust-hero">
          <div className="cust-hero-pattern" aria-hidden />
          <div className="cust-hero-copy">
            <span className="cust-hero-tag">YOUR ACCOUNT</span>
            <h1>My <em>profile.</em></h1>
            <p>Manage your shipping addresses, payment methods, and profile photo.</p>
          </div>
          <div className="cust-hero-profile">
            <div className="cust-profile">
              <div className="cust-avatar prof-avatar-pill">
                {me.avatarUrl
                  ? <img src={getImageUrl(me.avatarUrl)} alt={me.name} />
                  : (me.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="cust-profile-name">{me.name}</div>
                <div className="cust-profile-role">{me.email}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Avatar block */}
        <section className="cust-section prof-avatar-section">
          <div className="prof-avatar-row">
            <div className="prof-avatar-big">
              {me.avatarUrl
                ? <img src={getImageUrl(me.avatarUrl)} alt={me.name} />
                : <span>{(me.name || '?').charAt(0).toUpperCase()}</span>}
            </div>
            <div className="prof-avatar-meta">
              <h3>{me.name}</h3>
              <p>{me.email} · {me.role}</p>
              <div className="prof-avatar-actions">
                <button className="cust-btn-primary" onClick={onPickAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? 'Uploading…' : (me.avatarUrl ? 'Change photo' : 'Upload photo')}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onUploadAvatar} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="prof-tabs">
          <button
            className={`prof-tab ${tab === 'addresses' ? 'is-active' : ''}`}
            onClick={() => setTab('addresses')}
          >📍 Addresses · {addresses.length}</button>
          <button
            className={`prof-tab ${tab === 'payments' ? 'is-active' : ''}`}
            onClick={() => setTab('payments')}
          >💳 Payment Methods · {payments.length}</button>
        </div>

        {/* Addresses tab */}
        {tab === 'addresses' && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">Address book</span>
                <h2>Your <em>shipping addresses</em></h2>
              </div>
              {editingAddr === null && (
                <button className="cust-btn-primary" onClick={startAddAddr}>
                  + Add address
                </button>
              )}
            </div>

            {editingAddr !== null && (
              <form onSubmit={saveAddr} className="prof-form">
                <div className="prof-grid-2">
                  <label className="prof-field">
                    <span>Label</span>
                    <input value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} placeholder="Home / Office / Mom's place" />
                  </label>
                  <label className="prof-field">
                    <span>Full Name *</span>
                    <input required value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} />
                  </label>
                  <label className="prof-field">
                    <span>Phone *</span>
                    <input required value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="10-digit mobile" />
                  </label>
                  <label className="prof-field">
                    <span>Pincode *</span>
                    <input required value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="6 digit" />
                  </label>
                </div>
                <label className="prof-field">
                  <span>Address line 1 *</span>
                  <input required value={addrForm.addressLine1} onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} />
                </label>
                <label className="prof-field">
                  <span>Address line 2</span>
                  <input value={addrForm.addressLine2 || ''} onChange={(e) => setAddrForm({ ...addrForm, addressLine2: e.target.value })} />
                </label>
                <div className="prof-grid-2">
                  <label className="prof-field">
                    <span>City *</span>
                    <input required value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
                  </label>
                  <label className="prof-field">
                    <span>State *</span>
                    <input required value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} />
                  </label>
                </div>
                <label className="prof-check">
                  <input type="checkbox" checked={!!addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                  Use as default shipping address
                </label>
                <div className="prof-form-actions">
                  <button type="button" className="prof-btn-ghost" onClick={cancelAddr}>Cancel</button>
                  <button type="submit" className="cust-btn-primary">Save address</button>
                </div>
              </form>
            )}

            {addresses.length === 0 && editingAddr === null ? (
              <div className="cust-empty-mini">
                <span>📍</span>
                <p>No saved addresses yet — add one to speed up checkout.</p>
                <button className="cust-btn-primary" onClick={startAddAddr}>+ Add your first address</button>
              </div>
            ) : (
              <div className="prof-cards">
                {addresses.map((a) => (
                  <div key={a._id} className={`prof-card ${a.isDefault ? 'is-default' : ''}`}>
                    <div className="prof-card-head">
                      <span className="prof-label">{a.label || 'Address'}</span>
                      {a.isDefault && <span className="prof-default-pill">DEFAULT</span>}
                    </div>
                    <h4>{a.fullName}</h4>
                    <p>{a.phone}</p>
                    <p>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                    <p>{a.city}, {a.state} – {a.pincode}</p>
                    <div className="prof-card-actions">
                      {!a.isDefault && (
                        <button className="prof-btn-ghost" onClick={() => setDefaultAddr(a._id)}>Set default</button>
                      )}
                      <button className="prof-btn-ghost" onClick={() => startEditAddr(a)}>Edit</button>
                      <button className="prof-btn-danger" onClick={() => deleteAddr(a._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Payments tab */}
        {tab === 'payments' && (
          <section className="cust-section">
            <div className="cust-section-head">
              <div>
                <span className="cust-section-tag">Payment methods</span>
                <h2>Saved <em>payment options</em></h2>
              </div>
            </div>

            <form onSubmit={addPaymentMethod} className="prof-form">
              <div className="prof-grid-2">
                <label className="prof-field">
                  <span>Type</span>
                  <select value={pmForm.kind} onChange={(e) => setPmForm({ ...pmForm, kind: e.target.value })}>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </label>
                <label className="prof-field">
                  <span>Nickname</span>
                  <input value={pmForm.label} onChange={(e) => setPmForm({ ...pmForm, label: e.target.value })} placeholder="HDFC Platinum, etc." />
                </label>
              </div>

              {pmForm.kind === 'card' && (
                <label className="prof-field">
                  <span>Last 4 digits *</span>
                  <input
                    required
                    maxLength={4}
                    value={pmForm.last4}
                    onChange={(e) => setPmForm({ ...pmForm, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234"
                  />
                  <small className="prof-hint">We never store full card numbers. Last 4 is just so you can identify the card.</small>
                </label>
              )}
              {pmForm.kind === 'upi' && (
                <label className="prof-field">
                  <span>UPI ID *</span>
                  <input required value={pmForm.upiId} onChange={(e) => setPmForm({ ...pmForm, upiId: e.target.value })} placeholder="you@upi" />
                </label>
              )}
              {pmForm.kind === 'netbanking' && (
                <label className="prof-field">
                  <span>Bank name *</span>
                  <input required value={pmForm.bankName} onChange={(e) => setPmForm({ ...pmForm, bankName: e.target.value })} placeholder="HDFC, SBI, etc." />
                </label>
              )}

              <button type="submit" className="cust-btn-primary">+ Add payment method</button>
            </form>

            {payments.length === 0 ? (
              <div className="cust-empty-mini">
                <span>💳</span>
                <p>No payment methods saved yet.</p>
              </div>
            ) : (
              <div className="prof-cards">
                {payments.map((p) => (
                  <div key={p._id} className={`prof-card ${p.isDefault ? 'is-default' : ''}`}>
                    <div className="prof-card-head">
                      <span className="prof-label">
                        {p.kind === 'card' ? '💳 Card' : p.kind === 'upi' ? '⚡ UPI' : '🏦 Net Banking'}
                      </span>
                      {p.isDefault && <span className="prof-default-pill">DEFAULT</span>}
                    </div>
                    <h4>{p.label || (p.kind === 'card' ? `Card •••• ${p.last4}` : p.kind === 'upi' ? p.upiId : p.bankName)}</h4>
                    {p.kind === 'card' && <p>Ends in {p.last4}</p>}
                    {p.kind === 'upi'  && <p>{p.upiId}</p>}
                    {p.kind === 'netbanking' && <p>{p.bankName}</p>}
                    <div className="prof-card-actions">
                      <button className="prof-btn-danger" onClick={() => deletePm(p._id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Profile;

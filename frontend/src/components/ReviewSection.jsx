import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './ReviewSection.css';

const Stars = ({ value = 0, onChange, size = 18 }) => {
  const editable = typeof onChange === 'function';
  return (
    <div className="rev-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`rev-star ${n <= value ? 'on' : ''} ${editable ? 'editable' : ''}`}
          onClick={() => editable && onChange(n)}
          role={editable ? 'button' : undefined}
          aria-label={editable ? `Rate ${n} stars` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewSection = ({ productId }) => {
  const [data, setData] = useState({ reviews: [], count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const canReview = user?.role === 'customer';
  const myReview = data.reviews.find((r) => r.customer === user?._id || r.customer === user?.id);

  const load = async () => {
    try {
      const res = await api.get(`/api/reviews/${productId}`);
      setData(res.data);
      if (canReview && myReview) {
        setRating(myReview.rating);
        setComment(myReview.comment || '');
      }
    } catch (e) {
      console.error('Reviews load', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!rating) { setMsg('Pick a rating first.'); return; }
    setPosting(true);
    try {
      await api.post('/api/reviews', { productId, rating, comment });
      setMsg(myReview ? 'Review updated — thanks!' : 'Review posted — thanks!');
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to post review');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rev-wrap">
      <div className="rev-head">
        <div>
          <h3>Customer Reviews</h3>
          {data.count > 0 ? (
            <div className="rev-summary">
              <Stars value={Math.round(data.average)} />
              <span className="rev-avg">{data.average.toFixed(1)}</span>
              <span className="rev-count">based on {data.count} review{data.count !== 1 ? 's' : ''}</span>
            </div>
          ) : (
            <p className="rev-empty-line">No reviews yet — be the first.</p>
          )}
        </div>
      </div>

      {canReview && (
        <form onSubmit={submit} className="rev-form">
          <div className="rev-form-head">
            <span className="rev-form-label">{myReview ? 'Update your review' : 'Write a review'}</span>
            <Stars value={rating} onChange={setRating} size={26} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this craft…"
            rows="3"
          />
          {msg && <div className="rev-msg">{msg}</div>}
          <button type="submit" className="rev-submit" disabled={posting}>
            {posting ? 'Posting…' : (myReview ? 'Update review' : 'Post review')}
          </button>
        </form>
      )}

      {loading ? (
        <p className="rev-loading">Loading reviews…</p>
      ) : data.reviews.length === 0 ? null : (
        <ul className="rev-list">
          {data.reviews.map((r) => (
            <li key={r._id} className="rev-item">
              <div className="rev-item-head">
                <div className="rev-avatar">{(r.customerName || '?').charAt(0).toUpperCase()}</div>
                <div className="rev-item-meta">
                  <div className="rev-name">{r.customerName}</div>
                  <Stars value={r.rating} size={14} />
                  <div className="rev-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              {r.comment && <p className="rev-comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewSection;

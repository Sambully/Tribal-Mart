import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @vapi-ai/web ships CJS with `{ default: Vapi }`. Vite's ESM interop
// sometimes hands us the wrapper object instead of unwrapping it, so
// pick `.default` if present, otherwise the import itself.
import VapiPkg from '@vapi-ai/web';
const Vapi = VapiPkg?.default || VapiPkg;
import './VoiceButton.css';

/* ────────────────────────────────────────────────────────────────
 * VoiceButton — Vapi-powered floating voice assistant.
 *
 * Lives bottom-LEFT above the WhatsApp button. Tap to start a live
 * voice call with the Tribal Mart Vapi assistant; tap again to end.
 * A volume-driven halo pulses while the assistant is speaking so
 * the user sees it's alive.
 *
 * Same hide-on-auth rule as the other floating widgets.
 * ──────────────────────────────────────────────────────────────── */

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

const VoiceButton = () => {
  const location = useLocation();
  const [status, setStatus] = useState('idle'); // idle | connecting | live | ending | error
  const [volume, setVolume] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [hover, setHover] = useState(false);
  const vapiRef = useRef(null);

  // Initialise the Vapi client once
  useEffect(() => {
    if (!PUBLIC_KEY) return;
    const v = new Vapi(PUBLIC_KEY);
    vapiRef.current = v;

    v.on('call-start', () => {
      setStatus('live');
      setStatusText('Connected');
    });
    v.on('call-end', () => {
      setStatus('idle');
      setStatusText('');
      setVolume(0);
    });
    v.on('speech-start', () => setStatusText('Saathi is speaking…'));
    v.on('speech-end', () => setStatusText('Listening…'));
    v.on('volume-level', (lvl) => setVolume(lvl));
    v.on('error', (err) => {
      console.error('[Vapi] error:', err);
      setStatus('error');
      setStatusText(err?.errorMsg || err?.error?.message || 'Voice call failed');
      setTimeout(() => {
        setStatus('idle');
        setStatusText('');
      }, 3500);
    });

    return () => {
      try { v.stop(); } catch (_) {}
    };
  }, []);

  // Hide on auth pages
  if (/^\/(login|signup)/.test(location.pathname)) return null;
  if (!PUBLIC_KEY || !ASSISTANT_ID) return null;

  const handleClick = async () => {
    const v = vapiRef.current;
    if (!v) return;
    if (status === 'live' || status === 'connecting') {
      setStatus('ending');
      try { await v.stop(); } catch (_) {}
      setStatus('idle');
      setStatusText('');
      return;
    }
    setStatus('connecting');
    setStatusText('Connecting…');
    try {
      await v.start(ASSISTANT_ID);
    } catch (err) {
      console.error('[Vapi] start failed:', err);
      setStatus('error');
      setStatusText('Could not start call');
      setTimeout(() => { setStatus('idle'); setStatusText(''); }, 3000);
    }
  };

  // Scale halo with the current volume (assistant speech volume 0..1)
  const haloScale = 1 + Math.min(volume * 0.55, 0.55);

  return (
    <div className="tm-voice-wrap">
      {/* Status pill bubbles above the button */}
      <AnimatePresence>
        {statusText && (
          <motion.div
            className="tm-voice-status"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            {statusText}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`tm-voice-launcher is-${status}`}
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={status === 'live' ? 'End voice call' : 'Talk to Saathi'}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.3 }}
      >
        <span
          className="tm-voice-halo"
          style={{ transform: `scale(${haloScale})` }}
        />
        {status === 'live' ? (
          /* End-call icon */
          <svg className="tm-voice-icon" viewBox="0 0 24 24" fill="none">
            <path d="M3 10.5a14.5 14.5 0 0 1 18 0l-2 2.5a2 2 0 0 1-2 .5l-2-1a2 2 0 0 1-1.4-1.9V9a8 8 0 0 0-5.2 0v1.6c0 .8-.5 1.6-1.4 1.9l-2 1a2 2 0 0 1-2-.5L3 10.5z" fill="#fff" transform="rotate(135 12 12)"/>
          </svg>
        ) : status === 'connecting' ? (
          /* Spinner */
          <svg className="tm-voice-icon tm-voice-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2.6" strokeOpacity="0.35"/>
            <path d="M21 12a9 9 0 0 0-9-9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        ) : (
          /* Mic icon */
          <svg className="tm-voice-icon" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="12" rx="3" fill="#fff"/>
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </motion.button>

      {hover && status === 'idle' && (
        <span className="tm-voice-tooltip">🎤 Talk to Saathi (voice)</span>
      )}
    </div>
  );
};

export default VoiceButton;

import React from 'react';
import { useI18n } from '../i18n';
import './LanguageToggle.css';

const LanguageToggle = ({ compact = false }) => {
  const { lang, setLang } = useI18n();

  return (
    <div className={`lang-toggle ${compact ? 'lang-toggle-compact' : ''}`}>
      <button
        className={`lang-pill ${lang === 'en' ? 'is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        className={`lang-pill ${lang === 'hi' ? 'is-active' : ''}`}
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
      >
        हिं
      </button>
    </div>
  );
};

export default LanguageToggle;

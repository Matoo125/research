export function Nav({ onNavigate, autoRead, onAutoReadChange, translationMode, onTranslationModeChange }) {
  return (
    <nav class="navbar">
      <a href="/learn" class="nav-link" onClick={e => { e.preventDefault(); onNavigate('/learn'); }}>Learn</a>
      <a href="/" class="nav-link" onClick={e => { e.preventDefault(); onNavigate('/'); }}>Overview</a>
      <div class="nav-settings">
        <label class="setting-toggle">
          <input
            type="checkbox"
            checked={autoRead}
            onChange={e => onAutoReadChange(e.currentTarget.checked)}
          />
          Auto-read audio (word on incorrect, sentence on correct)
        </label>
        <label class="setting-toggle">
          <input
            type="checkbox"
            checked={translationMode === 'word'}
            onChange={e => onTranslationModeChange(e.currentTarget.checked ? 'word' : 'sentence')}
          />
          Word-only translation
        </label>
      </div>
    </nav>
  );
}

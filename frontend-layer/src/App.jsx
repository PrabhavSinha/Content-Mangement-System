import React, { useState, useEffect } from 'react';

const GATEWAY_URL = 'http://127.0.0.1:8000/gateway';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
  }

  .auth-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%);
    position: relative;
    overflow: hidden;
  }

  .auth-wrapper::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
  }

  .auth-wrapper::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
    bottom: -50px; right: -50px;
    pointer-events: none;
  }

  .auth-card {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 16px;
    padding: 2.5rem;
    width: 380px;
    position: relative;
    z-index: 1;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  }

  .auth-logo {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }

  .auth-logo h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.02em;
  }

  .auth-logo p {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .auth-tabs {
    display: flex;
    background: #0f1117;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 1.75rem;
    gap: 4px;
  }

  .auth-tab {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    background: transparent;
    color: #64748b;
  }

  .auth-tab.active {
    background: #1a1f2e;
    color: #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .field-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: #94a3b8;
    margin-bottom: 0.4rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .field-input {
    width: 100%;
    background: #0f1117;
    border: 1px solid #2d3348;
    border-radius: 8px;
    padding: 0.65rem 0.875rem;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
    margin-bottom: 1rem;
  }

  .field-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .field-input option { background: #1a1f2e; }

  .btn-primary {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    font-family: 'Inter', sans-serif;
    margin-top: 0.5rem;
  }

  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }

  .auth-switch {
    text-align: center;
    margin-top: 1.25rem;
    font-size: 0.85rem;
    color: #64748b;
  }

  .auth-switch span {
    color: #6366f1;
    cursor: pointer;
    font-weight: 500;
  }

  /* ── DASHBOARD ── */
  .dashboard {
    min-height: 100vh;
    background: #0f1117;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    background: #1a1f2e;
    border-bottom: 1px solid #2d3348;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 700;
    font-size: 1rem;
    color: #f1f5f9;
    letter-spacing: -0.01em;
  }

  .brand-dot {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
  }

  .topbar-nav {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .nav-btn {
    padding: 0.4rem 0.9rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    background: transparent;
    color: #64748b;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }

  .nav-btn:hover { background: #252b3b; color: #e2e8f0; }
  .nav-btn.active { background: #252b3b; color: #6366f1; }
  .nav-btn.admin-btn { color: #f87171; }
  .nav-btn.admin-btn.active { background: #2d1f1f; color: #f87171; }

  .topbar-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-info {
    text-align: right;
  }

  .user-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .role-badge {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.05em;
    font-family: 'JetBrains Mono', monospace;
  }

  .role-badge.user { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
  .role-badge.admin { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

  .logout-btn {
    padding: 0.35rem 0.8rem;
    background: transparent;
    border: 1px solid #2d3348;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }

  .logout-btn:hover { border-color: #ef4444; color: #ef4444; }

  /* ── MAIN CONTENT ── */
  .main-content {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 1.75rem;
  }

  .page-header h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.02em;
  }

  .page-header p {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  /* ── EDITOR ── */
  .editor-card {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .editor-title {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid #2d3348;
    color: #f1f5f9;
    font-size: 1.4rem;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    padding: 0.5rem 0 0.75rem 0;
    margin-bottom: 1rem;
    outline: none;
    letter-spacing: -0.02em;
    transition: border-color 0.2s;
  }

  .editor-title:focus { border-bottom-color: #6366f1; }
  .editor-title::placeholder { color: #334155; }

  .editor-body {
    width: 100%;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    line-height: 1.7;
    resize: none;
    outline: none;
    min-height: 160px;
  }

  .editor-body::placeholder { color: #334155; }

  .editor-toolbar {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #2d3348;
    margin-top: 1rem;
  }

  .btn-draft {
    padding: 0.55rem 1.25rem;
    background: #252b3b;
    border: 1px solid #2d3348;
    border-radius: 7px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }

  .btn-draft:hover { background: #2d3348; color: #e2e8f0; }

  .btn-publish {
    padding: 0.55rem 1.25rem;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: opacity 0.15s;
  }

  .btn-publish:hover { opacity: 0.88; }

  /* ── DRAFTS ── */
  .section-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2d3348;
  }

  .draft-item {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 8px;
    padding: 0.875rem 1rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.15s;
  }

  .draft-item:hover { border-color: #6366f1; background: #1e2438; }

  .draft-title { font-size: 0.9rem; font-weight: 500; color: #e2e8f0; }
  .draft-meta { font-size: 0.75rem; color: #475569; font-family: 'JetBrains Mono', monospace; }

  .empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    color: #334155;
    font-size: 0.875rem;
    font-style: italic;
  }

  /* ── FEED ── */
  .content-card {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
    transition: border-color 0.15s;
  }

  .content-card:hover { border-color: #374151; }

  .content-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .content-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
    letter-spacing: -0.01em;
  }

  .content-card p {
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 0.75rem;
  }

  .content-meta {
    font-size: 0.75rem;
    color: #334155;
    font-family: 'JetBrains Mono', monospace;
  }

  .btn-delete {
    padding: 0.3rem 0.75rem;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 5px;
    color: #f87171;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-delete:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); }

  /* ── SEARCH ── */
  .search-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .search-input {
    flex: 1;
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 8px;
    padding: 0.7rem 1rem;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
  .search-input::placeholder { color: #334155; }

  .btn-search {
    padding: 0.7rem 1.5rem;
    background: linear-gradient(135deg, #059669, #10b981);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .btn-search:hover { opacity: 0.88; }

  .search-result {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-left: 3px solid #10b981;
    border-radius: 0 10px 10px 0;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
  }

  .search-result h4 { font-size: 0.95rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.35rem; }
  .search-result p { font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; line-height: 1.5; }

  .similarity-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.2);
    color: #34d399;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── ADMIN ── */
  .admin-banner {
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    padding: 0.875rem 1.25rem;
    margin-bottom: 1.5rem;
    font-size: 0.85rem;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    text-align: center;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -0.03em;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #475569;
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .admin-row {
    background: #1a1f2e;
    border: 1px solid #2d3348;
    border-radius: 8px;
    padding: 0.875rem 1.1rem;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .admin-row-title { font-size: 0.9rem; font-weight: 500; color: #e2e8f0; }
  .admin-row-meta { font-size: 0.75rem; color: #475569; margin-top: 0.2rem; font-family: 'JetBrains Mono', monospace; }

  /* ── TOAST ── */
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 999;
    animation: slideIn 0.25s ease;
    max-width: 320px;
  }

  .toast.success { background: #052e16; border: 1px solid #166534; color: #4ade80; }
  .toast.error { background: #2d0a0a; border: 1px solid #7f1d1d; color: #f87171; }

  @keyframes slideIn {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

// ─── Toast hook ───
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [publishedContent, setPublishedContent] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('editor');

  const { toast, show } = useToast();

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`
  });

  useEffect(() => {
    if (user) { fetchDrafts(); fetchPublished(); }
  }, [user]);

  // ── AUTH ──
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp ? 'signup' : 'login';
    const payload = isSignUp
      ? { username: username.trim(), email: email.trim().toLowerCase(), password, role }
      : { email: email.trim().toLowerCase(), password };
    try {
      const res = await fetch(`${GATEWAY_URL}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error || data.detail) { show(data.error || data.detail, 'error'); }
      else {
        if (!isSignUp) {
          setUser({ userId: data.userId, username: data.username || email.split('@')[0], role: data.role, token: data.token });
        } else {
          show("Account created! Please sign in.", 'success');
          setIsSignUp(false);
        }
      }
    } catch { show("Cannot connect to Gateway.", 'error'); }
  };

  // ── DATA ──
  const fetchDrafts = async () => {
    try { const r = await fetch(`${GATEWAY_URL}/drafts`); setDrafts(Array.isArray(await r.json()) ? await (await fetch(`${GATEWAY_URL}/drafts`)).json() : []); } catch {}
  };

  const fetchPublished = async () => {
    try { const r = await fetch(`${GATEWAY_URL}/content`); const d = await r.json(); setPublishedContent(Array.isArray(d) ? d : []); } catch {}
  };

  // ── ACTIONS ──
  const handleSaveDraft = async () => {
    if (!title.trim() && !body.trim()) { show("Cannot save an empty draft.", 'error'); return; }
    try {
      const res = await fetch(`${GATEWAY_URL}/drafts`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title, body, authorId: user.userId }) });
      const data = await res.json();
      if (data.error || data.detail) show(data.error || data.detail, 'error');
      else { show("Draft saved to PostgreSQL!"); fetchDrafts(); }
    } catch { show("Failed to save draft.", 'error'); }
  };

  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) { show("Title and body are both required.", 'error'); return; }
    try {
      const res = await fetch(`${GATEWAY_URL}/publish`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title, body, authorId: user.userId }) });
      const data = await res.json();
      if (data.error || data.detail) show(data.error || data.detail, 'error');
      else { show("Published across SQL + NoSQL!"); setTitle(''); setBody(''); fetchPublished(); fetchDrafts(); }
    } catch { show("Failed to publish.", 'error'); }
  };

  const handleDeleteContent = async (contentId) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/content/${contentId}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.error || data.detail) show(data.error || data.detail, 'error');
      else { show("Content deleted."); fetchPublished(); }
    } catch { show("Delete failed.", 'error'); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${GATEWAY_URL}/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery }) });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) show("No results found.", 'error');
    } catch { show("Search failed.", 'error'); }
  };

  // ── AUTH SCREEN ──
  if (!user) return (
    <>
      <style>{styles}</style>
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">✦</div>
            <h1>ContentStudio</h1>
            <p>PS-29 · Content Publishing System</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${!isSignUp ? 'active' : ''}`} onClick={() => setIsSignUp(false)}>Sign In</button>
            <button className={`auth-tab ${isSignUp ? 'active' : ''}`} onClick={() => setIsSignUp(true)}>Sign Up</button>
          </div>

          <form onSubmit={handleAuth}>
            {isSignUp && (
              <>
                <label className="field-label">Username</label>
                <input className="field-input" type="text" placeholder="yourname" onChange={e => setUsername(e.target.value)} required />
                <label className="field-label">Access Role</label>
                <select className="field-input" onChange={e => setRole(e.target.value)} value={role}>
                  <option value="USER">USER — Standard Access</option>
                  <option value="ADMIN">ADMIN — Full Access</option>
                </select>
              </>
            )}
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="you@example.com" onChange={e => setEmail(e.target.value)} required />
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="••••••••" onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">{isSignUp ? 'Create Account' : 'Sign In'}</button>
          </form>

          <div className="auth-switch">
            {isSignUp ? 'Have an account? ' : 'New here? '}
            <span onClick={() => { setIsSignUp(!isSignUp); setPassword(''); }}>
              {isSignUp ? 'Sign In' : 'Create account'}
            </span>
          </div>
        </div>
        {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </div>
    </>
  );

  // ── DASHBOARD ──
  return (
    <>
      <style>{styles}</style>
      <div className="dashboard">

        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="brand-dot">✦</div>
            ContentStudio
          </div>
          <nav className="topbar-nav">
            <button className={`nav-btn ${tab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>Editor</button>
            <button className={`nav-btn ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}>
              Live Feed {publishedContent.length > 0 && `(${publishedContent.length})`}
            </button>
            <button className={`nav-btn ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Discovery</button>
            {user.role === 'ADMIN' && (
              <button className={`nav-btn admin-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>Admin</button>
            )}
          </nav>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <span className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>{user.role}</span>
            </div>
            <button className="logout-btn" onClick={() => setUser(null)}>Logout</button>
          </div>
        </div>

        {/* Content */}
        <div className="main-content">

          {/* EDITOR */}
          {tab === 'editor' && (
            <div>
              <div className="page-header">
                <h2>Editor</h2>
                <p>Write content, save as draft, or publish directly to the live feed.</p>
              </div>

              <div className="editor-card">
                <input
                  className="editor-title"
                  type="text"
                  placeholder="Untitled"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <textarea
                  className="editor-body"
                  placeholder="Start writing..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={8}
                />
                <div className="editor-toolbar">
                  <button className="btn-draft" onClick={handleSaveDraft}>Save Draft</button>
                  <button className="btn-publish" onClick={handlePublish}>↑ Publish</button>
                </div>
              </div>

              <div className="section-title">Drafts Pool — PostgreSQL</div>
              {drafts.length === 0
                ? <div className="empty-state">No drafts yet. Write something above and save it.</div>
                : drafts.map((d, i) => (
                  <div key={i} className="draft-item" onClick={() => { setTitle(d.title || ''); setBody(d.body || ''); }}>
                    <span className="draft-title">{d.title || "(Untitled)"}</span>
                    <span className="draft-meta">ID #{d.draftId}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* FEED */}
          {tab === 'feed' && (
            <div>
              <div className="page-header">
                <h2>Live Feed</h2>
                <p>{publishedContent.length} article{publishedContent.length !== 1 ? 's' : ''} published · stored in PostgreSQL + MongoDB</p>
              </div>
              {publishedContent.length === 0
                ? <div className="empty-state">Nothing published yet. Head to the Editor to publish your first article.</div>
                : publishedContent.map((c, i) => (
                  <div key={i} className="content-card">
                    <div className="content-card-header">
                      <h3>{c.title}</h3>
                      {user.role === 'ADMIN' && (
                        <button className="btn-delete" onClick={() => handleDeleteContent(c.contentId)}>Delete</button>
                      )}
                    </div>
                    <p>{c.body}</p>
                    <div className="content-meta">
                      {c.publishedAt ? new Date(c.publishedAt).toLocaleString() : ''} · Author #{c.authorId}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* SEARCH */}
          {tab === 'search' && (
            <div>
              <div className="page-header">
                <h2>Discovery Index</h2>
                <p>Semantic vector search · MongoDB embeddings · cosine similarity</p>
              </div>
              <div className="search-bar">
                <input
                  className="search-input"
                  type="text"
                  placeholder='Try: "cloud computing", "AI topics", "databases"...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn-search" onClick={handleSearch}>Search</button>
              </div>
              {searchResults.length === 0
                ? <div className="empty-state">Run a search to discover published content.</div>
                : searchResults.map((r, i) => (
                  <div key={i} className="search-result">
                    <h4>{r.title}</h4>
                    <p>{r.body}</p>
                    {r.score && <span className="similarity-badge">⬡ {(r.score * 100).toFixed(1)}% match</span>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ADMIN */}
          {tab === 'admin' && user.role === 'ADMIN' && (
            <div>
              <div className="page-header">
                <h2>Admin Panel</h2>
                <p>Full system access — manage content and users</p>
              </div>
              <div className="admin-banner">
                ⚠ You have ADMIN privileges. Actions here affect all users and content.
              </div>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value">{publishedContent.length}</div>
                  <div className="stat-label">Published</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{drafts.length}</div>
                  <div className="stat-label">Drafts</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">JWT</div>
                  <div className="stat-label">Auth Active</div>
                </div>
              </div>
              <div className="section-title">Content Management</div>
              {publishedContent.length === 0
                ? <div className="empty-state">No published content to manage.</div>
                : publishedContent.map((c, i) => (
                  <div key={i} className="admin-row">
                    <div>
                      <div className="admin-row-title">{c.title}</div>
                      <div className="admin-row-meta">Author #{c.authorId} · ID #{c.contentId}</div>
                    </div>
                    <button className="btn-delete" onClick={() => handleDeleteContent(c.contentId)}>Delete</button>
                  </div>
                ))
              }
            </div>
          )}

        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
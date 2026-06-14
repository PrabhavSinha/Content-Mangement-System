import React, { useState, useEffect } from 'react';

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

  const GATEWAY_URL = 'http://127.0.0.1:8000/gateway';

  // ─────────────────────────────────────────
  // JWT HELPERS
  // ─────────────────────────────────────────

  // Always attach JWT token to protected requests
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`
  });

  useEffect(() => {
    if (user) {
      fetchDrafts();
      fetchPublished();
    }
  }, [user]);

  // ─────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp ? 'signup' : 'login';

    const payload = isSignUp
      ? { username: username.trim(), email: email.trim().toLowerCase(), password, role }
      : { email: email.trim().toLowerCase(), password };

    try {
      const res = await fetch(`${GATEWAY_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.error || data.detail) {
        alert(data.error || data.detail);
      } else {
        if (!isSignUp) {
          // Store JWT token in user session state
          setUser({
            userId: data.userId,
            username: data.username || email.split('@')[0],
            role: data.role,
            token: data.token  // JWT token stored here
          });
          alert(`Welcome ${data.username}! Logged in as ${data.role}`);
        } else {
          alert("Registration successful! Please sign in.");
          setIsSignUp(false);
        }
      }
    } catch (err) {
      alert("Error: Unable to connect to Gateway.");
    }
  };

  // ─────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────

  const fetchDrafts = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/drafts`);
      const data = await res.json();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching drafts:", err);
    }
  };

  const fetchPublished = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/content`);
      const data = await res.json();
      setPublishedContent(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching published content:", err);
    }
  };

  // ─────────────────────────────────────────
  // CONTENT ACTIONS — JWT sent in headers
  // ─────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!title.trim() && !body.trim()) {
      alert("Cannot save an empty draft.");
      return;
    }
    try {
      const res = await fetch(`${GATEWAY_URL}/drafts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, body, authorId: user.userId })
      });
      const data = await res.json();
      if (data.error || data.detail) {
        alert(data.error || data.detail);
      } else {
        alert("Draft saved to PostgreSQL!");
        fetchDrafts();
      }
    } catch (err) {
      alert("Failed to save draft.");
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please provide both a title and body.");
      return;
    }
    try {
      const res = await fetch(`${GATEWAY_URL}/publish`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, body, authorId: user.userId })
      });
      const data = await res.json();
      if (data.error || data.detail) {
        alert(data.error || data.detail);
      } else {
        alert("Published! Synced across SQL and NoSQL layers.");
        setTitle('');
        setBody('');
        fetchPublished();
        fetchDrafts();
      }
    } catch (err) {
      alert("Failed to publish.");
    }
  };

  // ADMIN ONLY — delete published content
  const handleDeleteContent = async (contentId) => {
    if (user.role !== 'ADMIN') {
      alert("Forbidden: Only ADMIN can delete published content.");
      return;
    }
    try {
      const res = await fetch(`${GATEWAY_URL}/content/${contentId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.error || data.detail) {
        alert(data.error || data.detail);
      } else {
        alert("Content deleted by ADMIN.");
        fetchPublished();
      }
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${GATEWAY_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Search failed.");
    }
  };

  // ─────────────────────────────────────────
  // LOGIN / SIGNUP VIEW
  // ─────────────────────────────────────────

  if (!user) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#f3f4f6', fontFamily:'sans-serif' }}>
        <form onSubmit={handleAuth} style={{ padding:'2.5rem', backgroundColor:'#fff', borderRadius:'12px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', width:'340px' }}>
          <h2 style={{ marginBottom:'1.5rem', textAlign:'center', color:'#111827' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {isSignUp && (
            <>
              <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required
                style={{ width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ccc', borderRadius:'6px', boxSizing:'border-box' }} />

              {/* Role selector — visible on signup */}
              <select onChange={e => setRole(e.target.value)} value={role}
                style={{ width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ccc', borderRadius:'6px', boxSizing:'border-box', backgroundColor:'#fff' }}>
                <option value="USER">USER — Standard Access</option>
                <option value="ADMIN">ADMIN — Full Access</option>
              </select>
            </>
          )}

          <input type="email" placeholder="Email Address" onChange={e => setEmail(e.target.value)} required
            style={{ width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ccc', borderRadius:'6px', boxSizing:'border-box' }} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required
            style={{ width:'100%', padding:'0.75rem', marginBottom:'1.5rem', border:'1px solid #ccc', borderRadius:'6px', boxSizing:'border-box' }} />

          <button type="submit"
            style={{ width:'100%', padding:'0.75rem', backgroundColor:'#2563eb', color:'#fff', border:'none', borderRadius:'6px', fontWeight:'bold', cursor:'pointer' }}>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>

          <p onClick={() => { setIsSignUp(!isSignUp); setPassword(''); }}
            style={{ textAlign:'center', color:'#2563eb', cursor:'pointer', marginTop:'1rem', fontSize:'0.9rem' }}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </p>
        </form>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // MAIN DASHBOARD VIEW
  // ─────────────────────────────────────────

  return (
    <div style={{ fontFamily:'system-ui, sans-serif', backgroundColor:'#f9fafb', minHeight:'100vh', padding:'2rem' }}>
      <div style={{ maxWidth:'800px', margin:'0 auto', backgroundColor:'#ffffff', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)', padding:'2rem' }}>

        {/* Header */}
        <header style={{ borderBottom:'1px solid #e5e7eb', paddingBottom:'1rem', marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h1 style={{ fontSize:'1.4rem', fontWeight:'bold', margin:0, color:'#111827' }}>Content Studio Portal</h1>
            <small style={{ color:'#6b7280' }}>
              Session: <strong>{user.username}</strong> &nbsp;
              {/* Role badge */}
              <span style={{
                backgroundColor: user.role === 'ADMIN' ? '#dc2626' : '#2563eb',
                color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'bold'
              }}>
                {user.role}
              </span>
            </small>
          </div>
          <nav style={{ display:'flex', gap:'1rem' }}>
            <button onClick={() => setTab('editor')} style={{ background:'none', border:'none', fontWeight: tab==='editor' ? 'bold' : 'normal', color: tab==='editor' ? '#2563eb' : '#4b5563', cursor:'pointer' }}>Editor</button>
            <button onClick={() => setTab('feed')} style={{ background:'none', border:'none', fontWeight: tab==='feed' ? 'bold' : 'normal', color: tab==='feed' ? '#2563eb' : '#4b5563', cursor:'pointer' }}>Live Feed ({publishedContent.length})</button>
            <button onClick={() => setTab('search')} style={{ background:'none', border:'none', fontWeight: tab==='search' ? 'bold' : 'normal', color: tab==='search' ? '#2563eb' : '#4b5563', cursor:'pointer' }}>Discovery Index</button>
            {/* ADMIN Panel tab — only visible to ADMIN */}
            {user.role === 'ADMIN' && (
              <button onClick={() => setTab('admin')} style={{ background:'none', border:'none', fontWeight: tab==='admin' ? 'bold' : 'normal', color: tab==='admin' ? '#dc2626' : '#4b5563', cursor:'pointer' }}>Admin Panel</button>
            )}
            <button onClick={() => setUser(null)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontWeight:'500' }}>Logout</button>
          </nav>
        </header>

        {/* EDITOR TAB */}
        {tab === 'editor' && (
          <div>
            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
              style={{ width:'100%', padding:'0.75rem', fontSize:'1.25rem', marginBottom:'1rem', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box' }} />
            <textarea placeholder="Write your content here..." value={body} onChange={e => setBody(e.target.value)} rows={6}
              style={{ width:'100%', padding:'0.75rem', marginBottom:'1.5rem', border:'1px solid #d1d5db', borderRadius:'6px', boxSizing:'border-box', resize:'vertical' }} />

            <div style={{ display:'flex', gap:'1rem' }}>
              <button onClick={handleSaveDraft}
                style={{ backgroundColor:'#e5e7eb', color:'#374151', padding:'0.75rem 1.5rem', border:'none', borderRadius:'6px', fontWeight:'500', cursor:'pointer' }}>
                Save Draft
              </button>
              <button onClick={handlePublish}
                style={{ backgroundColor:'#2563eb', color:'#fff', padding:'0.75rem 1.5rem', border:'none', borderRadius:'6px', fontWeight:'500', cursor:'pointer' }}>
                Publish Content
              </button>
            </div>

            <h3 style={{ marginTop:'2.5rem', fontSize:'1.1rem', color:'#374151', borderBottom:'2px solid #f3f4f6', paddingBottom:'0.5rem' }}>
              Drafts Pool (PostgreSQL)
            </h3>
            {drafts.length === 0 ? (
              <p style={{ color:'#9ca3af', fontStyle:'italic' }}>No drafts saved yet.</p>
            ) : (
              drafts.map((d, idx) => (
                <div key={idx} onClick={() => { setTitle(d.title || ''); setBody(d.body || ''); }}
                  style={{ padding:'0.75rem', border:'1px solid #e5e7eb', borderRadius:'6px', marginBottom:'0.5rem', cursor:'pointer', backgroundColor:'#f9fafb' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='#f9fafb'}>
                  <strong style={{ color:'#1f2937' }}>{d.title || "(Untitled)"}</strong>
                  <span style={{ float:'right', fontSize:'0.75rem', color:'#9ca3af' }}>Draft ID: {d.draftId}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* LIVE FEED TAB */}
        {tab === 'feed' && (
          <div>
            <h2 style={{ fontSize:'1.25rem', marginBottom:'1.5rem', color:'#111827' }}>Live Published Articles</h2>
            {publishedContent.length === 0 ? (
              <p style={{ color:'#9ca3af', fontStyle:'italic' }}>No content published yet.</p>
            ) : (
              publishedContent.map((c, idx) => (
                <div key={idx} style={{ padding:'1.25rem', border:'1px solid #e5e7eb', borderRadius:'8px', marginBottom:'1rem', backgroundColor:'#fff' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <h3 style={{ margin:'0 0 0.5rem 0', color:'#1f2937' }}>{c.title}</h3>
                    {/* ADMIN delete button — only visible to ADMIN */}
                    {user.role === 'ADMIN' && (
                      <button onClick={() => handleDeleteContent(c.contentId)}
                        style={{ backgroundColor:'#dc2626', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', fontSize:'0.8rem' }}>
                        Delete
                      </button>
                    )}
                  </div>
                  <p style={{ margin:0, color:'#4b5563', lineHeight:'1.5' }}>{c.body}</p>
                  <small style={{ color:'#9ca3af' }}>
                    {c.publishedAt ? new Date(c.publishedAt).toLocaleString() : ''}
                  </small>
                </div>
              ))
            )}
          </div>
        )}

        {/* DISCOVERY / SEARCH TAB */}
        {tab === 'search' && (
          <div>
            <h2 style={{ fontSize:'1.25rem', marginBottom:'0.5rem', color:'#111827' }}>Intelligent Topic Discovery</h2>
            <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom:'1.5rem' }}>
              Semantic vector search powered by MongoDB embeddings + cosine similarity.
            </p>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
              <input type="text" placeholder='Try: "cloud computing", "AI topics", "databases"...'
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex:1, padding:'0.75rem', border:'1px solid #d1d5db', borderRadius:'6px' }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch}
                style={{ backgroundColor:'#10b981', color:'#fff', padding:'0.75rem 1.5rem', border:'none', borderRadius:'6px', fontWeight:'500', cursor:'pointer' }}>
                Search
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p style={{ color:'#9ca3af', fontStyle:'italic' }}>No results yet. Try a search above.</p>
            ) : (
              searchResults.map((r, idx) => (
                <div key={idx} style={{ padding:'1rem', borderLeft:'4px solid #10b981', backgroundColor:'#f0fdf4', marginBottom:'0.75rem', borderRadius:'0 8px 8px 0' }}>
                  <h4 style={{ margin:'0 0 0.25rem 0', color:'#065f46' }}>{r.title}</h4>
                  <p style={{ margin:0, color:'#047857', fontSize:'0.9rem' }}>{r.body}</p>
                  {r.score && <small style={{ color:'#34d399' }}>Similarity Score: {(r.score * 100).toFixed(1)}%</small>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ADMIN PANEL TAB — only accessible by ADMIN role */}
        {tab === 'admin' && user.role === 'ADMIN' && (
          <div>
            <h2 style={{ fontSize:'1.25rem', marginBottom:'1rem', color:'#dc2626' }}>Admin Control Panel</h2>
            <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'1rem', marginBottom:'1.5rem' }}>
              <p style={{ margin:0, color:'#991b1b', fontSize:'0.9rem' }}>
                ⚠️ You have ADMIN privileges. You can delete any content and view all users.
              </p>
            </div>

            <h3 style={{ color:'#374151', marginBottom:'1rem' }}>Published Content Management</h3>
            {publishedContent.length === 0 ? (
              <p style={{ color:'#9ca3af', fontStyle:'italic' }}>No published content.</p>
            ) : (
              publishedContent.map((c, idx) => (
                <div key={idx} style={{ padding:'1rem', border:'1px solid #e5e7eb', borderRadius:'8px', marginBottom:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <strong style={{ color:'#1f2937' }}>{c.title}</strong>
                    <small style={{ display:'block', color:'#6b7280' }}>Author ID: {c.authorId} | ID: {c.contentId}</small>
                  </div>
                  <button onClick={() => handleDeleteContent(c.contentId)}
                    style={{ backgroundColor:'#dc2626', color:'#fff', border:'none', borderRadius:'4px', padding:'6px 14px', cursor:'pointer' }}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

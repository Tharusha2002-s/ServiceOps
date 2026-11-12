'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';

interface KnowledgeViewProps {
  user: any;
  categories: any[];
  onStartTicket?: (prefillTitle?: string) => void;
}

export function KnowledgeView({ user, categories, onStartTicket }: KnowledgeViewProps) {
  const isStaff = user?.roles?.some((r: RoleName) =>
    [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR].includes(r),
  );

  const [articles, setArticles] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [artTitle, setArtTitle] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCatId, setArtCatId] = useState('');
  const [artStatus, setArtStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [artTags, setArtTags] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);
      const res = await api.get(`/knowledge?${params.toString()}`);
      setArticles(res.data?.data || []);
    } catch (err) {
      console.error('Failed loading knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchArticles();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  const handleOpenArticle = async (id: string) => {
    try {
      const res = await api.get(`/knowledge/${id}`);
      setActiveArticle(res.data?.data || null);
    } catch (err) {
      console.error('Error reading article:', err);
    }
  };

  const handleHelpful = async (id: string) => {
    try {
      const res = await api.post(`/knowledge/${id}/helpful`, {});
      const updatedCount = res.data?.data?.helpfulCount;
      setActiveArticle((prev: any) =>
        prev && prev.id === id ? { ...prev, helpfulCount: updatedCount } : prev,
      );
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, helpfulCount: updatedCount } : a)),
      );
    } catch (err) {
      console.error('Failed marking helpful:', err);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/knowledge', {
        title: artTitle,
        summary: artSummary || undefined,
        content: artContent,
        categoryId: artCatId || undefined,
        status: artStatus,
        tags: artTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setShowAuthorModal(false);
      setArtTitle('');
      setArtSummary('');
      setArtContent('');
      setArtTags('');
      await fetchArticles();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed saving article');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (article: any, nextStatus: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') => {
    try {
      await api.patch(`/knowledge/${article.id}`, { status: nextStatus });
      await fetchArticles();
      if (activeArticle?.id === article.id) {
        setActiveArticle({ ...activeArticle, status: nextStatus });
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed updating article status');
    }
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Knowledge Base &amp; Self-Service</div>
          <h1 className="page-title">Solve it before you file a ticket.</h1>
          <p className="page-sub">
            Published operational guides across IT systems. Articles also power live deflection suggestions inside New Request.
          </p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" type="button" onClick={() => setShowAuthorModal(true)}>
            + Write article
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
        <div className="field" style={{ maxWidth: 420, flex: '1 1 280px', marginBottom: 0 }}>
          <label htmlFor="kb-search">Search articles</label>
          <input
            id="kb-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try password, vpn, printer, dock..."
          />
        </div>
        <div className="filters" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="filter-pill"
            aria-pressed={selectedCategory === 'ALL'}
            onClick={() => setSelectedCategory('ALL')}
          >
            All topics
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="filter-pill"
              aria-pressed={selectedCategory === c.id}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading && articles.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--ink-muted)' }}>Searching knowledge base...</div>
        ) : articles.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-muted)' }}>
            No matching guides found.
          </div>
        ) : (
          articles.map((art) => (
            <article
              key={art.id}
              className="article"
              style={{ cursor: 'pointer' }}
              onClick={() => handleOpenArticle(art.id)}
            >
              <div>
                <strong>{art.title}</strong>
                <p className="hint" style={{ marginTop: 4 }}>
                  {art.category?.name || 'General'} · {art.readMinutes || 3} min read ·{' '}
                  {art.helpfulCount || 0} helpful votes
                  {art.summary ? ` — ${art.summary}` : ''}
                </p>
              </div>
              <span
                className={`pill ${
                  art.status === 'PUBLISHED'
                    ? 'ok'
                    : art.status === 'DRAFT'
                    ? 'pending'
                    : 'closed'
                }`}
              >
                {art.status === 'PUBLISHED' ? 'Published' : art.status === 'DRAFT' ? 'Draft' : 'Archived'}
              </span>
            </article>
          ))
        )}
      </div>

      {activeArticle && (
        <div className="modal-overlay open" onClick={() => setActiveArticle(null)}>
          <div className="modal-box stack" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <div>
                <div className="kicker">
                  {activeArticle.category?.name || 'IT Guide'} · {activeArticle.readMinutes} min read · {activeArticle.viewsCount} views
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: 22 }}>{activeArticle.title}</h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => setActiveArticle(null)}>
                ✕
              </button>
            </div>
            {activeArticle.summary && (
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{activeArticle.summary}</p>
            )}
            <div
              style={{
                background: 'var(--card-2)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: 16,
                whiteSpace: 'pre-line',
                lineHeight: 1.65,
                fontSize: 14,
              }}
            >
              {activeArticle.content}
            </div>
            <div className="row-between" style={{ paddingTop: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => handleHelpful(activeArticle.id)}
                >
                  👍 Helpful ({activeArticle.helpfulCount || 0})
                </button>
                {isStaff && activeArticle.status !== 'PUBLISHED' && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleTogglePublish(activeArticle, 'PUBLISHED')}
                  >
                    Publish article
                  </button>
                )}
                {isStaff && activeArticle.status === 'PUBLISHED' && (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => handleTogglePublish(activeArticle, 'ARCHIVED')}
                  >
                    Archive
                  </button>
                )}
              </div>
              {onStartTicket && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    const t = activeArticle.title;
                    setActiveArticle(null);
                    onStartTicket(t);
                  }}
                >
                  Still need help? File ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuthorModal && (
        <div className="modal-overlay open" onClick={() => setShowAuthorModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Author Knowledge Article</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setShowAuthorModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateArticle} className="stack">
              <div className="field">
                <label>Article title</label>
                <input required value={artTitle} onChange={(e) => setArtTitle(e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Category</label>
                  <select value={artCatId} onChange={(e) => setArtCatId(e.target.value)}>
                    <option value="">General</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={artStatus} onChange={(e) => setArtStatus(e.target.value as any)}>
                    <option value="PUBLISHED">Published (Visible to all)</option>
                    <option value="DRAFT">Draft (IT Staff only)</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Short summary</label>
                <input value={artSummary} onChange={(e) => setArtSummary(e.target.value)} />
              </div>
              <div className="field">
                <label>Resolution steps / Content</label>
                <textarea required rows={5} value={artContent} onChange={(e) => setArtContent(e.target.value)} />
              </div>
              <div className="field">
                <label>Search tags (comma separated)</label>
                <input value={artTags} onChange={(e) => setArtTags(e.target.value)} placeholder="vpn, password, printer" />
              </div>
              <div className="row-between" style={{ marginTop: 6 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setShowAuthorModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


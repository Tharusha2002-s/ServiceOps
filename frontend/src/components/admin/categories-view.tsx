'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CategoriesViewProps {
  onCategoriesUpdated?: () => Promise<void> | void;
}

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL_P1', label: 'Critical (P1)' },
  { value: 'HIGH_P2', label: 'High (P2)' },
  { value: 'MEDIUM_P3', label: 'Medium (P3)' },
  { value: 'LOW_P4', label: 'Low (P4)' },
];

export function CategoriesView({ onCategoriesUpdated }: CategoriesViewProps) {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [icon, setIcon] = useState('📁');
  const [description, setDescription] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('MEDIUM_P3');
  const [subcatText, setSubcatText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories?includeInactive=true');
      setCats(res.data?.data || []);
    } catch (err) {
      console.error('Failed loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openNewModal = () => {
    setEditingCat(null);
    setName('');
    setCode('');
    setIcon('📁');
    setDescription('');
    setDefaultPriority('MEDIUM_P3');
    setSubcatText('');
    setModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCat(c);
    setName(c.name);
    setCode(c.code);
    setIcon(c.icon || '📁');
    setDescription(c.description || '');
    setDefaultPriority(c.defaultPriority || 'MEDIUM_P3');
    setSubcatText((c.subcategories || []).join(', '));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const subcategories = subcatText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingCat) {
        await api.patch(`/categories/${editingCat.id}`, {
          name,
          description,
          icon,
          defaultPriority,
          subcategories,
        });
      } else {
        await api.post('/categories', {
          name,
          code: code.toUpperCase().trim(),
          description,
          icon,
          defaultPriority,
          subcategories,
        });
      }
      setModalOpen(false);
      await loadCategories();
      if (onCategoriesUpdated) await onCategoriesUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: any) => {
    try {
      await api.patch(`/categories/${c.id}`, { isActive: !c.isActive });
      await loadCategories();
      if (onCategoriesUpdated) await onCategoriesUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update category state');
    }
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Service Catalog Administration</div>
          <h1 className="page-title">Ticket categories &amp; service lines</h1>
          <p className="page-sub">
            Configure category definitions and subcategory taxonomies. Retiring a category preserves existing ticket records.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openNewModal}>
          + Add category
        </button>
      </div>

      {loading && cats.length === 0 ? (
        <div className="card">Loading service catalog...</div>
      ) : (
        <div className="cats" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {cats.map((c) => (
            <article key={c.id} className="card" style={{ opacity: c.isActive ? 1 : 0.72 }}>
              <div className="row-between">
                <h3 style={{ margin: 0 }}>
                  {c.icon || '📁'} {c.name}{' '}
                  <span className="mono hint" style={{ fontSize: 11 }}>({c.code})</span>
                </h3>
                <span className={`pill ${c.isActive ? 'ok' : 'closed'}`}>
                  {c.isActive ? 'Active' : 'Retired'}
                </span>
              </div>
              <p className="hint" style={{ margin: '6px 0 10px' }}>
                {c.description || 'Enterprise IT support category'}
              </p>
              <div className="subcat-chips">
                {(c.subcategories || []).length > 0 ? (
                  c.subcategories.map((sub: string) => (
                    <span key={sub} className="subcat-chip">
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="hint" style={{ fontSize: 11 }}>No subcategories defined</span>
                )}
              </div>
              <div
                className="row-between"
                style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}
              >
                <span className="mono" style={{ fontSize: 12 }}>
                  Default SLA: {c.defaultPriority?.replace('_', ' ')} · {c._count?.tickets ?? 0} tickets
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    style={{ padding: '3px 8px', fontSize: 11 }}
                    onClick={() => openEditModal(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    style={{ padding: '3px 8px', fontSize: 11 }}
                    onClick={() => handleToggleActive(c)}
                  >
                    {c.isActive ? 'Retire' : 'Activate'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>
                {editingCat ? `Edit Category (${editingCat.code})` : 'Create Service Category'}
              </h3>
              <button className="btn btn-ghost" type="button" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="stack">
              <div className="grid-2">
                <div className="field">
                  <label>Category name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Short code</label>
                  <input
                    required
                    disabled={!!editingCat}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FAC"
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Default SLA priority</label>
                  <select value={defaultPriority} onChange={(e) => setDefaultPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Icon emoji</label>
                  <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="field">
                <label>Subcategories (comma separated)</label>
                <input
                  value={subcatText}
                  onChange={(e) => setSubcatText(e.target.value)}
                  placeholder="USB-C Dock, Laptop Charger, Monitor"
                />
              </div>
              <div className="row-between" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


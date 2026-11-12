'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { RoleName } from '@/types/auth';

interface AssetsViewProps {
  user: any;
  usersList: any[];
  onOpenTicket: (ticketNumber: string) => void;
}

const ASSET_TYPES = ['LAPTOP', 'DESKTOP', 'DOCK', 'MONITOR', 'PRINTER', 'NETWORK', 'LICENSE', 'OTHER'];
const ASSET_STATUSES = ['IN_SERVICE', 'IN_REPAIR', 'FAILED', 'SPARE', 'RETIRED'];

export function AssetsView({ user, usersList, onOpenTicket }: AssetsViewProps) {
  const canManage =
    user?.roles?.includes(RoleName.IT_MANAGER) ||
    user?.roles?.includes(RoleName.SYSTEM_ADMINISTRATOR);

  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [assetTag, setAssetTag] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('LAPTOP');
  const [status, setStatus] = useState('IN_SERVICE');
  const [location, setLocation] = useState('Colombo HQ');
  const [assignedToId, setAssignedToId] = useState('');
  const [warrantyUntil, setWarrantyUntil] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (search.trim()) q.set('search', search.trim());
      const res = await api.get(`/assets?${q.toString()}`);
      setAssets(res.data?.data || []);
    } catch (err) {
      console.error('Failed loading CMDB assets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const openCreateModal = () => {
    setEditing(null);
    setAssetTag('');
    setName('');
    setAssetType('LAPTOP');
    setStatus('IN_SERVICE');
    setLocation('Colombo HQ');
    setAssignedToId('');
    setWarrantyUntil('');
    setShowModal(true);
  };

  const openEditModal = (a: any) => {
    setEditing(a);
    setAssetTag(a.assetTag);
    setName(a.name);
    setAssetType(a.assetType || 'LAPTOP');
    setStatus(a.status || 'IN_SERVICE');
    setLocation(a.location || '');
    setAssignedToId(a.assignedToId || '');
    setWarrantyUntil(a.warrantyUntil ? a.warrantyUntil.slice(0, 10) : '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name,
        assetType,
        status,
        location: location || undefined,
        assignedToId: assignedToId || null,
        warrantyUntil: warrantyUntil ? new Date(warrantyUntil).toISOString() : null,
      };
      if (editing) {
        await api.patch(`/assets/${editing.id}`, payload);
      } else {
        await api.post('/assets', {
          ...payload,
          assetTag: assetTag.toUpperCase().trim(),
        });
      }
      setShowModal(false);
      await loadAssets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed saving asset record');
    } finally {
      setSaving(false);
    }
  };

  const getStatusPill = (st: string) => {
    if (st === 'IN_SERVICE') return <span className="pill ok">In service</span>;
    if (st === 'IN_REPAIR') return <span className="pill progress">In repair</span>;
    if (st === 'FAILED') return <span className="pill breach">Failed</span>;
    if (st === 'SPARE') return <span className="pill open">Spare</span>;
    return <span className="pill closed">Retired</span>;
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">IT Asset &amp; Equipment CMDB</div>
          <h1 className="page-title">Equipment tied to the person and the ticket.</h1>
          <p className="page-sub">
            Track laptops, docks, shared office printers, and warranty coverage linked directly to incoming support tickets.
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            + Register asset
          </button>
        )}
      </div>

      <div className="filters" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', ...ASSET_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              className="filter-pill"
              aria-pressed={statusFilter === st}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'ALL' ? 'All hardware' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search asset tag, model, location..."
          style={{ width: 240, height: 34, padding: '6px 10px', borderRadius: 8 }}
        />
      </div>

      <div className="card" style={{ padding: '8px 8px 0' }}>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Holder</th>
              <th>Status</th>
              <th>Warranty</th>
              <th>Open tickets</th>
              {canManage && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="mono">{a.assetTag}</div>
                  <div>{a.name}</div>
                  {a.location && <div className="hint">{a.location}</div>}
                </td>
                <td>
                  {a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : 'Shared / Pool'}
                </td>
                <td>{getStatusPill(a.status)}</td>
                <td className="mono">
                  {a.warrantyUntil
                    ? new Date(a.warrantyUntil).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td>
                  {a.tickets && a.tickets.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.tickets.map((t: any) => (
                        <button
                          key={t.id}
                          type="button"
                          className="btn btn-ghost mono"
                          style={{ padding: '2px 7px', fontSize: 11 }}
                          onClick={() => onOpenTicket(t.ticketNumber)}
                        >
                          {t.ticketNumber}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="mono hint">—</span>
                  )}
                </td>
                {canManage && (
                  <td>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => openEditModal(a)}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!loading && assets.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>
                  No assets match this query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{editing ? `Edit ${editing.assetTag}` : 'Register IT Asset'}</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="stack">
              <div className="grid-2">
                <div className="field">
                  <label>Asset Tag</label>
                  <input
                    required
                    disabled={!!editing}
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                    placeholder="LAT-5440-22"
                  />
                </div>
                <div className="field">
                  <label>Model / Name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Asset Type</label>
                  <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {ASSET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="field">
                  <label>Assigned holder</label>
                  <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                    <option value="">Shared / Office Pool</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Warranty expiration date</label>
                <input type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
              </div>
              <div className="row-between" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}


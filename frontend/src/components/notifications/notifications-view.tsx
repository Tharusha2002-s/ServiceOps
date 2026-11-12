'use client';

import React, { useState } from 'react';

export interface DeliveryRecord {
  id: string;
  channel: 'IN_APP' | 'EMAIL';
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  sentAt?: string | null;
  lastError?: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: 'TICKET' | 'INCIDENT' | string | null;
  entityId?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  deliveries?: DeliveryRecord[];
}

interface NotificationsViewProps {
  notifications: NotificationItem[];
  unreadCount: number;
  wsConnected: boolean;
  onMarkRead: (id: string) => Promise<void> | void;
  onMarkAllRead: () => Promise<void> | void;
  onOpenEntity: (entityType?: string | null, entityId?: string | null) => void;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} d`;
}

export function NotificationsView({
  notifications,
  unreadCount,
  wsConnected,
  onMarkRead,
  onMarkAllRead,
  onOpenEntity,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const visible =
    filter === 'UNREAD'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setBusyId(item.id);
      try {
        await onMarkRead(item.id);
      } finally {
        setBusyId(null);
      }
    }
    if (item.entityType && item.entityId) {
      onOpenEntity(item.entityType, item.entityId);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Inbox · {wsConnected ? 'WebSocket Live' : 'HTTP Sync'}</div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            In-app items for your account. Email uses the same events, with delivery retried outside the request.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={unreadCount === 0 || markingAll}
            onClick={handleMarkAll}
          >
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: 14 }}>
        <button
          className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
          type="button"
          onClick={() => setFilter('ALL')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`filter-pill ${filter === 'UNREAD' ? 'active' : ''}`}
          type="button"
          onClick={() => setFilter('UNREAD')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="card">
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--ink-muted)' }}>
            {filter === 'UNREAD' ? 'You are all caught up — no unread notifications.' : 'No notifications yet.'}
          </div>
        ) : (
          visible.map((n) => {
            const emailDelivery = n.deliveries?.find((d) => d.channel === 'EMAIL');
            return (
              <article
                key={n.id}
                className={`inbox-item ${n.isRead ? 'read' : ''}`}
                style={{ cursor: n.entityId || !n.isRead ? 'pointer' : 'default' }}
                onClick={() => handleItemClick(n)}
              >
                <span className="dot" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{n.title}</strong>
                    {emailDelivery && (
                      <span
                        className={`pill ${emailDelivery.status === 'SENT' ? 'resolved' : emailDelivery.status === 'FAILED' ? 'critical' : 'pending'}`}
                        style={{ fontSize: 10, padding: '1px 7px' }}
                      >
                        Email: {emailDelivery.status}
                      </span>
                    )}
                    {busyId === n.id && <span className="hint">Updating...</span>}
                  </div>
                  <p className="hint" style={{ marginTop: 4 }}>{n.message}</p>
                </div>
                <time className="hint" title={new Date(n.createdAt).toLocaleString()}>
                  {formatRelativeTime(n.createdAt)}
                </time>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}


'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleName, TicketStatus, TicketPriority } from '@/types/auth';
import { api } from '@/lib/api';
import { SlaManagementView } from '@/components/sla/sla-management-view';
import { AgentWorkspace } from '@/components/agent/agent-workspace';
import { DispatchDesk } from '@/components/manager/dispatch-desk';
import { IncidentsView } from '@/components/incidents/incidents-view';
import { ReportsView } from '@/components/reports/reports-view';
import { AdminPeopleView } from '@/components/admin/admin-people-view';
import { CategoriesView } from '@/components/admin/categories-view';
import { AuditView } from '@/components/admin/audit-view';
import { SettingsView } from '@/components/admin/settings-view';
import { KnowledgeView } from '@/components/knowledge/knowledge-view';
import { AssetsView } from '@/components/assets/assets-view';
import {
  NotificationsView,
  NotificationItem,
} from '@/components/notifications/notifications-view';

export default function DashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const primaryRole = user?.roles[0] || RoleName.EMPLOYEE;

  // View state: 'home' | 'desk' | 'assignment' | 'incidents' | 'notifications' | 'requests' | 'new' | 'ticket' | 'users' | 'sla'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicketNumber, setSelectedTicketNumber] = useState<string>('TKT-1042');
  const [selectedIncidentNumber, setSelectedIncidentNumber] = useState<string | null>(null);
  const [activeOutage, setActiveOutage] = useState<any | null>(null);
  const [showOutageModal, setShowOutageModal] = useState<boolean>(false);

  // Data states
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Module 3: SLA Engine & Escalation States
  const [slaPolicies, setSlaPolicies] = useState<any[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<any | null>(null);
  const [breachedTickets, setBreachedTickets] = useState<any[]>([]);

  // Module 5: Real-Time Notifications & WebSocket States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string } | null>(null);
  const activeTabRef = useRef(activeTab);
  const selectedTktRef = useRef(selectedTicketNumber);

  useEffect(() => {
    activeTabRef.current = activeTab;
    selectedTktRef.current = selectedTicketNumber;
  }, [activeTab, selectedTicketNumber]);

  // New Request Form State
  const [formCategory, setFormCategory] = useState('HW');
  const [formSubject, setFormSubject] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUrgency, setFormUrgency] = useState('HIGH');
  const [formImpact, setFormImpact] = useState('USER');
  const [formAssetId, setFormAssetId] = useState('');
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [deflectionMatches, setDeflectionMatches] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Requests Filter & Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('ALL');
  const [reqCategoryFilter, setReqCategoryFilter] = useState<string>('ALL');
  const [reqSearch, setReqSearch] = useState<string>('');

  // Ticket Detail Interaction State
  const [ticketPane, setTicketPane] = useState<'talk' | 'audit'>('talk');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('Issue verified and resolved.');

  // Comment composer state
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Fetch active major outage broadcast
  const fetchActiveOutage = useCallback(async () => {
    try {
      const res = await api.get('/incidents/active-outage');
      setActiveOutage(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching active outage:', err);
    }
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, []);

  // Fetch SLA Policies, Metrics, Breaches
  const fetchSlaData = useCallback(async () => {
    try {
      const pRes = await api.get('/sla/policies');
      setSlaPolicies(pRes.data?.data || []);
      if (
        user?.roles.includes(RoleName.IT_MANAGER) ||
        user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
        user?.roles.includes(RoleName.IT_SUPPORT_AGENT)
      ) {
        const bRes = await api.get('/sla/breaches');
        setBreachedTickets(bRes.data?.data || []);
      }
      if (
        user?.roles.includes(RoleName.IT_MANAGER) ||
        user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR)
      ) {
        const mRes = await api.get('/sla/metrics');
        setSlaMetrics(mRes.data?.data || null);
      }
    } catch (err) {
      console.error('Error fetching SLA data:', err);
    }
  }, [user]);

  // Fetch single ticket details
  const fetchTicketDetails = useCallback(async (tktNum: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/${tktNum}`);
      setSelectedTicket(res.data?.data || null);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch in-app notifications & unread badge
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      const data = res.data?.data;
      setNotifications(data?.notifications || []);
      setUnreadNotifCount(data?.unreadCount ?? 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTickets();
    fetchSlaData();
    fetchActiveOutage();
    fetchNotifications();
    api.get('/tickets/categories').then((res) => setCategories(res.data?.data || []));
    api.get('/assets/my').then((res) => setMyAssets(res.data?.data || [])).catch(() => {});

    if (
      user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
      user?.roles.includes(RoleName.IT_MANAGER)
    ) {
      api.get('/users').then((res) => setUsersList(res.data?.data || []));
    }
  }, [user, fetchTickets, fetchSlaData, fetchActiveOutage, fetchNotifications]);

  // Live Knowledge Base ticket deflection while drafting a new request
  useEffect(() => {
    if (activeTab !== 'new' || formSubject.trim().length < 3) {
      setDeflectionMatches([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/knowledge?q=${encodeURIComponent(formSubject.trim())}&limit=3`)
        .then((res) => setDeflectionMatches(res.data?.data || []))
        .catch(() => setDeflectionMatches([]));
    }, 220);
    return () => clearTimeout(timer);
  }, [activeTab, formSubject]);

  // Authenticated Socket.IO real-time listener
  useEffect(() => {
    if (!accessToken) return;

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
        : 'http://127.0.0.1:4000');

    const socket: Socket = io(wsUrl, {
      auth: { token: accessToken },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('notification:new', (payload: { notification?: NotificationItem }) => {
      const incoming = payload?.notification;
      if (!incoming) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 50);
      });
      setUnreadNotifCount((c) => c + 1);
      setLiveToast({ title: incoming.title, message: incoming.message });
      setTimeout(() => {
        setLiveToast((curr) => (curr?.title === incoming.title ? null : curr));
      }, 5000);
      void fetchTickets();
    });

    socket.on('ticket:updated', () => {
      void fetchTickets();
      if (activeTabRef.current === 'ticket' && selectedTktRef.current) {
        void fetchTicketDetails(selectedTktRef.current);
      }
    });

    socket.on('outage:updated', () => {
      void fetchActiveOutage();
    });

    socket.on('sla:alert', () => {
      void fetchSlaData();
      void fetchTickets();
    });

    return () => {
      setWsConnected(false);
      socket.disconnect();
    };
  }, [accessToken, fetchTickets, fetchTicketDetails, fetchActiveOutage, fetchSlaData]);

  // When switching to ticket view or changing selected ticket
  useEffect(() => {
    if (activeTab === 'ticket' && selectedTicketNumber) {
      fetchTicketDetails(selectedTicketNumber);
    }
  }, [activeTab, selectedTicketNumber, fetchTicketDetails]);

  // Handle New Ticket Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject || !formDesc) return;

    setSubmitting(true);
    try {
      const res = await api.post('/tickets', {
        title: formSubject,
        description: formDesc,
        categoryCode: formCategory,
        urgency: formUrgency,
        impact: formImpact,
        ...(formAssetId ? { assetId: formAssetId } : {}),
      });

      const newTkt = res.data?.data;

      if (pendingFiles.length > 0 && newTkt?.id) {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append('files', f));
        try {
          await api.post(`/tickets/${newTkt.id}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr: any) {
          alert(
            uploadErr?.response?.data?.message ||
              `Ticket ${newTkt.ticketNumber} created, but an attachment failed validation.`,
          );
        }
      }

      setFeedbackMsg(`Ticket ${newTkt.ticketNumber} created successfully!`);
      await fetchTickets();
      setSelectedTicketNumber(newTkt.ticketNumber);
      setTicketPane('talk');
      setActiveTab('ticket');
      setFormSubject('');
      setFormDesc('');
      setFormAssetId('');
      setPendingFiles([]);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList) return;
    const selected = Array.from(fileList).slice(0, 3);
    setPendingFiles((prev) => [...prev, ...selected].slice(0, 3));
  };

  const handleUploadTicketFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !selectedTicket) return;
    setUploadingFiles(true);
    try {
      const fd = new FormData();
      Array.from(fileList)
        .slice(0, 3)
        .forEach((f) => fd.append('files', f));
      await api.post(`/tickets/${selectedTicket.id}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchTicketDetails(selectedTicket.ticketNumber);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.get(
        `/tickets/${selectedTicket.id}/attachments/${attachmentId}/download`,
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to download attachment');
    }
  };

  // Handle Posting a Comment or Internal Note
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setPostingComment(true);
    try {
      await api.post(`/tickets/${selectedTicket.id}/comments`, {
        content: replyText,
        type: isInternalNote ? 'INTERNAL_NOTE' : 'PUBLIC',
      });
      setReplyText('');
      setIsInternalNote(false);
      await fetchTicketDetails(selectedTicket.ticketNumber);
      await fetchTickets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (newStatus: string, summary?: string) => {
    if (!selectedTicket) return;
    try {
      await api.patch(`/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
        resolutionSummary: summary,
      });
      await fetchTicketDetails(selectedTicket.ticketNumber);
      await fetchTickets();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const openTicketView = (tktNum: string) => {
    setSelectedTicketNumber(tktNum);
    setTicketPane('talk');
    setShowResolveBox(false);
    setActiveTab('ticket');
  };

  const openIncidentView = (incNum?: string) => {
    setSelectedIncidentNumber(incNum || null);
    setActiveTab('incidents');
  };

  const handleMarkNotifRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadNotifCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllNotifsRead = async () => {
    await api.patch('/notifications/read-all', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifCount(0);
  };

  const handleOpenNotificationEntity = (entityType?: string | null, entityId?: string | null) => {
    if (!entityType || !entityId) return;
    if (entityType === 'TICKET') {
      const match = tickets.find((t) => t.id === entityId);
      openTicketView(match?.ticketNumber || entityId);
    } else if (entityType === 'INCIDENT') {
      if (primaryRole === RoleName.EMPLOYEE) {
        setShowOutageModal(true);
      } else {
        openIncidentView(entityId);
      }
    }
  };

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'P'}`;
  const roleDisplay = primaryRole.replace(/_/g, ' ');

  const getPriorityPill = (pri: string) => {
    if (pri?.includes('P1') || pri === 'Critical') return <span className="pill critical">Critical</span>;
    if (pri?.includes('P2') || pri === 'High') return <span className="pill high">High</span>;
    if (pri?.includes('P3') || pri === 'Medium') return <span className="pill medium">Medium</span>;
    return <span className="pill low">Low</span>;
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill progress">In progress</span>;
      case 'PENDING_CUSTOMER':
        return <span className="pill pending">Pending</span>;
      case 'RESOLVED':
        return <span className="pill resolved">Resolved</span>;
      case 'CLOSED':
        return <span className="pill closed">Closed</span>;
      case 'NEW':
      default:
        return <span className="pill open">New / Open</span>;
    }
  };

  const getTicketSlaPill = (t: any) => {
    if (t?.status === 'RESOLVED' || t?.status === 'CLOSED') {
      const isMet = t?.slaSnapshot?.isResolutionMet ?? true;
      return isMet ? <span className="pill ok">Met ✓</span> : <span className="pill breach">Breached</span>;
    }
    if (t?.status === 'PENDING_CUSTOMER' || t?.slaSnapshot?.status === 'PAUSED') {
      const pausedMins = t?.slaSnapshot?.totalPausedMinutes || 0;
      return <span className="pill pause">⏸ Paused {pausedMins > 0 ? `(${pausedMins}m)` : ''}</span>;
    }
    if (!t?.resolutionDueAt) return <span className="pill ok">On Track</span>;
    const now = new Date().getTime();
    const due = new Date(t.resolutionDueAt).getTime();
    if (now > due) {
      const diffMins = Math.floor((now - due) / 60000);
      const diffStr = diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`;
      return <span className="pill breach">Breached {diffStr}</span>;
    }
    const leftMins = Math.floor((due - now) / 60000);
    if (leftMins <= 120) {
      return <span className="pill risk">At Risk ({leftMins}m left)</span>;
    }
    return <span className="pill ok">On Track</span>;
  };

  const getSlaTrackClass = (t: any) => {
    if (t?.status === 'RESOLVED' || t?.status === 'CLOSED') {
      return t?.slaSnapshot?.isResolutionMet ? '' : 'breach';
    }
    if (!t?.resolutionDueAt) return '';
    const now = new Date().getTime();
    const due = new Date(t.resolutionDueAt).getTime();
    if (now > due) return 'breach';
    const created = new Date(t.createdAt).getTime();
    const total = due - created;
    const elapsed = now - created;
    if (total > 0 && elapsed / total >= 0.75) return 'risk';
    return '';
  };

  const getSlaTrackPercent = (t: any) => {
    if (t?.status === 'RESOLVED' || t?.status === 'CLOSED') return 100;
    if (!t?.resolutionDueAt) return 50;
    const now = new Date().getTime();
    const due = new Date(t.resolutionDueAt).getTime();
    const created = new Date(t.createdAt).getTime();
    const total = due - created;
    const elapsed = now - created;
    if (elapsed >= total) return 100;
    return Math.min(100, Math.max(10, Math.round((elapsed / total) * 100)));
  };

  return (
    <ProtectedRoute>
      <div id="app" className="screen is-on" data-screen="app">
        {/* Left Navigation Rail */}
        <aside className="rail">
          <div className="rail-brand">
            <span className="mark">
              <i></i>
            </span>
            <div>
              <strong>ServiceOps</strong>
              <span>Northwind Internal IT</span>
            </div>
          </div>

          <nav id="nav" aria-label="Primary">
            <button
              type="button"
              aria-current={activeTab === 'home' && primaryRole !== RoleName.IT_SUPPORT_AGENT ? 'page' : undefined}
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
            {(primaryRole === RoleName.IT_SUPPORT_AGENT ||
              primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'desk' || (activeTab === 'home' && primaryRole === RoleName.IT_SUPPORT_AGENT) ? 'page' : undefined}
                onClick={() => setActiveTab('desk')}
              >
                Agent Desk ({tickets.filter((t) => t.assigneeId === user?.id || t.assignee?.id === user?.id).length})
              </button>
            )}
            <button
              type="button"
              aria-current={activeTab === 'requests' ? 'page' : undefined}
              onClick={() => setActiveTab('requests')}
            >
              {primaryRole === RoleName.EMPLOYEE ? `My Requests (${tickets.length})` : `All Tickets (${tickets.length})`}
            </button>
            <button
              type="button"
              aria-current={activeTab === 'new' ? 'page' : undefined}
              onClick={() => setActiveTab('new')}
            >
              + New Request
            </button>
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR ||
              primaryRole === RoleName.IT_SUPPORT_AGENT) && (
              <button
                type="button"
                aria-current={activeTab === 'incidents' ? 'page' : undefined}
                onClick={() => openIncidentView()}
              >
                Incidents {activeOutage ? '· 1 Active' : ''}
              </button>
            )}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR ||
              primaryRole === RoleName.IT_SUPPORT_AGENT) && (
              <button
                type="button"
                aria-current={activeTab === 'sla' ? 'page' : undefined}
                onClick={() => {
                  setActiveTab('sla');
                  fetchSlaData();
                }}
              >
                SLA Policies {breachedTickets.length > 0 && `(${breachedTickets.length})`}
              </button>
            )}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'assignment' ? 'page' : undefined}
                onClick={() => setActiveTab('assignment')}
              >
                Assignment Desk ({tickets.filter((t) => !t.assigneeId && !t.assignee && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length})
              </button>
            )}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'reports' ? 'page' : undefined}
                onClick={() => setActiveTab('reports')}
              >
                Reports &amp; Analytics
              </button>
            )}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'users' ? 'page' : undefined}
                onClick={() => setActiveTab('users')}
              >
                {primaryRole === RoleName.SYSTEM_ADMINISTRATOR ? 'People & Roles' : 'Enterprise Directory'}
              </button>
            )}
            {primaryRole === RoleName.SYSTEM_ADMINISTRATOR && (
              <button
                type="button"
                aria-current={activeTab === 'categories' ? 'page' : undefined}
                onClick={() => setActiveTab('categories')}
              >
                Categories
              </button>
            )}
            {(primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'audit' ? 'page' : undefined}
                onClick={() => setActiveTab('audit')}
              >
                Audit Trail
              </button>
            )}
            {primaryRole === RoleName.SYSTEM_ADMINISTRATOR && (
              <button
                type="button"
                aria-current={activeTab === 'settings' ? 'page' : undefined}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            )}
            <button
              type="button"
              aria-current={activeTab === 'knowledge' ? 'page' : undefined}
              onClick={() => setActiveTab('knowledge')}
            >
              Knowledge Base
            </button>
            {(primaryRole === RoleName.IT_SUPPORT_AGENT ||
              primaryRole === RoleName.IT_MANAGER ||
              primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
              <button
                type="button"
                aria-current={activeTab === 'assets' ? 'page' : undefined}
                onClick={() => setActiveTab('assets')}
              >
                IT Assets CMDB
              </button>
            )}
          </nav>

          {/* User Profile in Rail */}
          <div className="who">
            <div className="avatar" id="avatar">
              {initials}
            </div>
            <div>
              <strong id="who-name">
                {user?.firstName} {user?.lastName}
              </strong>
              <small id="who-role">
                {roleDisplay} · {user?.department || 'Operations'}
              </small>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="workspace">
          {/* Top Sticky Header */}
          <header className="top">
            <div className="search">
              <input
                id="q"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search tickets, incidents, people, assets..."
              />
              {globalSearch.trim().length > 0 && (
                <div className="search-pop" role="listbox" style={{ display: 'block' }}>
                  {tickets
                    .filter(
                      (t) =>
                        t.ticketNumber?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                        t.title?.toLowerCase().includes(globalSearch.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setGlobalSearch('');
                          openTicketView(t.ticketNumber);
                        }}
                      >
                        <span>
                          <b className="mono">{t.ticketNumber}</b> {t.title}
                        </span>
                        <span className="hint">{t.status}</span>
                      </button>
                    ))}
                  {activeOutage &&
                    (activeOutage.incidentNumber?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                      activeOutage.title?.toLowerCase().includes(globalSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalSearch('');
                          if (primaryRole === RoleName.EMPLOYEE) setShowOutageModal(true);
                          else openIncidentView(activeOutage.incidentNumber);
                        }}
                      >
                        <span>
                          <b className="mono">{activeOutage.incidentNumber}</b> {activeOutage.title}
                        </span>
                        <span className="hint">Incident</span>
                      </button>
                    )}
                </div>
              )}
            </div>

            <div className="top-meta">
              <span className="live">
                <i></i> {wsConnected ? 'Desk live' : 'Sync active'}
              </span>
              <span>Colombo Office · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <button
                className="icon-btn"
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  void fetchNotifications();
                  setActiveTab('notifications');
                }}
              >
                Inbox {unreadNotifCount > 0 && <span className="badge">{unreadNotifCount}</span>}
              </button>
              <button className="icon-btn" type="button" id="signout" onClick={() => logout()}>
                Sign out
              </button>
            </div>
          </header>

          {liveToast && (
            <div
              className="banner"
              style={{
                margin: '12px 28px 0',
                cursor: 'pointer',
              }}
              onClick={() => {
                setLiveToast(null);
                setActiveTab('notifications');
              }}
            >
              <div>
                <strong>{liveToast.title}</strong>
                <span> — {liveToast.message}</span>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLiveToast(null);
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          <main>
            {/* VIEW: AGENT WORKSPACE (FOR IT SUPPORT AGENT OR DESK TAB) */}
            {(activeTab === 'desk' || (activeTab === 'home' && primaryRole === RoleName.IT_SUPPORT_AGENT)) && (
              <AgentWorkspace
                user={user}
                tickets={tickets}
                activeOutage={activeOutage}
                onRefresh={fetchTickets}
                onOpenTicket={(tktNum) => openTicketView(tktNum)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenIncident={(incNum) => openIncidentView(incNum)}
              />
            )}

            {/* VIEW 1: HOME DASHBOARD (EMPLOYEE / GENERAL) */}
            {activeTab === 'home' && primaryRole !== RoleName.IT_SUPPORT_AGENT && (() => {
              const resolvedTicketToConfirm = tickets.find((t) => t.status === 'RESOLVED');
              return (
              <section className="view">
                {/* Outage Notice */}
                {activeOutage && (
                  <div className="outage-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="outage-icon">⚠️</div>
                      <div>
                        <strong style={{ color: 'var(--amber)', fontSize: 14 }}>
                          Active Service Notice: {activeOutage.title} ({activeOutage.incidentNumber})
                        </strong>
                        <div className="hint" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
                          {activeOutage.updates?.[0]?.message || activeOutage.description}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        if (primaryRole === RoleName.EMPLOYEE) {
                          setShowOutageModal(true);
                        } else {
                          openIncidentView(activeOutage.incidentNumber);
                        }
                      }}
                      style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '6px 14px', borderColor: '#d0b57e' }}
                    >
                      {primaryRole === RoleName.EMPLOYEE ? 'View incident update' : 'Incident command room'}
                    </button>
                  </div>
                )}

                {/* Action Required Card */}
                {resolvedTicketToConfirm && (
                  <div className="action-card" id="home-action-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="badge-icon">✓</div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            color: 'var(--copper)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          Action Required · Confirm Resolution
                        </div>
                        <strong style={{ fontSize: 15, display: 'block', marginTop: 2 }}>
                          {resolvedTicketToConfirm.ticketNumber}: {resolvedTicketToConfirm.title} was marked Resolved
                        </strong>
                        <p className="hint" style={{ marginTop: 2, color: 'var(--ink-soft)' }}>
                          {resolvedTicketToConfirm.resolutionSummary ||
                            'Support has recorded a resolution. Please confirm your issue is fixed to close this request.'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => openTicketView(resolvedTicketToConfirm.ticketNumber)}
                        style={{ fontSize: 13, padding: '8px 14px' }}
                      >
                        Confirm & Close
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => openTicketView(resolvedTicketToConfirm.ticketNumber)}
                        style={{ fontSize: 13, padding: '8px 14px' }}
                      >
                        Review ticket
                      </button>
                    </div>
                  </div>
                )}

                {/* Hero Greeting & Search */}
                <div className="hero-search-box">
                  <div className="head-row" style={{ marginBottom: 14 }}>
                    <div>
                      <div className="kicker">Self-Service Portal · Colombo Office</div>
                      <h1 className="page-title" style={{ fontSize: 32 }}>
                        Good afternoon, {user?.firstName}.
                      </h1>
                      <p className="page-sub">
                        How can IT support help you today? Search knowledge guides or submit a
                        request.
                      </p>
                    </div>
                    <button className="btn btn-primary" type="button" onClick={() => setActiveTab('new')}>
                      + New request
                    </button>
                  </div>

                  <form
                    className="hero-search-input-wrap"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setActiveTab('requests');
                    }}
                    style={{
                      background: 'var(--card-2)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 10,
                      padding: '8px 14px',
                    }}
                  >
                    <span style={{ fontSize: 16, color: 'var(--muted)' }}>🔍</span>
                    <input
                      id="portal-search-input"
                      value={reqSearch}
                      onChange={(e) => setReqSearch(e.target.value)}
                      placeholder="Search your tickets, self-help guides, request new equipment..."
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      style={{ fontSize: 13, padding: '6px 14px', whiteSpace: 'nowrap' }}
                    >
                      Search
                    </button>
                  </form>

                  <div className="quick-tags">
                    <span className="hint" style={{ margin: 0, fontWeight: 500 }}>
                      Popular requests:
                    </span>
                    <button className="quick-tag" type="button" onClick={() => { setFormCategory('HW'); setActiveTab('new'); }}>
                      💻 Laptop dock
                    </button>
                    <button className="quick-tag" type="button" onClick={() => { setFormCategory('ACC'); setActiveTab('new'); }}>
                      🔑 Password reset
                    </button>
                    <button className="quick-tag" type="button" onClick={() => { setFormCategory('SW'); setActiveTab('new'); }}>
                      📦 Figma license
                    </button>
                    <button className="quick-tag" type="button" onClick={() => { setFormCategory('NET'); setActiveTab('new'); }}>
                      🌐 Office Wi-Fi
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="stats">
                  <div className="stat">
                    <span>Active requests</span>
                    <strong>{tickets.filter((t) => t.status !== 'CLOSED').length}</strong>
                    <em>Active queue</em>
                  </div>
                  <div className="stat warn">
                    <span>Waiting on you</span>
                    <strong>{tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'PENDING_CUSTOMER').length}</strong>
                    <em>Action needed</em>
                  </div>
                  <div className="stat good">
                    <span>Resolved this month</span>
                    <strong>{tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}</strong>
                    <em>Closed successfully</em>
                  </div>
                  <div className="stat">
                    <span>Avg. first response</span>
                    <strong>38m</strong>
                    <em>SLA compliance</em>
                  </div>
                </div>

                {/* Open Requests Table */}
                <div className="split">
                  <div className="stack">
                    <div className="card">
                      <div className="row-between" style={{ marginBottom: 12 }}>
                        <h3>Your open requests</h3>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => setActiveTab('requests')}
                          style={{ padding: 0, color: 'var(--copper)', fontSize: 13 }}
                        >
                          View all ({tickets.length}) &rarr;
                        </button>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Category</th>
                            <th>Assignee</th>
                            <th>Status</th>
                            <th>SLA Target</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.slice(0, 5).map((t) => (
                            <tr key={t.id} className="clickable" onClick={() => openTicketView(t.ticketNumber)}>
                              <td>
                                <div className="mono">{t.ticketNumber}</div>
                                <div className="subject">{t.title}</div>
                              </td>
                              <td>
                                <span className="badge-tag">{t.category?.name || 'General'}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: '50%',
                                      background: '#3a3028',
                                      color: 'white',
                                      fontSize: 10,
                                      display: 'grid',
                                      placeItems: 'center',
                                    }}
                                  >
                                    {t.assignee ? `${t.assignee.firstName[0]}${t.assignee.lastName[0]}` : '—'}
                                  </span>
                                  <span style={{ fontSize: 13 }}>
                                    {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned'}
                                  </span>
                                </div>
                              </td>
                              <td>{getStatusPill(t.status)}</td>
                              <td>{getTicketSlaPill(t)}</td>
                              <td>
                                <button
                                  className="btn btn-ghost"
                                  type="button"
                                  style={{ padding: '4px 8px', fontSize: 12 }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Service Catalog Grid */}
                  <div className="stack">
                    <div className="card">
                      <h3 style={{ marginBottom: 4 }}>Request a service</h3>
                      <p className="hint" style={{ marginBottom: 12 }}>
                        Select a category to open a request:
                      </p>
                      <div className="service-grid">
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            className="service-card"
                            type="button"
                            onClick={() => {
                              setFormCategory(c.code);
                              setActiveTab('new');
                            }}
                          >
                            <span className="svc-icon">{c.icon || '📁'}</span>
                            <strong>{c.name}</strong>
                            <span>{c.description || 'Service line'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {(primaryRole === RoleName.IT_MANAGER || primaryRole === RoleName.SYSTEM_ADMINISTRATOR) && (
                      <div className="card">
                        <h3 style={{ marginBottom: 4 }}>Operations Controls</h3>
                        <div className="stack" style={{ marginTop: 8 }}>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => {
                              setActiveTab('sla');
                              fetchSlaData();
                            }}
                            style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%', fontSize: 13 }}
                          >
                            ⚙️ Review SLA policies & targets {breachedTickets.length > 0 && `(${breachedTickets.length} breached)`}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="note">
                      <strong>Privacy guarantee:</strong> Internal notes between support agents never
                      appear on this portal. You only see public communications written directly for
                      you.
                    </div>
                  </div>
                </div>
              </section>
              );
            })()}

            {/* VIEW 2: MY REQUESTS LIST */}
            {activeTab === 'requests' && (() => {
              const filteredRequests = tickets.filter((t) => {
                const matchesStatus =
                  reqStatusFilter === 'ALL'
                    ? true
                    : reqStatusFilter === 'ACTION'
                    ? t.status === 'RESOLVED' || t.status === 'PENDING_CUSTOMER'
                    : t.status === reqStatusFilter;
                const matchesCategory =
                  reqCategoryFilter === 'ALL' || t.category?.code === reqCategoryFilter;
                const q = reqSearch.trim().toLowerCase();
                const matchesSearch =
                  !q ||
                  t.ticketNumber?.toLowerCase().includes(q) ||
                  t.title?.toLowerCase().includes(q);
                return matchesStatus && matchesCategory && matchesSearch;
              });

              return (
              <section className="view">
                <div className="head-row">
                  <div>
                    <div className="kicker">Requests</div>
                    <h1 className="page-title">Service Requests & Issues</h1>
                    <p className="page-sub">
                      Everything submitted across your account, tracked in real-time.
                    </p>
                  </div>
                  <button className="btn btn-primary" type="button" onClick={() => setActiveTab('new')}>
                    + New request
                  </button>
                </div>

                <div className="filters" role="group" aria-label="Filter requests">
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'ALL'}
                    onClick={() => setReqStatusFilter('ALL')}
                  >
                    All ({tickets.length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'ACTION'}
                    onClick={() => setReqStatusFilter('ACTION')}
                  >
                    Action needed ({tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'PENDING_CUSTOMER').length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'IN_PROGRESS'}
                    onClick={() => setReqStatusFilter('IN_PROGRESS')}
                  >
                    In progress ({tickets.filter((t) => t.status === 'IN_PROGRESS').length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'PENDING_CUSTOMER'}
                    onClick={() => setReqStatusFilter('PENDING_CUSTOMER')}
                  >
                    Pending ({tickets.filter((t) => t.status === 'PENDING_CUSTOMER').length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'RESOLVED'}
                    onClick={() => setReqStatusFilter('RESOLVED')}
                  >
                    Resolved ({tickets.filter((t) => t.status === 'RESOLVED').length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reqStatusFilter === 'CLOSED'}
                    onClick={() => setReqStatusFilter('CLOSED')}
                  >
                    Closed ({tickets.filter((t) => t.status === 'CLOSED').length})
                  </button>
                </div>

                <div className="req-toolbar">
                  <div className="req-search">
                    <input
                      value={reqSearch}
                      onChange={(e) => setReqSearch(e.target.value)}
                      placeholder="Search by ticket ID or subject..."
                      style={{
                        width: '100%',
                        background: 'white',
                        border: '1px solid var(--line-strong)',
                        borderRadius: 10,
                        padding: '8px 12px',
                      }}
                    />
                  </div>
                  <select
                    value={reqCategoryFilter}
                    onChange={(e) => setReqCategoryFilter(e.target.value)}
                    style={{
                      width: 'auto',
                      minWidth: 160,
                      padding: '8px 12px',
                      background: 'white',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 10,
                    }}
                  >
                    <option value="ALL">All categories</option>
                    {categories.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="card" style={{ padding: '8px 8px 0' }}>
                  {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: 32 }}>🔍</div>
                      <h4>No matching requests found</h4>
                      <p className="hint">Try adjusting your search terms, status filters, or category.</p>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                          setReqStatusFilter('ALL');
                          setReqCategoryFilter('ALL');
                          setReqSearch('');
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>SLA Deadline</th>
                        <th>Assignee</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((t) => (
                        <tr key={t.id} className="clickable" onClick={() => openTicketView(t.ticketNumber)}>
                          <td>
                            <div className="mono">{t.ticketNumber}</div>
                            <div className="subject">{t.title}</div>
                          </td>
                          <td>
                            <span className="badge-tag">{t.category?.name}</span>
                          </td>
                          <td>{getPriorityPill(t.priority)}</td>
                          <td>{getStatusPill(t.status)}</td>
                          <td>{getTicketSlaPill(t)}</td>
                          <td>{t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned'}</td>
                          <td className="hint">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              type="button"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                            >
                              {t.status === 'RESOLVED' ? 'Review & Close' : 'Open'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </section>
              );
            })()}

            {/* VIEW 3: NEW REQUEST FORM (PRIORITY CALCULATOR) */}
            {activeTab === 'new' && (
              <section className="view">
                <div className="head-row">
                  <div>
                    <div className="kicker">New IT Service Request</div>
                    <h1 className="page-title">What do you need from IT?</h1>
                    <p className="page-sub">
                      A ticket number is issued immediately upon submission. SLA response clocks begin as soon as you submit.
                    </p>
                  </div>
                  <button className="btn btn-ghost" type="button" onClick={() => setActiveTab('home')}>
                    Back to Home
                  </button>
                </div>

                <div className="split">
                  <form className="card stack" onSubmit={handleCreateTicket}>
                    <div>
                      <label>Service Category</label>
                      <div className="cats" style={{ marginTop: 8 }}>
                        {categories.map((c) => (
                          <button
                            key={c.code}
                            className="cat"
                            type="button"
                            aria-pressed={formCategory === c.code}
                            onClick={() => setFormCategory(c.code)}
                          >
                            <strong>{c.icon} {c.name}</strong>
                            <span>{c.code} Line</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="subject">Subject / Summary</label>
                      <input
                        id="subject"
                        required
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder="Brief summary of the issue or request"
                      />
                    </div>

                    {deflectionMatches.length > 0 && (
                      <div className="note" style={{ marginTop: -4 }}>
                        <strong>Suggested Self-Service Guides</strong>
                        <p className="hint" style={{ margin: '4px 0 8px' }}>
                          These published articles might solve your issue immediately without waiting:
                        </p>
                        <div className="stack" style={{ gap: 6 }}>
                          {deflectionMatches.map((art) => (
                            <button
                              key={art.id}
                              type="button"
                              className="btn btn-ghost"
                              style={{ justifyContent: 'space-between', fontSize: 12, padding: '6px 10px' }}
                              onClick={() => setActiveTab('knowledge')}
                            >
                              <span>📘 {art.title}</span>
                              <span className="hint">{art.readMinutes}m read →</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="field">
                      <label htmlFor="desc">What happened (Detailed description)</label>
                      <textarea
                        id="desc"
                        required
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Describe the problem, error messages, and steps already attempted..."
                      />
                      <p className="hint">Include equipment IDs, room/desk numbers, and affected users.</p>
                    </div>

                    {/* Urgency & Impact selection for deterministic ITIL calculation */}
                    <div>
                      <label>Urgency</label>
                      <div className="radio-card-group" style={{ marginTop: 6 }}>
                        <div
                          className={`radio-card ${formUrgency === 'LOW' ? 'active' : ''}`}
                          onClick={() => setFormUrgency('LOW')}
                        >
                          <strong>Low · Can wait</strong>
                          <span>Workaround exists · Response 8h</span>
                        </div>
                        <div
                          className={`radio-card ${formUrgency === 'MEDIUM' ? 'active' : ''}`}
                          onClick={() => setFormUrgency('MEDIUM')}
                        >
                          <strong>Medium · Standard</strong>
                          <span>Single task delayed · Response 4h</span>
                        </div>
                        <div
                          className={`radio-card ${formUrgency === 'HIGH' ? 'active' : ''}`}
                          onClick={() => setFormUrgency('HIGH')}
                        >
                          <strong>High · Blocked today</strong>
                          <span>Work stopped · Response 1h</span>
                        </div>
                        <div
                          className={`radio-card ${formUrgency === 'CRITICAL' ? 'active' : ''}`}
                          onClick={() => setFormUrgency('CRITICAL')}
                        >
                          <strong>Critical · Team down</strong>
                          <span>Critical impediment · Response 15m</span>
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="impact-select">Business Impact Scope</label>
                      <select
                        id="impact-select"
                        value={formImpact}
                        onChange={(e) => setFormImpact(e.target.value)}
                      >
                        <option value="USER">Single User — Only affects my workstation</option>
                        <option value="DEPARTMENT">Department / Floor — Affects team shared resource</option>
                        <option value="ORGANIZATION">Organization-wide — Critical multi-team disruption</option>
                      </select>
                    </div>

                    {myAssets.length > 0 && (
                      <div className="field">
                        <label htmlFor="asset-select">Related IT Equipment / Asset (Optional)</label>
                        <select
                          id="asset-select"
                          value={formAssetId}
                          onChange={(e) => setFormAssetId(e.target.value)}
                        >
                          <option value="">None / General request</option>
                          {myAssets.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.assetTag} — {a.name} ({a.status.replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* File Attachment Picker & Preview */}
                    <div>
                      <label>Attachments</label>
                      <label className="drop" style={{ marginTop: 6, cursor: 'pointer', display: 'block' }}>
                        <input
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg,.pdf,.txt,.log"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileSelection(e.target.files)}
                        />
                        <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>📎</span>
                        <strong>Select a photo, PDF, screenshot, or log file</strong>
                        <div className="hint" style={{ marginTop: 4 }}>
                          PNG, JPG, PDF, TXT, LOG up to 10 MB per file (Max 3 files)
                        </div>
                      </label>
                      {pendingFiles.length > 0 && (
                        <div className="upload-list">
                          {pendingFiles.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="upload-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>📄</span>
                                <strong>{file.name}</strong>
                                <span className="hint">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                              </div>
                              <button
                                type="button"
                                aria-label="Remove attachment"
                                onClick={() =>
                                  setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                                }
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="row-between" style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                      <span className="hint">Automated SLA snapshot applies on submit.</span>
                      <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit request'}
                      </button>
                    </div>
                  </form>

                  {/* Sidebar SLA Policy Preview */}
                  <aside className="stack">
                    <div className="card">
                      <h3>SLA that will apply</h3>
                      <p className="mono" style={{ color: 'var(--copper)', fontWeight: 600 }}>
                        {formCategory} · {formUrgency}
                      </p>
                      <div className="meta-list" style={{ marginTop: 12 }}>
                        <div><dt>Response Target</dt><dd>{formUrgency === 'CRITICAL' ? '15 minutes' : formUrgency === 'HIGH' ? '1 hour' : '4 hours'}</dd></div>
                        <div><dt>Resolution Target</dt><dd>{formUrgency === 'CRITICAL' ? '2 hours' : formUrgency === 'HIGH' ? '8 hours' : '24 hours'}</dd></div>
                        <div><dt>Service Calendar</dt><dd>Mon–Fri 08:00–18:00</dd></div>
                      </div>
                      <p className="hint" style={{ marginTop: 12 }}>
                        The deadlines are calculated and stored with this ticket. Later policy edits do not rewrite them.
                      </p>
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* VIEW 4: TICKET DETAILS & DISCUSSION THREAD */}
            {activeTab === 'ticket' && (
              <section className="view">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  style={{ marginBottom: 12, padding: '4px 10px', fontSize: 13 }}
                >
                  &larr; Back to requests
                </button>

                {loading ? (
                  <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    Loading ticket details...
                  </div>
                ) : selectedTicket ? (
                  <div>
                    <div className="head-row">
                      <div>
                        <div className="kicker mono">
                          {selectedTicket.ticketNumber} · {selectedTicket.category?.name}
                        </div>
                        <h1 className="page-title">{selectedTicket.title}</h1>
                        <p className="page-sub">
                          Opened by {selectedTicket.requester?.firstName} {selectedTicket.requester?.lastName} · {new Date(selectedTicket.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {getPriorityPill(selectedTicket.priority)}
                        {getStatusPill(selectedTicket.status)}
                      </div>
                    </div>

                    {/* Ticket Lifecycle Stepper */}
                    {(() => {
                      const st = selectedTicket.status;
                      const steps = [
                        { key: 'NEW', label: 'Submitted' },
                        { key: 'ASSIGNED', label: 'Assigned' },
                        { key: 'IN_PROGRESS', label: 'In Progress' },
                        { key: 'RESOLVED', label: 'Resolved' },
                        { key: 'CLOSED', label: 'Closed' },
                      ];
                      const rankMap: Record<string, number> = {
                        NEW: 0,
                        ASSIGNED: 1,
                        IN_PROGRESS: 2,
                        PENDING_CUSTOMER: 2,
                        RESOLVED: 3,
                        CLOSED: 4,
                      };
                      const currentRank = rankMap[st] ?? 0;
                      return (
                        <div className="stepper" id="tkt-stepper">
                          {steps.map((s, idx) => {
                            const isDone = idx < currentRank || st === 'CLOSED';
                            const isActive = idx === currentRank && st !== 'CLOSED';
                            return (
                              <div
                                key={s.key}
                                className={`step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                              >
                                <div className="step-circle">{isDone ? '✓' : idx + 1}</div>
                                <div className="step-title">{s.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Resolution Card if marked Resolved */}
                    {selectedTicket.status === 'RESOLVED' && (
                      <div className="csat-box" style={{ background: '#f4f8f5', border: '1px solid #c8ddcc', borderLeft: '4px solid var(--moss)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                        <div className="row-between">
                          <div>
                            <strong style={{ color: 'var(--moss)', fontSize: 15 }}>Resolution Recorded by Support</strong>
                            <p style={{ margin: '4px 0', fontSize: 14 }}>
                              &ldquo;{selectedTicket.resolutionSummary || 'Resolution verified by agent.'}&rdquo;
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => handleUpdateStatus('CLOSED')}
                            >
                              Confirm & Close Request
                            </button>
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={() => handleUpdateStatus('IN_PROGRESS', 'Requester reported issue persists')}
                            >
                              Not fixed? Reopen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="layout-ticket">
                      <div>
                        {/* Ticket Original Problem Statement */}
                        <div className="card" style={{ marginBottom: 16 }}>
                          <h3>Problem Description</h3>
                          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
                            {selectedTicket.description}
                          </p>
                        </div>

                        {/* Conversation vs Activity & Audit Tabs */}
                        <div className="tabs" role="tablist">
                          <button
                            className="btn btn-ghost"
                            type="button"
                            aria-pressed={ticketPane === 'talk'}
                            onClick={() => setTicketPane('talk')}
                          >
                            Conversation ({selectedTicket.comments?.length || 0})
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            aria-pressed={ticketPane === 'audit'}
                            onClick={() => setTicketPane('audit')}
                          >
                            Activity & Audit ({selectedTicket.activityLogs?.length || 0})
                          </button>
                        </div>

                        {ticketPane === 'talk' ? (
                          <>
                            <div className="thread">
                              {selectedTicket.comments?.map((c: any) => {
                                const isInternal = c.type === 'INTERNAL_NOTE';
                                return (
                                  <article
                                    key={c.id}
                                    className={`msg ${isInternal ? 'internal' : ''}`}
                                    style={isInternal ? { background: '#f8f1e4', borderColor: '#eadcc4' } : {}}
                                  >
                                    <header>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <strong>{c.author?.firstName} {c.author?.lastName}</strong>
                                        {isInternal ? (
                                          <span className="badge-tag" style={{ background: '#eadcc4', color: '#8a5a10' }}>
                                            Internal Note (Agents Only)
                                          </span>
                                        ) : (
                                          <span className="badge-tag">Public</span>
                                        )}
                                      </div>
                                      <span className="hint">{new Date(c.createdAt).toLocaleTimeString()}</span>
                                    </header>
                                    <p style={{ fontSize: 14, margin: '6px 0 0' }}>{c.content}</p>
                                  </article>
                                );
                              })}
                            </div>

                            {/* Reply / Comment Composer */}
                            {selectedTicket.status !== 'CLOSED' && (
                              <form className="composer card" onSubmit={handlePostComment} style={{ marginTop: 16 }}>
                                <label htmlFor="reply">Add to the thread</label>
                                <textarea
                                  id="reply"
                                  required
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a message to the support team..."
                                />

                                <div className="row-between">
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <label
                                      className="btn btn-ghost"
                                      style={{ padding: '6px 12px', fontSize: 13, margin: 0, cursor: 'pointer' }}
                                    >
                                      <input
                                        type="file"
                                        multiple
                                        accept=".png,.jpg,.jpeg,.pdf,.txt,.log"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleUploadTicketFiles(e.target.files)}
                                      />
                                      {uploadingFiles ? 'Uploading...' : '📎 Attach file'}
                                    </label>
                                    {/* Internal Note Toggle: strictly hidden from pure employees */}
                                    {primaryRole !== RoleName.EMPLOYEE && (
                                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer', margin: 0 }}>
                                        <input
                                          type="checkbox"
                                          checked={isInternalNote}
                                          onChange={(e) => setIsInternalNote(e.target.checked)}
                                        />
                                        <span style={{ color: 'var(--copper)', fontWeight: 600 }}>
                                          Internal note
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                  <button className="btn btn-primary" type="submit" disabled={postingComment}>
                                    {postingComment ? 'Posting...' : 'Post reply'}
                                  </button>
                                </div>
                              </form>
                            )}
                          </>
                        ) : (
                          <div className="card">
                            <ol className="timeline">
                              {selectedTicket.activityLogs?.map((log: any) => (
                                <li key={log.id}>
                                  <i></i>
                                  <div>
                                    <strong>{log.action.replace(/_/g, ' ')}</strong>
                                    <div className="hint">
                                      {log.details} · {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Ticket Sidebar Details */}
                      <aside className="stack">
                        <div className="card">
                          <h3>Resolution clock</h3>
                          <div className={`sla-track ${getSlaTrackClass(selectedTicket)}`}>
                            <span style={{ width: `${getSlaTrackPercent(selectedTicket)}%` }}></span>
                          </div>
                          <div className="meta-list">
                            <div>
                              <dt>Response</dt>
                              <dd>{selectedTicket.firstResponseAt ? 'Met ✓' : (selectedTicket.responseDueAt && new Date() > new Date(selectedTicket.responseDueAt) ? 'Breached' : 'Pending')}</dd>
                            </div>
                            <div>
                              <dt>Resolve by</dt>
                              <dd className="mono">{selectedTicket.resolutionDueAt ? new Date(selectedTicket.resolutionDueAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</dd>
                            </div>
                            <div>
                              <dt>State</dt>
                              <dd>{getTicketSlaPill(selectedTicket)}</dd>
                            </div>
                            {selectedTicket.slaSnapshot?.pausedAt && (
                              <div style={{ color: 'var(--amber)', fontWeight: 600 }}>
                                <dt>Clock</dt>
                                <dd>⏸ Paused (Pending)</dd>
                              </div>
                            )}
                            {(selectedTicket.slaSnapshot?.totalPausedMinutes || 0) > 0 && (
                              <div>
                                <dt>Paused time</dt>
                                <dd className="mono">{selectedTicket.slaSnapshot.totalPausedMinutes}m accumulated</dd>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card">
                          <h3>Ownership</h3>
                          <div className="meta-list">
                            <div><dt>Requester</dt><dd>{selectedTicket.requester?.firstName} {selectedTicket.requester?.lastName}</dd></div>
                            <div><dt>Assignee</dt><dd>{selectedTicket.assignee ? `${selectedTicket.assignee.firstName} ${selectedTicket.assignee.lastName}` : 'Unassigned'}</dd></div>
                            <div><dt>Category</dt><dd>{selectedTicket.category?.name}</dd></div>
                            {selectedTicket.asset && (
                              <div>
                                <dt>Linked Asset</dt>
                                <dd className="mono">{selectedTicket.asset.assetTag} · {selectedTicket.asset.name}</dd>
                              </div>
                            )}
                          </div>

                          {/* Quick Status Shift for Support Agents */}
                          {primaryRole !== RoleName.EMPLOYEE && selectedTicket.status !== 'CLOSED' && (
                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                              <label style={{ fontSize: 12, fontWeight: 600 }}>Update Status</label>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  In Progress
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => handleUpdateStatus('PENDING_CUSTOMER')}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  Pending Customer
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => setShowResolveBox((v) => !v)}
                                  style={{ fontSize: 11, padding: '4px 8px' }}
                                >
                                  Mark Resolved
                                </button>
                              </div>

                              {showResolveBox && (
                                <div className="stack" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                                  <textarea
                                    rows={2}
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    placeholder="Mandatory resolution summary..."
                                    style={{ width: '100%', fontSize: 12, padding: 8, background: 'white' }}
                                  />
                                  <div className="row-between">
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      style={{ fontSize: 11, padding: '4px 8px' }}
                                      onClick={() => setShowResolveBox(false)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      disabled={!resolutionNote.trim()}
                                      style={{ fontSize: 11, padding: '4px 10px' }}
                                      onClick={async () => {
                                        await handleUpdateStatus('RESOLVED', resolutionNote.trim());
                                        setShowResolveBox(false);
                                      }}
                                    >
                                      Save Resolution
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Authorized Ticket Attachments Sidebar Card */}
                        <div className="card">
                          <div className="row-between" style={{ marginBottom: 8 }}>
                            <h3 style={{ margin: 0 }}>
                              Attachments ({selectedTicket.attachments?.length || 0})
                            </h3>
                            {selectedTicket.status !== 'CLOSED' && (
                              <label
                                className="btn btn-ghost"
                                style={{ padding: '3px 8px', fontSize: 11, margin: 0, cursor: 'pointer' }}
                              >
                                <input
                                  type="file"
                                  multiple
                                  accept=".png,.jpg,.jpeg,.pdf,.txt,.log"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleUploadTicketFiles(e.target.files)}
                                />
                                {uploadingFiles ? '...' : '+ Add'}
                              </label>
                            )}
                          </div>
                          {(!selectedTicket.attachments || selectedTicket.attachments.length === 0) ? (
                            <p className="hint" style={{ margin: '6px 0 0' }}>
                              No files attached yet. PNG, JPG, PDF, TXT, LOG supported (max 10 MB).
                            </p>
                          ) : (
                            <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                              {selectedTicket.attachments.map((att: any) => (
                                <div
                                  key={att.id}
                                  style={{
                                    border: '1px solid var(--line)',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    background: 'white',
                                  }}
                                >
                                  <div className="row-between">
                                    <span style={{ fontWeight: 550, fontSize: 12, wordBreak: 'break-all' }}>
                                      📎 {att.fileName}
                                    </span>
                                    <span className="hint" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                                      {Math.max(1, Math.round(att.fileSize / 1024))} KB
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-block"
                                    style={{ fontSize: 11, padding: '4px 8px', marginTop: 6 }}
                                    onClick={() => handleDownloadAttachment(att.id, att.fileName)}
                                  >
                                    Download attachment
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="hint" style={{ marginTop: 8 }}>
                            Authorized only for requester and assigned IT staff.
                          </p>
                        </div>
                      </aside>
                    </div>
                  </div>
                ) : (
                  <div className="card">Ticket not found.</div>
                )}
              </section>
            )}

            {/* VIEW 5: PEOPLE & ROLE MANAGEMENT (ADMIN / MANAGER) */}
            {activeTab === 'users' && (
              <AdminPeopleView
                usersList={usersList}
                currentUser={user}
                onRefreshUsers={async () => {
                  const uRes = await api.get('/users');
                  setUsersList(uRes.data?.data || []);
                }}
              />
            )}

            {/* VIEW 6: SLA MANAGEMENT & ESCALATIONS (MANAGER / ADMIN / AGENT) */}
            {activeTab === 'sla' && (
              <SlaManagementView
                policies={slaPolicies}
                metrics={slaMetrics}
                breachedTickets={breachedTickets}
                onRefresh={() => {
                  fetchSlaData();
                  fetchTickets();
                }}
                onOpenTicket={(tktNum) => openTicketView(tktNum)}
              />
            )}

            {/* VIEW 7: ASSIGNMENT DESK & WORKFORCE ROUTING (MANAGER / ADMIN) */}
            {activeTab === 'assignment' && (
              <DispatchDesk
                tickets={tickets}
                agents={usersList}
                onRefresh={async () => {
                  await fetchTickets();
                  if (
                    user?.roles.includes(RoleName.SYSTEM_ADMINISTRATOR) ||
                    user?.roles.includes(RoleName.IT_MANAGER)
                  ) {
                    const uRes = await api.get('/users');
                    setUsersList(uRes.data?.data || []);
                  }
                }}
                onOpenTicket={(tktNum) => openTicketView(tktNum)}
              />
            )}

            {/* VIEW 8: MAJOR INCIDENTS & WAR-ROOMS (AGENT / MANAGER / ADMIN) */}
            {activeTab === 'incidents' && (
              <IncidentsView
                user={user}
                usersList={usersList}
                initialIncidentNumber={selectedIncidentNumber}
                onOpenTicket={(tktNum) => openTicketView(tktNum)}
                onClearInitialIncident={() => setSelectedIncidentNumber(null)}
                onIncidentChange={fetchActiveOutage}
              />
            )}

            {/* VIEW 9: INBOX NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                unreadCount={unreadNotifCount}
                wsConnected={wsConnected}
                onMarkRead={handleMarkNotifRead}
                onMarkAllRead={handleMarkAllNotifsRead}
                onOpenEntity={handleOpenNotificationEntity}
              />
            )}

            {/* VIEW 10: REPORTS & ANALYTICS (MANAGER / ADMIN) */}
            {activeTab === 'reports' && <ReportsView />}

            {/* VIEW 11: CATEGORIES CATALOG (ADMIN) */}
            {activeTab === 'categories' && (
              <CategoriesView
                onCategoriesUpdated={async () => {
                  const res = await api.get('/tickets/categories');
                  setCategories(res.data?.data || []);
                }}
              />
            )}

            {/* VIEW 12: APPEND-ONLY AUDIT TRAIL (ADMIN / MANAGER) */}
            {activeTab === 'audit' && <AuditView currentUser={user} />}

            {/* VIEW 13: PLATFORM SETTINGS (ADMIN) */}
            {activeTab === 'settings' && <SettingsView />}

            {/* VIEW 14: KNOWLEDGE BASE & SELF-SERVICE (ALL ROLES) */}
            {activeTab === 'knowledge' && (
              <KnowledgeView
                user={user}
                categories={categories}
                onStartTicket={(prefillTitle) => {
                  if (prefillTitle) setFormSubject(`Need help: ${prefillTitle}`);
                  setActiveTab('new');
                }}
              />
            )}

            {/* VIEW 15: IT ASSET CMDB (AGENT / MANAGER / ADMIN) */}
            {activeTab === 'assets' && (
              <AssetsView
                user={user}
                usersList={usersList}
                onOpenTicket={(tktNum) => openTicketView(tktNum)}
              />
            )}
          </main>
        </div>

        {/* Employee Public Outage Notice Modal */}
        {showOutageModal && activeOutage && (
          <div className="modal-overlay open" onClick={() => setShowOutageModal(false)}>
            <div className="modal-box stack" onClick={(e) => e.stopPropagation()}>
              <div className="row-between">
                <div>
                  <div className="kicker mono">{activeOutage.incidentNumber} · Service Status Notice</div>
                  <h3 style={{ margin: '4px 0 0', fontSize: 18 }}>{activeOutage.title}</h3>
                </div>
                <button
                  className="btn btn-ghost"
                  type="button"
                  style={{ padding: '4px 10px' }}
                  onClick={() => setShowOutageModal(false)}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{activeOutage.description}</p>
              <div className="meta-list">
                <div><dt>Status</dt><dd><span className="pill progress">{activeOutage.status}</span></dd></div>
                <div><dt>Impact Scope</dt><dd>{activeOutage.impactScope || 'Organization-wide'}</dd></div>
                {activeOutage.commander && (
                  <div><dt>Lead Commander</dt><dd>{activeOutage.commander.firstName} {activeOutage.commander.lastName}</dd></div>
                )}
              </div>
              {activeOutage.workaround && (
                <div className="note">
                  <strong>Recommended Workaround:</strong> {activeOutage.workaround}
                </div>
              )}
              {activeOutage.updates?.length > 0 && (
                <div>
                  <strong style={{ fontSize: 13 }}>Latest IT Operations Updates</strong>
                  <ol className="timeline" style={{ marginTop: 8 }}>
                    {activeOutage.updates.map((u: any) => (
                      <li key={u.id}>
                        <i></i>
                        <div>
                          <div>{u.message}</div>
                          <div className="hint">{new Date(u.createdAt).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="row-between" style={{ paddingTop: 8 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setShowOutageModal(false)}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setShowOutageModal(false);
                    setActiveTab('new');
                  }}
                >
                  Report affected workstation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

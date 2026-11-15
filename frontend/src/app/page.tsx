'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Laptop,
  Headphones,
  BarChart3,
  Flame,
  Server,
  BookOpen,
  Layers,
  ChevronRight,
  Activity,
  Terminal,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SplashPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="splash-container" style={{ minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          background: 'rgba(243, 239, 230, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--rail)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid #e7b08a',
                  borderRadius: 3,
                }}
              />
            </div>
            <div>
              <strong style={{ fontSize: 17, fontWeight: 600, display: 'block', lineHeight: 1.1 }}>
                ServiceOps
              </strong>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                ENTERPRISE ITSM PLATFORM
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: 'var(--moss)',
                background: 'var(--moss-bg)',
                padding: '4px 12px',
                borderRadius: 999,
              }}
              className="md:flex"
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--moss)',
                  display: 'inline-block',
                }}
              />
              System Operational · 99.98% SLA
            </div>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  Signed in as <strong>{user?.firstName}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary"
                style={{
                  padding: '9px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(142, 63, 30, 0.25)',
                }}
              >
                Sign In <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 48px' }}>
        <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'var(--card-2)',
              border: '1px solid var(--line)',
              fontSize: 12,
              fontFamily: 'var(--mono)',
              color: 'var(--copper)',
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            NEXT-GENERATION ENTERPRISE SERVICE MANAGEMENT
          </div>

          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 520,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: '0 auto 20px',
            }}
          >
            One desk for every IT request, incident, and SLA deadline.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--ink-soft)',
              maxWidth: 680,
              margin: '0 auto 36px',
              lineHeight: 1.5,
            }}
          >
            Connect employees, support agents, and IT leadership in a real-time operational workspace.
            Automate ticket dispatch, guarantee service levels, and orchestrate major incident resolution.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              className="btn btn-primary"
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: '14px 32px',
                borderRadius: 10,
                boxShadow: '0 4px 14px rgba(142, 63, 30, 0.3)',
                cursor: 'pointer',
              }}
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>

            <a
              href="#features"
              className="btn btn-ghost"
              style={{
                fontSize: 15,
                fontWeight: 500,
                padding: '14px 24px',
                borderRadius: 10,
                background: 'white',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              Explore Capabilities
            </a>
          </div>
        </div>

        {/* Office & IT Operations Visual Showcase */}
        <div
          style={{
            marginTop: 56,
            background: 'linear-gradient(180deg, #1f1b16 0%, #161310 100%)',
            borderRadius: 20,
            border: '1px solid #332d24',
            padding: '24px 24px 32px',
            color: '#f4efe6',
            boxShadow: '0 20px 48px -12px rgba(28, 25, 21, 0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 16,
              borderBottom: '1px solid #2e2820',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#a3998b', marginLeft: 8 }}>
                serviceops-internal.northwind.corp &mdash; Enterprise Operations Hub
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  color: '#e7b08a',
                  background: 'rgba(231, 176, 138, 0.1)',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                LIVE WEBSOCKET ACTIVE
              </span>
            </div>
          </div>

          {/* IT Operations & Office Visual Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {/* Control Deck Metric 1: Request Pool */}
            <div
              style={{
                background: '#231f1a',
                border: '1px solid #383228',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#c9c1b4', textTransform: 'uppercase' }}>
                    Agent Workforce
                  </span>
                  <Headphones className="w-4 h-4 text-amber-500" />
                </div>
                <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--mono)', color: '#ffffff' }}>
                  100%
                </div>
                <div style={{ fontSize: 13, color: '#a3998b', marginTop: 4 }}>
                  Automated round-robin dispatch & workload balance
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #332d24',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9c1b4' }}>
                  <span>TKT-1042 Picked up</span>
                  <span style={{ color: '#10b981', fontFamily: 'var(--mono)' }}>&lt; 2m response</span>
                </div>
              </div>
            </div>

            {/* Control Deck Metric 2: SLA Engine */}
            <div
              style={{
                background: '#231f1a',
                border: '1px solid #383228',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#c9c1b4', textTransform: 'uppercase' }}>
                    SLA Compliance
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--mono)', color: '#10b981' }}>
                  99.4%
                </div>
                <div style={{ fontSize: 13, color: '#a3998b', marginTop: 4 }}>
                  Proactive warning at 75% elapsed threshold
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6ee7b7' }}>
                  <span>Escalation Engine</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>Autonomous</span>
                </div>
              </div>
            </div>

            {/* Control Deck Metric 3: Incident War Room */}
            <div
              style={{
                background: '#231f1a',
                border: '1px solid #383228',
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#c9c1b4', textTransform: 'uppercase' }}>
                    Incident Command
                  </span>
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
                <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--mono)', color: '#ffffff' }}>
                  18m MTTR
                </div>
                <div style={{ fontSize: 13, color: '#a3998b', marginTop: 4 }}>
                  Organization-wide banner broadcasts & war-room timelines
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #332d24',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9c1b4' }}>
                  <span>Zero Data Loss</span>
                  <span style={{ color: '#e7b08a', fontFamily: 'var(--mono)' }}>Audit Verifiable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Office Workspace Graphic Illustration */}
          <div
            style={{
              marginTop: 24,
              background: '#1a1713',
              borderRadius: 14,
              border: '1px solid #2e2820',
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#2a241c',
                  border: '1px solid #3e362a',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Laptop className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#f4efe6' }}>
                  Corporate Office & Remote Desks
                </strong>
                <span style={{ fontSize: 12, color: '#a3998b' }}>
                  Cross-departmental IT assistance across all facilities
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#2a241c',
                  border: '1px solid #3e362a',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Server className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#f4efe6' }}>
                  Infrastructure & CMDB Sync
                </strong>
                <span style={{ fontSize: 12, color: '#a3998b' }}>
                  Monitored workstations, server nodes, & network racks
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#2a241c',
                  border: '1px solid #3e362a',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#f4efe6' }}>
                  Strict RBAC & Least-Privilege
                </strong>
                <span style={{ fontSize: 12, color: '#a3998b' }}>
                  Audited role assignments & encrypted attachments
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--mono)',
              textTransform: 'uppercase',
              color: 'var(--copper)',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            ARCHITECTURE & CAPABILITIES
          </span>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 36,
              fontWeight: 520,
              marginTop: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Built for enterprise reliability at every operational layer
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
              transition: 'box-shadow 0.2s',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--amber-bg)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <Headphones className="w-5 h-5" style={{ color: 'var(--amber)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Employee Self-Service & Deflection
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Employees submit requests with urgency and impact criteria, attach logs or screenshots, and get real-time deflection suggestions from verified Knowledge Base articles.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--moss-bg)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <Clock className="w-5 h-5" style={{ color: 'var(--moss)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Guaranteed SLA Management
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Multi-tier response and resolution policies dynamically snap to tickets upon submission. Proactive background monitors notify managers before target breaches occur.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--rose-bg)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <Flame className="w-5 h-5" style={{ color: 'var(--rose)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Major Incident Command
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Declare outages with organization-wide live broadcast banners. Manage investigation war rooms, link related tickets, and retain post-mortem audit records.
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--sky-bg)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <Users className="w-5 h-5" style={{ color: 'var(--sky)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Workforce Dispatch & Routing
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Dispatch managers monitor team workload saturation, reassign tickets with single clicks, and claim unassigned tickets from prioritized queue pools.
            </p>
          </div>

          {/* Card 5 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#faeae3',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <Server className="w-5 h-5" style={{ color: 'var(--copper)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              IT Asset Configuration CMDB
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Track hardware lifecycle states from in-stock to deployed and retired. Associate tickets directly to employee assets for rapid diagnosis and warranty tracking.
            </p>
          </div>

          {/* Card 6 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 28,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'var(--card-2)',
                border: '1px solid var(--line)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--ink)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Security & Audit Trail
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
              Enterprise RBAC separating Employee, Support Agent, IT Manager, and System Administrator. Cryptographic audit trails capture every status transition and privilege shift.
            </p>
          </div>
        </div>
      </section>

      {/* Role Personas Quick Look */}
      <section
        style={{
          background: 'var(--card-2)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          padding: '64px 32px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 520 }}>
              Tailored workspaces for each enterprise role
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 6 }}>
              Every team member accesses the tools they need with least-privilege security.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            <div
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                ROLE 01
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginBottom: 8 }}>
                Employee
              </strong>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Submit help requests, track status progress in real-time, view assigned assets, and read self-service troubleshooting articles.
              </p>
            </div>

            <div
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--copper)', textTransform: 'uppercase', marginBottom: 6 }}>
                ROLE 02
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginBottom: 8 }}>
                IT Support Agent
              </strong>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Manage assigned tickets, write internal investigation notes, record root-cause fixes, monitor response countdowns, and upload diagnosis attachments.
              </p>
            </div>

            <div
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', marginBottom: 6 }}>
                ROLE 03
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginBottom: 8 }}>
                IT Manager
              </strong>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Oversee incoming ticket dispatch, balance agent queues, manage SLA compliance policies, declare outages, and review team performance reports.
              </p>
            </div>

            <div
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--moss)', textTransform: 'uppercase', marginBottom: 6 }}>
                ROLE 04
              </div>
              <strong style={{ fontSize: 17, display: 'block', marginBottom: 8 }}>
                System Administrator
              </strong>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Provision users, grant elevated role permissions, manage categories, configure platform parameters, and inspect the system audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Get Started Callout */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 40,
            fontWeight: 520,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Ready to operate with total clarity?
        </h2>
        <p style={{ fontSize: 17, color: 'var(--ink-soft)', maxWidth: 560, margin: '0 auto 32px' }}>
          Sign in to your corporate ServiceOps workspace to submit a ticket or manage operational queues.
        </p>

        <button
          type="button"
          onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
          className="btn btn-primary"
          style={{
            fontSize: 16,
            fontWeight: 600,
            padding: '14px 36px',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(142, 63, 30, 0.3)',
            cursor: 'pointer',
          }}
        >
          {isAuthenticated ? 'Enter Console' : 'Get Started'}
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--line)',
          background: 'var(--card)',
          padding: '32px',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mark" style={{ width: 18, height: 18 }}>
              <i style={{ width: 6, height: 6 }}></i>
            </span>
            <strong>ServiceOps</strong> &mdash; Northwind Enterprise Internal IT Operations
          </div>
          <div>
            Enterprise ITSM Architecture &middot; Version 1.0 Production
          </div>
        </div>
      </footer>
    </div>
  );
}

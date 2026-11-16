'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SplashPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="splash-viewport">
      {/* Background Image Container - 100% full bleed */}
      <div className="splash-bg" />

      {/* Atmospheric Overlays for maximum contrast & crisp typography */}
      <div className="splash-overlay-radial" />
      <div className="splash-overlay-linear" />

      {/* Foreground Content Container */}
      <div className="splash-content">
        {/* Top Header */}
        <header className="splash-header">
          {/* Brand Mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#1c1915',
                border: '1.5px solid rgba(231, 176, 138, 0.4)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid #e7b08a',
                  borderRadius: 3,
                  background: '#8e3f1e',
                }}
              />
            </div>
            <div>
              <strong style={{ fontSize: 17, fontWeight: 600, display: 'block', letterSpacing: '-0.01em', color: '#ffffff' }}>
                ServiceOps
              </strong>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  color: '#c9c1b4',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise IT Operations
              </span>
            </div>
          </div>

          {/* Live Operational Status & Quick Sign In */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="splash-status-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: '#6ee7b7',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '5px 14px',
                borderRadius: 999,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block',
                }}
              />
              System Operational · 99.98% SLA
            </div>

            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'var(--copper)',
                  borderRadius: 8,
                }}
              >
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <Link
                href="/login"
                style={{
                  fontSize: 13,
                  color: '#e7b08a',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(231, 176, 138, 0.3)',
                  background: 'rgba(28, 25, 21, 0.5)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Center Hero Section */}
        <section className="splash-hero">
          {/* Kicker Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(35, 31, 26, 0.75)',
              border: '1px solid rgba(231, 176, 138, 0.3)',
              backdropFilter: 'blur(10px)',
              fontSize: 11,
              fontFamily: 'var(--mono)',
              color: '#e7b08a',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 'clamp(12px, 2vh, 20px)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Enterprise IT Service Management
          </div>

          {/* Hero Title */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(28px, 4.4vw, 56px)',
              fontWeight: 520,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              margin: '0 auto clamp(10px, 1.6vh, 16px)',
              textShadow: '0 3px 20px rgba(0, 0, 0, 0.75)',
              maxWidth: '18ch',
            }}
          >
            One unified desk for requests, incident command, and SLA excellence.
          </h1>

          {/* Focused Subtitle Description */}
          <p
            style={{
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              lineHeight: 1.5,
              color: '#d4cdc1',
              maxWidth: 600,
              margin: '0 auto clamp(16px, 2.5vh, 28px)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
            }}
          >
            Empower your enterprise workforce with automated ticket dispatch, proactive SLA breach
            prevention, hardware CMDB tracking, and real-time incident war rooms.
          </p>

          {/* Prominent "Get Started" Button under the text */}
          <div>
            <button
              type="button"
              id="splash-get-started"
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              className="btn btn-primary"
              style={{
                fontSize: 'clamp(14px, 1.6vw, 16px)',
                fontWeight: 600,
                padding: 'clamp(12px, 1.8vh, 15px) clamp(28px, 3.5vw, 40px)',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #a44a25 0%, #7d3517 100%)',
                border: '1px solid rgba(231, 176, 138, 0.45)',
                color: '#ffffff',
                boxShadow: '0 6px 24px rgba(142, 63, 30, 0.45)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Subtle Security / Trust Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 'clamp(14px, 2vh, 22px)',
              fontSize: 11,
              color: '#a3998b',
              fontFamily: 'var(--mono)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Role-Based Access
            </span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Zero-Lag WebSockets</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>ITIL &amp; SLA Aligned</span>
          </div>
        </section>

        {/* Bottom Minimal Footer */}
        <footer className="splash-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mark" style={{ width: 14, height: 14, borderColor: '#a3998b' }}>
              <i style={{ width: 4, height: 4, background: '#e7b08a' }}></i>
            </span>
            <span>ServiceOps &mdash; Northwind Enterprise Internal IT</span>
          </div>
          <div>
            Production Environment · Version 1.0
          </div>
        </footer>
      </div>
    </div>
  );
}

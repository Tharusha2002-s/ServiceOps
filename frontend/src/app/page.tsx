'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="splash-viewport">
      {/* Background Image Container - 100% full bleed */}
      <div className="splash-bg" />

      {/* Atmospheric Overlays for maximum contrast & crisp typography */}
      <div className="splash-overlay-radial" />
      <div className="splash-overlay-linear" />

      {/* Foreground Content Container */}
      <div className="splash-content" style={{ justifyContent: 'center', position: 'relative' }}>
        {/* Top Minimal Brand Mark */}
        <header
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: 'clamp(20px, 3vh, 32px) clamp(24px, 4vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: '#1c1915',
                border: '1.5px solid rgba(231, 176, 138, 0.45)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 13,
                  height: 13,
                  border: '2px solid #e7b08a',
                  borderRadius: 3.5,
                  background: '#8e3f1e',
                }}
              />
            </div>
            <div>
              <strong style={{ fontSize: 18, fontWeight: 600, display: 'block', letterSpacing: '-0.01em', color: '#ffffff' }}>
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
        </header>

        {/* Center Hero Section: Pure, focused headline, description & Get Started button */}
        <section className="splash-hero" style={{ zIndex: 2 }}>
          {/* Hero Title */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(32px, 5vw, 62px)',
              fontWeight: 520,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              margin: '0 auto clamp(14px, 2.2vh, 22px)',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.85)',
              maxWidth: '18ch',
            }}
          >
            One unified desk for requests, incident command, and SLA excellence.
          </h1>

          {/* Focused Subtitle Description */}
          <p
            style={{
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.55,
              color: '#e4ddd2',
              maxWidth: 640,
              margin: '0 auto clamp(24px, 3.5vh, 36px)',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.75)',
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
                fontSize: 'clamp(15px, 1.6vw, 17px)',
                fontWeight: 600,
                padding: 'clamp(14px, 2vh, 18px) clamp(32px, 4vw, 46px)',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #a44a25 0%, #7d3517 100%)',
                border: '1.5px solid rgba(231, 176, 138, 0.5)',
                color: '#ffffff',
                boxShadow: '0 8px 30px rgba(142, 63, 30, 0.5)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

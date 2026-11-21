
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
      {/* Background Image Container */}
      <div className="splash-bg" />

      {/* Atmospheric Overlays */}
      <div className="splash-overlay-radial" />
      <div className="splash-overlay-linear" />

      {/* Foreground Content Container */}
      <div
        className="splash-content"
        style={{
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Top Brand Header */}
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
          {/* Logo and Brand Text - Horizontal Layout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Logo */}
            <img
              src="/logo.png"
              alt="ServiceOps Logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 9,
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
              }}
            />

            {/* Brand Text */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <strong
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  lineHeight: 1.2,
                }}
              >
                ServiceOps
              </strong>

              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  color: '#c9c1b4',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                }}
              >
                Enterprise IT Operations
              </span>
            </div>
          </div>
        </header>

        {/* Center Hero Section */}
        <section
          className="splash-hero"
          style={{ zIndex: 2 }}
        >
          {/* Hero Title */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(32px, 5vw, 62px)',
              fontWeight: 520,
              lineHeight: 1.1,
              letterSpacing: '-0.05em',
              color: '#ffffff',
              margin: '0 auto clamp(14px, 2.2vh, 22px)',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.85)',
              maxWidth: '18ch',
            }}
          >
            One unified desk for requests, incident command, and SLA excellence.
          </h1>

          {/* Get Started Button */}
          <div>
            <button
              type="button"
              id="splash-get-started"
              onClick={() =>
                router.push(
                  isAuthenticated ? '/dashboard' : '/login'
                )
              }
              className="btn btn-primary"
              style={{
                fontSize: 'clamp(15px, 1.6vw, 17px)',
                fontWeight: 600,
                padding: 'clamp(14px, 2vh, 18px) clamp(32px, 4vw, 46px)',
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, #a44a25 0%, #7d3517 100%)',
                border: '1.5px solid rgba(231, 176, 138, 0.5)',
                color: '#ffffff',
                boxShadow: '0 8px 30px rgba(142, 63, 30, 0.5)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                transition:
                  'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span>
                {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
              </span>

              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

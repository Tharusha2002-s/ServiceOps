'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

type ReportRange = '7d' | '30d' | 'month' | 'quarter';

const RANGES: Array<{ key: ReportRange; label: string }> = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'quarter', label: 'Quarter to date' },
];

export function ReportsView() {
  const [range, setRange] = useState<ReportRange>('7d');
  const [summary, setSummary] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReports = useCallback(async (selectedRange: ReportRange) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [sumRes, trendRes] = await Promise.all([
        api.get(`/reports/summary?range=${selectedRange}`),
        api.get(`/reports/trends?range=${selectedRange}`),
      ]);
      setSummary(sumRes.data?.data || null);
      setTrends(trendRes.data?.data?.series || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Unable to load operational reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports(range);
  }, [range, loadReports]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/export/csv?range=${range}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serviceops-report-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const kpis = summary?.kpis || {
    ticketsOpened: 0,
    ticketsResolved: 0,
    openCount: 0,
    resolutionRatePct: 100,
    medianResponseMinutes: 0,
    avgResponseMinutes: 0,
    slaCompliancePct: 100,
    breachedCount: 0,
  };

  const maxDayVal = Math.max(
    1,
    ...trends.map((d) => Math.max(d.opened || 0, d.resolved || 0)),
  );

  return (
    <section className="view">
      <div className="head-row">
        <div>
          <div className="kicker">Service Operations Analytics</div>
          <h1 className="page-title">Service quality &amp; performance</h1>
          <p className="page-sub">
            Filter by date window and export authorized CSV records. Figures follow the organization&apos;s SLA business calendar.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          id="btn-export-csv"
          disabled={exporting}
          onClick={handleExportCsv}
        >
          {exporting ? 'Exporting CSV...' : 'Export CSV report'}
        </button>
      </div>

      <div className="filters" id="report-date-filters">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            className="report-filter-btn"
            aria-pressed={range === r.key}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="banner" style={{ borderLeftColor: 'var(--rose)' }}>
          <div>
            <strong>Report error</strong> <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <span>Tickets opened</span>
          <strong>{loading && !summary ? '...' : kpis.ticketsOpened}</strong>
          <em>{kpis.openCount} currently active</em>
        </div>
        <div className="stat">
          <span>Tickets resolved</span>
          <strong>{loading && !summary ? '...' : kpis.ticketsResolved}</strong>
          <em>{kpis.resolutionRatePct}% resolution rate</em>
        </div>
        <div className={`stat ${kpis.slaCompliancePct >= 90 ? 'good' : 'warn'}`}>
          <span>SLA compliance</span>
          <strong>{loading && !summary ? '...' : `${kpis.slaCompliancePct}%`}</strong>
          <em>{kpis.breachedCount} breached in window</em>
        </div>
        <div className="stat good">
          <span>Median response</span>
          <strong>{loading && !summary ? '...' : `${kpis.medianResponseMinutes}m`}</strong>
          <em>Avg {kpis.avgResponseMinutes}m first reply</em>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h3>Opened vs resolved tickets (Daily throughput)</h3>
          <span className="hint">{trends.length} days displayed</span>
        </div>
        {trends.length > 0 ? (
          <>
            <div className="bars">
              {trends.map((d) => {
                const openH = Math.max(4, Math.round(((d.opened || 0) / maxDayVal) * 90));
                const resH = Math.max(4, Math.round(((d.resolved || 0) / maxDayVal) * 90));
                return (
                  <div
                    key={d.date}
                    className="bar-col"
                    title={`${d.date}: ${d.opened} opened, ${d.resolved} resolved`}
                  >
                    <div className="pair">
                      <i className="o" style={{ height: `${openH}px` }} />
                      <i className="r" style={{ height: `${resH}px` }} />
                    </div>
                    <em>{d.label.split(' ')[1] || d.label}</em>
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span>
                <b style={{ background: '#1c1915' }} /> Opened
              </span>
              <span>
                <b style={{ background: '#c47a52' }} /> Resolved
              </span>
            </div>
          </>
        ) : (
          <p className="hint">No ticket activity found inside this range.</p>
        )}
      </div>

      <div className="split">
        <div className="card" style={{ padding: '8px 8px 0' }}>
          <div style={{ padding: '10px 10px 4px' }}>
            <h3>Performance by category</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Opened</th>
                <th>Median response</th>
                <th>Breaches</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.byCategory || []).map((cat: any) => (
                <tr key={cat.categoryId}>
                  <td>{cat.categoryName}</td>
                  <td>{cat.opened}</td>
                  <td>{cat.medianResponseMinutes != null ? `${cat.medianResponseMinutes} min` : '—'}</td>
                  <td>
                    <span className={`pill ${cat.breaches > 0 ? 'risk' : 'ok'}`}>
                      {cat.breaches} {cat.breaches === 1 ? 'breach' : 'breaches'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!summary?.byCategory || summary.byCategory.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
                    No category data recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '8px 8px 0' }}>
          <div style={{ padding: '10px 10px 4px' }}>
            <h3>Agent quality scorecard</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Resolved</th>
                <th>Avg response</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.agentScorecard || []).map((ag: any) => (
                <tr key={ag.agentId}>
                  <td>
                    <div>{ag.name}</div>
                    <div className="hint">{ag.activeOpen} open in queue</div>
                  </td>
                  <td>{ag.resolvedInPeriod}</td>
                  <td>{ag.avgResponseMinutes != null ? `${ag.avgResponseMinutes} min` : '—'}</td>
                  <td>
                    <span className={`pill ${ag.slaMetPct >= 90 ? 'ok' : 'risk'}`}>
                      {ag.slaMetPct}%
                    </span>
                  </td>
                </tr>
              ))}
              {(!summary?.agentScorecard || summary.agentScorecard.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
                    No assigned agent activity in range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


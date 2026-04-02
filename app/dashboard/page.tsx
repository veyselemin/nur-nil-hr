'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface SectionData {
  section_id: number;
  section_name: string;
  location: string;
  total_employees: number;
  active_count: number;
  clocked_in_count: number;
  on_leave_count: number;
  absent_count: number;
  suspended_count: number;
  avg_performance: number;
  total_payroll: number;
}

interface RecentApproval {
  id: number;
  type: string;
  status: string;
  created_at: string;
  requested_by: string;
}

interface DashboardStats {
  totalEmployees: number;
  clockedIn: number;
  onLeave: number;
  absent: number;
  suspended: number;
  terminated: number;
  pendingApprovals: number;
  newThisMonth: number;
  lateToday: number;
  sections: SectionData[];
}

function getCurrentShift(hour: number) {
  if (hour >= 6 && hour < 14) return { num: 1, label: 'Morning Shift', time: '06:00 – 14:00' };
  if (hour >= 14 && hour < 22) return { num: 2, label: 'Afternoon Shift', time: '14:00 – 22:00' };
  return { num: 3, label: 'Night Shift', time: '22:00 – 06:00' };
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  icon: string;
  href?: string;
}) {
  const inner = (
    <div
      style={{
        background: '#1e2130',
        border: `1px solid ${color}33`,
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: href ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: `0 2px 12px ${color}18`,
      }}
      onMouseEnter={(e) => {
        if (href) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px ${color}30`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 12px ${color}18`;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: color,
            background: `${color}18`,
            borderRadius: 6,
            padding: '2px 8px',
            letterSpacing: 0.5,
          }}
        >
          LIVE
        </span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: '#f0f2fa', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#8b93ad', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600 }}>{sub}</div>}
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

function LiveBar({ live, total, color }: { live: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((live / total) * 100) : 0;
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          background: '#2a2f45',
          borderRadius: 99,
          height: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            height: '100%',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#8b93ad', marginTop: 4 }}>{pct}% on duty</div>
    </div>
  );
}

export default function DashboardPage() {
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Section dashboard view
      const { data: sectionData } = await supabase.from('section_dashboard').select('*');

      // All active employees by status
      const { data: empData } = await supabase
        .from('employees')
        .select('status, created_at')
        .neq('status', 'terminated');

      // Terminated count
      const { count: terminatedCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'terminated');

      // Pending approvals
      const { count: pendingCount } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Recent approvals for the feed
      const { data: approvalFeed } = await supabase
        .from('approvals')
        .select('id, type, status, created_at, requested_by')
        .order('created_at', { ascending: false })
        .limit(5);

      // New employees this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: newCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      // Late today
      const todayStr = now.toISOString().split('T')[0];
      const { count: lateCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', todayStr)
        .eq('is_late', true);

      const onLeave = empData?.filter((e) => e.status === 'on_leave').length || 0;
      const absent = empData?.filter((e) => e.status === 'absent').length || 0;
      const suspended = empData?.filter((e) => e.status === 'suspended').length || 0;
      const clockedIn = sectionData?.reduce((sum, s) => sum + (s.clocked_in_count || 0), 0) || 0;

      setStats({
        totalEmployees: empData?.length || 0,
        clockedIn,
        onLeave,
        absent,
        suspended,
        terminated: terminatedCount || 0,
        pendingApprovals: pendingCount || 0,
        newThisMonth: newCount || 0,
        lateToday: lateCount || 0,
        sections: sectionData || [],
      });

      setRecentApprovals(approvalFeed || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const hour = currentTime.getHours();
  const currentShift = getCurrentShift(hour);

  const beniSuef = stats?.sections.filter((s) => s.location === 'Beni Suef') || [];
  const sadatCity = stats?.sections.filter((s) => s.location === 'Sadat City') || [];

  const beniSuefTotal = beniSuef.reduce((sum, s) => sum + (s.total_employees || 0), 0);
  const beniSuefLive = beniSuef.reduce((sum, s) => sum + (s.clocked_in_count || 0), 0);
  const sadatTotal = sadatCity.reduce((sum, s) => sum + (s.total_employees || 0), 0);
  const sadatLive = sadatCity.reduce((sum, s) => sum + (s.clocked_in_count || 0), 0);

  const shifts = [
    { num: 1, label: 'Morning Shift', time: '06:00 – 14:00', active: currentShift.num === 1 },
    { num: 2, label: 'Afternoon Shift', time: '14:00 – 22:00', active: currentShift.num === 2 },
    { num: 3, label: 'Night Shift', time: '22:00 – 06:00', active: currentShift.num === 3 },
  ];

  const shiftTotal = stats ? Math.round(stats.totalEmployees / 3) : 0;

  const approvalTypeLabel: Record<string, string> = {
    new_employee: 'New Employee',
    termination: 'Termination',
    leave_request: 'Leave Request',
    salary_change: 'Salary Change',
    document_upload: 'Document Upload',
    other: 'Other',
  };

  const bg = '#13151f';
  const card = '#1e2130';
  const border = '#2a2f45';
  const text = '#e8eaf0';
  const muted = '#8b93ad';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: text,
          fontSize: 18,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px', color: text, overflowY: 'auto', minHeight: '100vh', background: bg }}><div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: text, margin: 0 }}>
            NurNil Tekstil — HR Dashboard
          </h1>
          <p style={{ color: muted, fontSize: 13, marginTop: 4, margin: 0 }}>
            Live overview · Auto-refreshes every 30 seconds
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#3b82f6',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -1,
            }}
          >
            {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 12, color: muted }}>
            {currentTime.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 6,
              background: '#3b82f620',
              border: '1px solid #3b82f640',
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 12,
              color: '#3b82f6',
              fontWeight: 700,
            }}
          >
            ▶ {currentShift.label} ({currentShift.time})
          </div>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard label="Total Employees" value={stats?.totalEmployees || 0} icon="👥" color="#3b82f6" />
        <StatCard
          label="On Duty Now"
          value={stats?.clockedIn || 0}
          sub={`of ${stats?.totalEmployees || 0} total`}
          icon="🟢"
          color="#22c55e"
          href="/attendance"
        />
        <StatCard
          label="On Leave"
          value={stats?.onLeave || 0}
          icon="🏖️"
          color="#f59e0b"
          href="/leave"
        />
        <StatCard
          label="Absent Today"
          value={stats?.absent || 0}
          icon="🔴"
          color="#ef4444"
          href="/attendance"
        />
        <StatCard
          label="Late Today"
          value={stats?.lateToday || 0}
          icon="⏰"
          color="#f97316"
          href="/attendance"
        />
        <StatCard
          label="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          icon="📋"
          color="#a855f7"
          href="/approvals"
        />
        <StatCard
          label="New This Month"
          value={stats?.newThisMonth || 0}
          icon="✨"
          color="#06b6d4"
          href="/employees"
        />
        <StatCard
          label="Suspended"
          value={stats?.suspended || 0}
          icon="⛔"
          color="#6b7280"
          href="/employees"
        />
      </div>

      {/* ── Sites Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Beni Suef */}
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: text }}>📍 Beni Suef</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Factory Site 1</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#22c55e' }}>{beniSuefLive}</span>
              <span style={{ fontSize: 20, color: muted, fontWeight: 600 }}>/{beniSuefTotal}</span>
              <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginTop: 2 }}>LIVE</div>
            </div>
          </div>
          <LiveBar live={beniSuefLive} total={beniSuefTotal} color="#22c55e" />
          {/* Beni Suef Sections */}
          <div style={{ marginTop: 16 }}>
            {beniSuef.map((s) => (
              <div
                key={s.section_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: `1px solid ${border}`,
                  fontSize: 13,
                }}
              >
                <div style={{ color: text, fontWeight: 600 }}>{s.section_name}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>
                    {s.clocked_in_count}/{s.total_employees}
                  </span>
                  <span style={{ fontSize: 10, color: muted }}>live</span>
                  {s.on_leave_count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#f59e0b',
                        background: '#f59e0b18',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {s.on_leave_count} leave
                    </span>
                  )}
                  {s.absent_count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#ef4444',
                        background: '#ef444418',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {s.absent_count} absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sadat City */}
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: text }}>📍 Sadat City</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Factory Site 2</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#3b82f6' }}>{sadatLive}</span>
              <span style={{ fontSize: 20, color: muted, fontWeight: 600 }}>/{sadatTotal}</span>
              <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, marginTop: 2 }}>LIVE</div>
            </div>
          </div>
          <LiveBar live={sadatLive} total={sadatTotal} color="#3b82f6" />
          {/* Sadat Sections */}
          <div style={{ marginTop: 16 }}>
            {sadatCity.map((s) => (
              <div
                key={s.section_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: `1px solid ${border}`,
                  fontSize: 13,
                }}
              >
                <div style={{ color: text, fontWeight: 600 }}>{s.section_name}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                    {s.clocked_in_count}/{s.total_employees}
                  </span>
                  <span style={{ fontSize: 10, color: muted }}>live</span>
                  {s.on_leave_count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#f59e0b',
                        background: '#f59e0b18',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {s.on_leave_count} leave
                    </span>
                  )}
                  {s.absent_count > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#ef4444',
                        background: '#ef444418',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {s.absent_count} absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shifts Row ── */}
      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 14,
          padding: 22,
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 16 }}>
          🔄 Shift Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {shifts.map((shift) => (
            <div
              key={shift.num}
              style={{
                background: shift.active ? '#1a2540' : '#181c2a',
                border: `1px solid ${shift.active ? '#3b82f6' : border}`,
                borderRadius: 10,
                padding: '16px 18px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {shift.active && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#22c55e',
                    background: '#22c55e18',
                    borderRadius: 6,
                    padding: '2px 7px',
                    letterSpacing: 0.5,
                    animation: 'none',
                  }}
                >
                  ● ACTIVE
                </div>
              )}
              <div style={{ fontSize: 22, marginBottom: 6 }}>
                {shift.num === 1 ? '🌅' : shift.num === 2 ? '🌤️' : '🌙'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: text }}>Shift {shift.num}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{shift.label}</div>
              <div
                style={{
                  fontSize: 11,
                  color: shift.active ? '#3b82f6' : muted,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {shift.time}
              </div>
              <div style={{ marginTop: 12 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: shift.active ? '#3b82f6' : '#4b5280',
                  }}
                >
                  ~{shift.active ? stats?.clockedIn || shiftTotal : shiftTotal}
                </span>
                <span style={{ fontSize: 13, color: muted, marginLeft: 4 }}>/ {shiftTotal} expected</span>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: muted,
            fontStyle: 'italic',
          }}
        >
          💡 Shift headcounts are estimated (total ÷ 3). To track exact per-shift numbers, add a{' '}
          <code style={{ color: '#a78bfa' }}>shift_number</code> column to the employees table.
        </div>
      </div>

      {/* ── Bottom Row: Sections Table + Approvals Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Full Section Breakdown */}
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: text }}>🏭 All Sections Overview</div>
            <Link
              href="/sections"
              style={{
                fontSize: 12,
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              View All →
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Section', 'Site', 'Live', 'Total', 'On Leave', 'Absent', 'Perf.'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        color: muted,
                        fontWeight: 700,
                        fontSize: 11,
                        paddingBottom: 10,
                        paddingRight: 16,
                        borderBottom: `1px solid ${border}`,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.sections.map((s) => (
                  <tr key={s.section_id}>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        fontWeight: 700,
                        color: text,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      {s.section_name}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        color: muted,
                        borderBottom: `1px solid ${border}`,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          background: s.location === 'Beni Suef' ? '#22c55e18' : '#3b82f618',
                          color: s.location === 'Beni Suef' ? '#22c55e' : '#3b82f6',
                          padding: '2px 8px',
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {s.location}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        fontWeight: 800,
                        color: '#22c55e',
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      {s.clocked_in_count}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        color: text,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      {s.total_employees}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        color: s.on_leave_count > 0 ? '#f59e0b' : muted,
                        fontWeight: s.on_leave_count > 0 ? 700 : 400,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      {s.on_leave_count}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px 10px 0',
                        color: s.absent_count > 0 ? '#ef4444' : muted,
                        fontWeight: s.absent_count > 0 ? 700 : 400,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      {s.absent_count}
                    </td>
                    <td
                      style={{
                        padding: '10px 0 10px 0',
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 50,
                            height: 5,
                            background: border,
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${s.avg_performance || 0}%`,
                              height: '100%',
                              background:
                                (s.avg_performance || 0) >= 80
                                  ? '#22c55e'
                                  : (s.avg_performance || 0) >= 60
                                  ? '#f59e0b'
                                  : '#ef4444',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, color: muted }}>{s.avg_performance || '—'}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Approvals + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pending Approvals */}
          <div
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 20,
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: text }}>
                📋 Recent Approvals
                {(stats?.pendingApprovals || 0) > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: '#a855f7',
                      color: '#fff',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 8px',
                    }}
                  >
                    {stats?.pendingApprovals} pending
                  </span>
                )}
              </div>
              <Link href="/approvals" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                All →
              </Link>
            </div>
            {recentApprovals.length === 0 ? (
              <div style={{ color: muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No recent approvals
              </div>
            ) : (
              recentApprovals.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 0',
                    borderBottom: `1px solid ${border}`,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ color: text, fontWeight: 600 }}>
                      {approvalTypeLabel[a.type] || a.type}
                    </div>
                    <div style={{ color: muted, fontSize: 11, marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background:
                        a.status === 'pending'
                          ? '#f59e0b18'
                          : a.status === 'approved'
                          ? '#22c55e18'
                          : '#ef444418',
                      color:
                        a.status === 'pending'
                          ? '#f59e0b'
                          : a.status === 'approved'
                          ? '#22c55e'
                          : '#ef4444',
                    }}
                  >
                    {a.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 14 }}>
              ⚡ Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '➕ Add New Employee', href: '/employees/add', color: '#3b82f6' },
                { label: '📅 Record Attendance', href: '/attendance', color: '#22c55e' },
                { label: '📝 New Leave Request', href: '/leave', color: '#f59e0b' },
                { label: '📁 Upload Document', href: '/documents', color: '#a855f7' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: 'block',
                    background: `${action.color}12`,
                    border: `1px solid ${action.color}30`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: action.color,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div></main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ev = {
  id: string;
  direction: string | null;
  matched_by: string | null;
  variance_pct: number | null;
  flagged: boolean | null;
  created_at: string;
  weighbridge_tickets: any;
};

function fmtKg(kg: number | null | undefined) {
  if (kg === null || kg === undefined) return '-';
  return Number(kg).toLocaleString() + ' kg';
}

function fmtDt(s: string) {
  try { return new Date(s).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }); } catch { return s; }
}

export function WeighbridgeTimeline({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const supabase = createClient();
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('order_weighbridge_events')
        .select('id, direction, matched_by, variance_pct, flagged, created_at, weighbridge_tickets(id, ticket_number, vehicle_rego, trailer_rego, gross_kg, tare_kg, net_kg, recorded_at, source, weighbridges(id, name, operator, state, nmi_certified, nmi_cert_number))')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (mounted) { setEvents((data as any) || []); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [orderId]);

  if (loading) return null;

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Weighbridge Events</h2>
        {events.length > 0 && <span className="text-[10px] uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-2 py-0.5">Verified</span>}
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No weighbridge events yet for this order.</p>
      ) : (
        <ol className="space-y-4">
          {events.map((e) => {
            const t = e.weighbridge_tickets;
            const wb = t?.weighbridges;
            return (
              <li key={e.id} className="border-l-2 border-emerald-300 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{e.direction || 'event'}</span>
                  {wb && <span className="text-sm text-gray-700">@ {wb.name}</span>}
                  {wb?.nmi_certified && <span className="text-[10px] uppercase tracking-wide bg-blue-50 border border-blue-200 text-blue-700 rounded px-1.5 py-0.5">NMI</span>}
                  {e.flagged && <span className="text-[10px] uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 rounded px-1.5 py-0.5">Flagged</span>}
                </div>
                <div className="text-xs text-gray-500">{t ? fmtDt(t.recorded_at) : fmtDt(e.created_at)}{t?.ticket_number ? ' - Ticket #' + t.ticket_number : ''}</div>
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-500">Vehicle:</span> <span className="font-mono">{t?.vehicle_rego || '-'}</span></div>
                  <div><span className="text-gray-500">Gross:</span> {fmtKg(t?.gross_kg)}</div>
                  <div><span className="text-gray-500">Tare:</span> {fmtKg(t?.tare_kg)}</div>
                  <div><span className="text-gray-500">Net:</span> <span className="font-medium text-gray-900">{fmtKg(t?.net_kg)}</span></div>
                </div>
                {e.variance_pct !== null && e.variance_pct !== undefined && (
                  <div className="text-xs mt-1 text-gray-600">Variance: {Number(e.variance_pct).toFixed(2)}%</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

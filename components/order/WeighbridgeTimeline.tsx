'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type EventRow = {
  id: string;
  direction: string | null;
  matched_by: string | null;
  confidence: number | null;
  variance_pct: number | null;
  flagged: boolean | null;
  created_at: string;
  weighbridge_tickets: {
    id: string;
    ticket_number: string | null;
    vehicle_rego: string | null;
    trailer_rego: string | null;
    gross_kg: number | null;
    tare_kg: number | null;
    net_kg: number | null;
    moisture_pct: number | null;
    recorded_at: string;
    source: string;
    weighbridges: {
      id: string;
      name: string;
      operator: string | null;
      state: string | null;
      nmi_certified: boolean;
      nmi_cert_number: string | null;
    } | null;
  } | null;
};

function fmtKg(kg: number | null | undefined) {
  if (kg === null || kg === undefined) return '–';
  return `${Number(kg).toLocaleString()} kg`;
}

function fmtDt(s: string) {
  try { return new Date(s).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }); } catch { return s; }
}

export default function WeighbridgeTimeline({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from('order_weighbridge_events')
        .select(`id, direction, matched_by, confidence, variance_pct, flagged, created_at,
                 weighbridge_tickets:ticket_id (
                   id, ticket_number, vehicle_rego, trailer_rego, gross_kg, tare_kg, net_kg, moisture_pct, recorded_at, source,
                   weighbridges:weighbridge_id ( id, name, operator, state, nmi_certified, nmi_cert_number )
                 )`)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (error) setError(error.message);
      else setEvents((data as any) || []);
    }
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`weighbridge:order:${orderId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_weighbridge_events', filter: `order_id=eq.${orderId}` },
        () => load()
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [orderId]);

  return (
    <section className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Weighbridge events</h2>
          <p className="text-xs text-gray-500">Live, NMI-traceable weights captured at certified weighbridges as the freight is weighed in and out.</p>
        </div>
        {events && events.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Weighbridge verified
          </span>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {!events && !error && <div className="text-sm text-gray-500">Loading…</div>}
      {events && events.length === 0 && (
        <div className="text-sm text-gray-500">No weighbridge events yet. Once the carrier crosses a connected weighbridge, the ticket will appear here automatically.</div>
      )}

      {events && events.length > 0 && (
        <ol className="relative border-l border-gray-200 pl-4 space-y-4">
          {events.map((e) => {
            const t = e.weighbridge_tickets;
            const wb = t?.weighbridges;
            return (
              <li key={e.id} className="relative">
                <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${e.flagged ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900 capitalize">{e.direction || 'weighed'}</span>
                  {wb && <span className="text-sm text-gray-700">@ {wb.name}{wb.state ? `, ${wb.state}` : ''}</span>}
                  {wb?.nmi_certified && (
                    <span className="text-[10px] uppercase tracking-wide bg-blue-50 border border-blue-200 text-blue-700 rounded px-1.5 py-0.5" title={wb.nmi_cert_number || 'NMI certified'}>NMI</span>
                  )}
                  {e.flagged && (
                    <span className="text-[10px] uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 rounded px-1.5 py-0.5">Variance</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{t ? fmtDt(t.recorded_at) : fmtDt(e.created_at)}{t?.ticket_number ? ` · Ticket #${t.ticket_number}` : ''}</div>
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-500">Vehicle:</span> <span className="font-mono">{t?.vehicle_rego || '–'}</span></div>
                  <div><span className="text-gray-500">Gross:</span> {fmtKg(t?.gross_kg)}</div>
                  <div><span className="text-gray-500">Tare:</span> {fmtKg(t?.tare_kg)}</div>
                  <div><span className="text-gray-500">Net:</span> <span className="font-medium text-gray-900">{fmtKg(t?.net_kg)}</span></div>
                </div>
                {e.variance_pct !== null && e.variance_pct !== undefined && (
                  <div className="text-xs mt-1 text-gray-600">Variance vs listed: {Number(e.variance_pct).toFixed(2)}%</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

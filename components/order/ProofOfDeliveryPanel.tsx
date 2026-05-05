'use client';
import { useEffect, useState } from 'react';

type Pod = { id: string; recipient_name?: string | null; recipient_role?: string | null; recipient_company?: string | null; signature_path?: string | null; photo_paths?: string[] | null; delivered_qty_kg?: number | null; lat?: number | null; lng?: number | null; notes?: string | null; status?: string | null; created_at?: string };

export default function ProofOfDeliveryPanel({ orderId }: { orderId: string }) {
  const [items, setItems] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [deliveredQtyKg, setDeliveredQtyKg] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/pod`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setItems(j.pod || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { if (orderId) load(); }, [orderId]);

  function captureLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const body: any = {
        recipient_name: recipientName || null,
        recipient_role: recipientRole || null,
        recipient_company: recipientCompany || null,
        delivered_qty_kg: deliveredQtyKg ? Number(deliveredQtyKg) : null,
        notes: notes || null,
      };
      if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
      const res = await fetch(`/api/orders/${orderId}/pod`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.detail || `HTTP ${res.status}`);
      setShowForm(false);
      setRecipientName(''); setRecipientRole(''); setRecipientCompany(''); setDeliveredQtyKg(''); setNotes('');
      await load();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Proof of Delivery</h2>
        <button onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : 'Add POD'}</button>
      </div>
      {error && <div style={{ background: '#fee', color: '#900', padding: 8, borderRadius: 4, marginTop: 8 }}>{error}</div>}
      {loading && <p style={{ color: '#666' }}>Loading...</p>}

      {showForm && (
        <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <input placeholder="Recipient name" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
          <input placeholder="Recipient role" value={recipientRole} onChange={e => setRecipientRole(e.target.value)} />
          <input placeholder="Recipient company" value={recipientCompany} onChange={e => setRecipientCompany(e.target.value)} />
          <input type="number" placeholder="Delivered qty (kg)" value={deliveredQtyKg} onChange={e => setDeliveredQtyKg(e.target.value)} />
          <textarea placeholder="Notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={captureLocation}>Capture GPS</button>
            {coords && <span style={{ fontSize: 12 }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
          </div>
          <button type="submit" disabled={submitting} style={{ padding: 10, background: '#0a7', color: '#fff', border: 0, borderRadius: 4 }}>
            {submitting ? 'Saving...' : 'Save POD'}
          </button>
        </form>
      )}

      {!loading && items.length === 0 && !showForm && <p style={{ color: '#666' }}>No proof of delivery yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
        {items.map(p => (
          <li key={p.id} style={{ borderTop: '1px solid #eee', padding: '8px 0' }}>
            <div><strong>{p.recipient_name || 'Recipient'}</strong> {p.recipient_company && <span style={{ color: '#666' }}>- {p.recipient_company}</span>}</div>
            <div style={{ color: '#666', fontSize: 13 }}>
              {p.delivered_qty_kg != null && <span>{p.delivered_qty_kg} kg · </span>}
              {p.status && <span>{p.status} · </span>}
              <span>{p.created_at}</span>
            </div>
            {p.notes && <div style={{ fontSize: 13 }}>{p.notes}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

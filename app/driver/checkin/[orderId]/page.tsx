'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Checkin = { id: string; stage: string; vehicle_rego?: string | null; trailer_rego?: string | null; odometer_km?: number | null; seal_number?: string | null; lat?: number | null; lng?: number | null; notes?: string | null; created_at?: string };

export default function DriverCheckinPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [stage, setStage] = useState<'pickup' | 'in_transit' | 'delivered'>('pickup');
  const [vehicleRego, setVehicleRego] = useState('');
  const [trailerRego, setTrailerRego] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<Checkin[]>([]);

  async function load() {
    try {
      const res = await fetch(`/api/driver/checkin?order_id=${orderId}`);
      if (!res.ok) return;
      const j = await res.json();
      setHistory(j.checkins || []);
    } catch {}
  }

  useEffect(() => { if (orderId) load(); }, [orderId]);

  function captureLocation() {
    if (!navigator.geolocation) { setError('Geolocation not available'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const body: any = {
        order_id: orderId,
        stage,
        vehicle_rego: vehicleRego || null,
        trailer_rego: trailerRego || null,
        odometer_km: odometerKm ? Number(odometerKm) : null,
        seal_number: sealNumber || null,
        notes: notes || null,
      };
      if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
      const res = await fetch('/api/driver/checkin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.detail || `HTTP ${res.status}`);
      setSuccess(`Check-in recorded (${stage}).`);
      setNotes(''); setSealNumber('');
      await load();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
      <button onClick={() => router.push(`/orders/${orderId}`)} style={{ marginBottom: 8 }}>&larr; Back to order</button>
      <h1 style={{ fontSize: 20 }}>Driver Check-in</h1>
      <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>Order: {orderId}</div>

      {error && <div style={{ background: '#fee', color: '#900', padding: 8, borderRadius: 4 }}>{error}</div>}
      {success && <div style={{ background: '#e6ffe6', color: '#060', padding: 8, borderRadius: 4 }}>{success}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <label>
          Stage
          <select value={stage} onChange={e => setStage(e.target.value as any)} style={{ width: '100%', padding: 8, fontSize: 16 }}>
            <option value="pickup">Pickup</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
        <label>
          Vehicle rego
          <input value={vehicleRego} onChange={e => setVehicleRego(e.target.value)} style={{ width: '100%', padding: 8, fontSize: 16 }} placeholder="e.g. ABC123" />
        </label>
        <label>
          Trailer rego
          <input value={trailerRego} onChange={e => setTrailerRego(e.target.value)} style={{ width: '100%', padding: 8, fontSize: 16 }} />
        </label>
        <label>
          Odometer (km)
          <input type="number" value={odometerKm} onChange={e => setOdometerKm(e.target.value)} style={{ width: '100%', padding: 8, fontSize: 16 }} />
        </label>
        <label>
          Seal number
          <input value={sealNumber} onChange={e => setSealNumber(e.target.value)} style={{ width: '100%', padding: 8, fontSize: 16 }} />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: 8, fontSize: 16 }} />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={captureLocation}>Capture GPS</button>
          {coords && <span style={{ fontSize: 12, color: '#444' }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
        </div>
        <button type="submit" disabled={submitting} style={{ padding: 12, fontSize: 16, background: '#0a7', color: '#fff', border: 0, borderRadius: 4 }}>
          {submitting ? 'Submitting...' : 'Submit check-in'}
        </button>
      </form>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>Recent check-ins</h2>
        {history.length === 0 && <p style={{ color: '#666' }}>No check-ins yet.</p>}
        <ul style={{ paddingLeft: 16 }}>
          {history.map(h => (
            <li key={h.id} style={{ marginBottom: 6 }}>
              <strong>{h.stage}</strong> {h.vehicle_rego && <span>- {h.vehicle_rego}</span>} <small style={{ color: '#666' }}>{h.created_at}</small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

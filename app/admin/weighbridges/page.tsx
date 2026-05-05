'use client';
import { useEffect, useState } from 'react';

type Weighbridge = { id: string; name: string; operator?: string | null; address?: string | null; state?: string | null; postcode?: string | null; created_at?: string };
type Device = { id: string; weighbridge_id: string; device_serial?: string | null; device_label?: string | null; status?: string | null; last_seen_at?: string | null; created_at?: string };

export default function AdminWeighbridgesPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [devices, setDevices] = useState<Record<string, Device[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWb, setNewWb] = useState({ name: '', operator: '', address: '', state: '', postcode: '' });
  const [newDev, setNewDev] = useState<Record<string, { device_serial: string; device_label: string }>>({});
  const [revealed, setRevealed] = useState<{ device_id: string; api_key: string } | null>(null);

  useEffect(() => {
    const k = typeof window !== 'undefined' ? sessionStorage.getItem('wb_admin_key') : null;
    if (k) { setAdminKey(k); setAuthed(true); }
  }, []);

  async function api(path: string, init?: RequestInit) {
    const res = await fetch(path, { ...init, headers: { 'content-type': 'application/json', 'x-admin-key': adminKey, ...(init?.headers || {}) } });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
    return j;
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      const j = await api('/api/admin/weighbridges');
      setWeighbridges(j.weighbridges || []);
      const map: Record<string, Device[]> = {};
      for (const w of (j.weighbridges || [])) {
        const d = await api(`/api/admin/weighbridges/devices?weighbridge_id=${w.id}`);
        map[w.id] = d.devices || [];
      }
      setDevices(map);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleSignIn() {
    if (!adminKey) return;
    sessionStorage.setItem('wb_admin_key', adminKey);
    setAuthed(true);
    setTimeout(load, 0);
  }

  async function addWeighbridge(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/admin/weighbridges', { method: 'POST', body: JSON.stringify(newWb) });
      setNewWb({ name: '', operator: '', address: '', state: '', postcode: '' });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function addDevice(weighbridge_id: string) {
    setError(null);
    try {
      const payload = newDev[weighbridge_id] || { device_serial: '', device_label: '' };
      const j = await api('/api/admin/weighbridges/devices', { method: 'POST', body: JSON.stringify({ weighbridge_id, ...payload }) });
      setRevealed({ device_id: j.device.id, api_key: j.api_key });
      setNewDev({ ...newDev, [weighbridge_id]: { device_serial: '', device_label: '' } });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  if (!authed) {
    return (
      <main style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
        <h1>Weighbridge Admin</h1>
        <p>Enter the admin API key to manage weighbridges and devices.</p>
        <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY" style={{ width: '100%', padding: 8, fontSize: 16 }} />
        <button onClick={handleSignIn} style={{ marginTop: 12, padding: '8px 16px' }}>Continue</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: '24px auto', padding: 16 }}>
      <h1>Weighbridge Admin</h1>
      {error && <div style={{ background: '#fee', color: '#900', padding: 8, borderRadius: 4 }}>{error}</div>}
      {revealed && (
        <div style={{ background: '#fff7cc', padding: 12, borderRadius: 4, margin: '12px 0' }}>
          <strong>New device API key (copy now, will not be shown again):</strong>
          <pre style={{ userSelect: 'all' }}>{revealed.api_key}</pre>
          <button onClick={() => setRevealed(null)}>Dismiss</button>
        </div>
      )}
      <section style={{ marginTop: 24, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
        <h2>Add Weighbridge</h2>
        <form onSubmit={addWeighbridge} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <input required placeholder="Name *" value={newWb.name} onChange={e => setNewWb({ ...newWb, name: e.target.value })} />
          <input placeholder="Operator" value={newWb.operator} onChange={e => setNewWb({ ...newWb, operator: e.target.value })} />
          <input placeholder="Address" value={newWb.address} onChange={e => setNewWb({ ...newWb, address: e.target.value })} />
          <input placeholder="State" value={newWb.state} onChange={e => setNewWb({ ...newWb, state: e.target.value })} />
          <input placeholder="Postcode" value={newWb.postcode} onChange={e => setNewWb({ ...newWb, postcode: e.target.value })} />
          <button type="submit">Add Weighbridge</button>
        </form>
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Weighbridges {loading && <small>(loading...)</small>}</h2>
        <button onClick={load}>Refresh</button>
        {weighbridges.length === 0 && <p>No weighbridges yet.</p>}
        {weighbridges.map(w => (
          <div key={w.id} style={{ border: '1px solid #ddd', borderRadius: 4, padding: 12, marginTop: 12 }}>
            <div><strong>{w.name}</strong> {w.operator && <span>- {w.operator}</span>}</div>
            <div style={{ color: '#666', fontSize: 13 }}>{w.address} {w.state} {w.postcode}</div>
            <div style={{ color: '#999', fontSize: 12 }}>id: {w.id}</div>
            <div style={{ marginTop: 8 }}>
              <strong>Devices</strong>
              <ul>
                {(devices[w.id] || []).map(d => (
                  <li key={d.id}>{d.device_label || d.device_serial || d.id} <small>({d.status})</small></li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Device label" value={(newDev[w.id]?.device_label) || ''} onChange={e => setNewDev({ ...newDev, [w.id]: { ...(newDev[w.id] || { device_serial: '', device_label: '' }), device_label: e.target.value } })} />
                <input placeholder="Device serial" value={(newDev[w.id]?.device_serial) || ''} onChange={e => setNewDev({ ...newDev, [w.id]: { ...(newDev[w.id] || { device_serial: '', device_label: '' }), device_serial: e.target.value } })} />
                <button onClick={() => addDevice(w.id)}>Add device & generate key</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const AU_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'ACT' },
  { value: 'NT', label: 'Northern Territory' },
];

const COMMODITIES = [
  { value: 'hay', label: 'Hay' },
  { value: 'grain', label: 'Grain' },
  { value: 'silage', label: 'Silage' },
  { value: 'straw', label: 'Straw' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'fertiliser', label: 'Fertiliser' },
  { value: 'bulk_liquid', label: 'Bulk Liquid' },
  { value: 'equipment', label: 'Equipment' },
];

const VEHICLE_TYPES = [
  { value: 'rigid', label: 'Rigid Truck' },
  { value: 'semi', label: 'Semi-Trailer' },
  { value: 'b_double', label: 'B-Double' },
  { value: 'b_triple', label: 'B-Triple' },
  { value: 'road_train', label: 'Road Train' },
  { value: 'tipper', label: 'Tipper' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'livestock_crate', label: 'Livestock Crate' },
  { value: 'ute', label: 'Ute' },
  { value: 'other', label: 'Other' },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function CarrierOnboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Step 1 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — Business
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [baseState, setBaseState] = useState('');
  const [baseSuburb, setBaseSuburb] = useState('');
  const [basePostcode, setBasePostcode] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);

  // Step 3 — Compliance
  const [nhvr, setNhvr] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [uploadedDocPath, setUploadedDocPath] = useState<string | null>(null);

  // Step 4 — Capability
  const [regionsServed, setRegionsServed] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [fleetSize, setFleetSize] = useState<number>(1);
  const [firstRego, setFirstRego] = useState('');
  const [firstVehicleType, setFirstVehicleType] = useState('semi');
  const [firstCapacity, setFirstCapacity] = useState<number | ''>('');

  // Final
  const [submittedCarrierId, setSubmittedCarrierId] = useState<string | null>(null);

  // Check existing auth on mount → skip Step 1 if logged in
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthed(true);
        setEmail(user.email ?? '');
        // Check if they already have a carrier profile
        const res = await fetch('/api/carriers/me');
        if (res.ok) {
          // Already onboarded — redirect to dashboard
          router.replace('/carrier/dashboard');
          return;
        }
        setStep(2);
      }
      setAuthReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleArray<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/carrier/onboard` : undefined;
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
      if (error) return setError(error.message);
      if (data?.user && !data.session) {
        setError('Account created. Please confirm your email then return to this page to continue onboarding.');
        return;
      }
      setIsAuthed(true);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3UploadDoc() {
    if (!insuranceFile) return null;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', insuranceFile);
      fd.append('kind', 'insurance');
      const res = await fetch('/api/carriers/documents', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Upload failed');
        return null;
      }
      setUploadedDocPath(json.path);
      return json.path as string;
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit() {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload insurance doc if not yet
      let docPath = uploadedDocPath;
      if (insuranceFile && !docPath) {
        docPath = await handleStep3UploadDoc();
        if (!docPath) return; // upload error already set
      }

      // 2. Create carrier profile
      const carrierBody: Record<string, any> = {
        businessName,
        abn: abn || null,
        contactPhone: contactPhone || null,
        contactEmail: email || null,
        baseAddress: { state: baseState, suburb: baseSuburb, postcode: basePostcode },
        gstRegistered,
        nhvrAccreditation: nhvr || null,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicy || null,
        insuranceExpiry: insuranceExpiry || null,
        insuranceDocUrl: docPath || null,
        fleetSize,
        regionsServed,
        commoditiesHandled: commodities,
      };

      const res = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carrierBody),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to create carrier profile');
        return;
      }
      const carrierId = json.carrier.id;
      setSubmittedCarrierId(carrierId);

      // 3. Add first vehicle if provided
      if (firstRego.trim()) {
        await fetch('/api/carriers/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rego: firstRego.trim(),
            vehicleType: firstVehicleType,
            capacityTonnes: firstCapacity || null,
          }),
        });
      }

      setStep(5);
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return <div className="page-container"><p>Loading…</p></div>;
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Become a REALM Carrier</h1>
        <p className="page-subtitle">Self-serve onboarding — sign up, submit your details, get verified, start hauling.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 text-xs">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold ${step >= n ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{n}</div>
            <span className={`hidden sm:inline ${step >= n ? 'text-gray-900' : 'text-gray-400'}`}>
              {['Account', 'Business', 'Compliance', 'Fleet', 'Done'][n - 1]}
            </span>
            {n < 5 && <div className={`flex-1 h-px ${step > n ? 'bg-brand-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="card p-4 mb-6 border-red-300 bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {/* Step 1 — Account */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create your account</h2>
          <p className="text-sm text-gray-500">Already have an account? <Link href="/login?redirectTo=/carrier/onboard" className="text-brand-600 underline">Sign in</Link></p>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Continue'}</button>
        </form>
      )}

      {/* Step 2 — Business */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (businessName) setStep(3); else setError('Business name is required'); }} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Business details</h2>
          <div>
            <label className="label">Business name *</label>
            <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" placeholder="ACME Freight Pty Ltd" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">ABN</label>
              <input value={abn} onChange={(e) => setAbn(e.target.value)} className="input" placeholder="11 222 333 444" />
            </div>
            <div>
              <label className="label">Contact phone</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" placeholder="0400 000 000" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Base state</label>
              <select value={baseState} onChange={(e) => setBaseState(e.target.value)} className="input">
                <option value="">Select…</option>
                {AU_STATES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Suburb</label>
              <input value={baseSuburb} onChange={(e) => setBaseSuburb(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input value={basePostcode} onChange={(e) => setBasePostcode(e.target.value)} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={gstRegistered} onChange={(e) => setGstRegistered(e.target.checked)} />
            GST registered
          </label>
          <div className="flex justify-between">
            {isAuthed ? <span /> : <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>}
            <button type="submit" className="btn-primary">Continue</button>
          </div>
        </form>
      )}

      {/* Step 3 — Compliance */}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Compliance & insurance</h2>
          <p className="text-sm text-gray-500">All carriers must hold current public liability and goods-in-transit cover. Upload a copy of your certificate of currency — we review every submission before activating your account.</p>
          <div>
            <label className="label">NHVR accreditation # (if applicable)</label>
            <input value={nhvr} onChange={(e) => setNhvr(e.target.value)} className="input" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Insurance provider</label>
              <input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} className="input" placeholder="NTI / CGU / etc." />
            </div>
            <div>
              <label className="label">Policy number</label>
              <input value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Policy expiry date</label>
            <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Certificate of currency (PDF / image, max 10MB)</label>
            <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => setInsuranceFile(e.target.files?.[0] ?? null)} className="input" />
            {uploadedDocPath && <p className="text-xs text-green-700 mt-1">Uploaded ✓</p>}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button type="submit" className="btn-primary">Continue</button>
          </div>
        </form>
      )}

      {/* Step 4 — Capability */}
      {step === 4 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Fleet & coverage</h2>
          <div>
            <label className="label">Regions served</label>
            <div className="flex flex-wrap gap-2">
              {AU_STATES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setRegionsServed(toggleArray(regionsServed, s.value))}
                  className={`px-3 py-1.5 rounded-full text-sm border ${regionsServed.includes(s.value) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-300'}`}
                >{s.value}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Commodities you handle</label>
            <div className="flex flex-wrap gap-2">
              {COMMODITIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCommodities(toggleArray(commodities, c.value))}
                  className={`px-3 py-1.5 rounded-full text-sm border ${commodities.includes(c.value) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-300'}`}
                >{c.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Fleet size (total vehicles)</label>
            <input type="number" min={1} value={fleetSize} onChange={(e) => setFleetSize(parseInt(e.target.value) || 1)} className="input w-32" />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">First vehicle (you can add more later)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Rego</label>
                <input value={firstRego} onChange={(e) => setFirstRego(e.target.value.toUpperCase())} className="input" placeholder="ABC123" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={firstVehicleType} onChange={(e) => setFirstVehicleType(e.target.value)} className="input">
                  {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Capacity (tonnes)</label>
                <input type="number" min={0} step={0.5} value={firstCapacity} onChange={(e) => setFirstCapacity(e.target.value === '' ? '' : parseFloat(e.target.value))} className="input" />
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary">Back</button>
            <button type="button" onClick={handleFinalSubmit} disabled={loading || !businessName} className="btn-primary">
              {loading ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Done */}
      {step === 5 && (
        <div className="card p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold">You're in the queue</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We've received your application. Our team reviews compliance documents and typically responds within 1 business day.
            You'll get an email when your account is activated.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Link href="/carrier/dashboard" className="btn-primary">Go to dashboard</Link>
            <Link href="/dashboard" className="btn-secondary">Marketplace home</Link>
          </div>
          {submittedCarrierId && <p className="text-xs text-gray-400 pt-2">Reference: {submittedCarrierId.slice(0, 8)}</p>}
        </div>
      )}
    </div>
  );
}

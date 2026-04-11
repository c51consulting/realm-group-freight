'use client';

import { useNotification } from '@/lib/context/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { feedTests as feedTestsApi } from '@/lib/client';
import { useAuth } from '@/lib/context/AuthContext';
import { uploadCertificate } from '@/lib/client-utils';
import type { FeedTestSource, AfiaGrade } from '@/lib/types';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';
import { useState } from 'react';

interface FeedTestUploadProps {
  listingId: string;
  onSuccess?: () => void;
}

interface FeedTestFormValues {
  source: string;
  labName: string;
  testDate: string;
  dryMatter: string;
  moisture: string;
  crudeProtein: string;
  metabolisableEnergy: string;
  ndf: string;
  adf: string;
  digestibility: string;
  afiaGrade: string;
  rfv: string;
  ash: string;
}

/**
 * FeedTestUpload — attach a feed test result (lab or on-farm NIR) to a listing.
 * Optionally upload a lab certificate PDF/image.
 */
export default function FeedTestUpload({ listingId, onSuccess }: FeedTestUploadProps) {
  const { token } = useAuth();
  const { notify } = useNotification();
  const [certFile, setCertFile] = useState<File | null>(null);

  const { values, errors, submitting, handleChange, handleSubmit } = useForm<FeedTestFormValues>({
    initialValues: {
      source: 'lab',
      labName: '',
      testDate: new Date().toISOString().split('T')[0],
      dryMatter: '',
      moisture: '',
      crudeProtein: '',
      metabolisableEnergy: '',
      ndf: '',
      adf: '',
      digestibility: '',
      afiaGrade: '',
      rfv: '',
      ash: '',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      if (!v.source) errs.source = 'Source is required';
      if (v.source === 'lab' && !v.labName) errs.labName = 'Lab name is required for lab tests';
      return errs;
    },
    async onSubmit(v) {
      const feedTest = await feedTestsApi.create({
        listingId,
        source: v.source as FeedTestSource,
        labName: v.labName || undefined,
        testDate: v.testDate || undefined,
        dryMatter: v.dryMatter ? Number(v.dryMatter) : undefined,
        moisture: v.moisture ? Number(v.moisture) : undefined,
        crudeProtein: v.crudeProtein ? Number(v.crudeProtein) : undefined,
        metabolisableEnergy: v.metabolisableEnergy ? Number(v.metabolisableEnergy) : undefined,
        ndf: v.ndf ? Number(v.ndf) : undefined,
        adf: v.adf ? Number(v.adf) : undefined,
        digestibility: v.digestibility ? Number(v.digestibility) : undefined,
        afiaGrade: v.afiaGrade ? (v.afiaGrade as AfiaGrade) : undefined,
        rfv: v.rfv ? Number(v.rfv) : undefined,
        ash: v.ash ? Number(v.ash) : undefined,
      });

      if (certFile && token) {
        await uploadCertificate(feedTest.id, certFile, token);
      }

      notify('Feed test added!', 'success');
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={errors._form} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ft-source" className="label">Test Source *</label>
          <select id="ft-source" name="source" className="input" value={values.source} onChange={handleChange}>
            <option value="lab">Laboratory</option>
            <option value="on_farm_nir">On-farm NIR</option>
            <option value="vendor_estimate">Vendor Estimate</option>
          </select>
        </div>

        {values.source === 'lab' && (
          <div>
            <label htmlFor="ft-lab" className="label">Lab Name *</label>
            <input id="ft-lab" name="labName" type="text" className={`input ${errors.labName ? 'input-error' : ''}`} value={values.labName} onChange={handleChange} placeholder="e.g. Feedtest Australia" />
            {errors.labName && <p className="field-error">{errors.labName}</p>}
          </div>
        )}

        <div>
          <label htmlFor="ft-date" className="label">Test Date</label>
          <input id="ft-date" name="testDate" type="date" className="input" value={values.testDate} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="ft-afia" className="label">AFIA Grade</label>
          <select id="ft-afia" name="afiaGrade" className="input" value={values.afiaGrade} onChange={handleChange}>
            <option value="">— Select —</option>
            {(['A1','A2','B1','B2','C1','C2','D','ungraded'] as AfiaGrade[]).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-700">Nutritional Values (%)</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { name: 'dryMatter', label: 'Dry Matter' },
          { name: 'moisture', label: 'Moisture' },
          { name: 'crudeProtein', label: 'Crude Protein' },
          { name: 'metabolisableEnergy', label: 'ME (MJ/kg)' },
          { name: 'ndf', label: 'NDF' },
          { name: 'adf', label: 'ADF' },
          { name: 'digestibility', label: 'Digestibility' },
          { name: 'ash', label: 'Ash' },
          { name: 'rfv', label: 'RFV' },
        ].map((f) => (
          <div key={f.name}>
            <label htmlFor={`ft-${f.name}`} className="label text-xs">{f.label}</label>
            <input
              id={`ft-${f.name}`}
              name={f.name}
              type="number"
              min={0}
              step={0.01}
              className="input"
              value={values[f.name as keyof FeedTestFormValues]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      {values.source === 'lab' && (
        <div>
          <label htmlFor="ft-cert" className="label">Lab Certificate (PDF or image)</label>
          <input
            id="ft-cert"
            type="file"
            accept=".pdf,image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Uploading…' : 'Add Feed Test'}
      </button>
    </form>
  );
}

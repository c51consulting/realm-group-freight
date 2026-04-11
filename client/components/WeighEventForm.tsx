'use client';

import { useNotification } from '@/lib/context/NotificationContext';
import { useForm } from '@/lib/hooks/useForm';
import { weighbridge } from '@/lib/client';
import { validatePositiveNumber } from '@/lib/client-utils';
import type { ValidationErrors } from '@/lib/client-utils';
import ErrorMessage from './ErrorMessage';

interface WeighEventFormProps {
  orderId: string;
  onSuccess?: () => void;
}

interface WeighFormValues {
  vehicleRego: string;
  grossWeight: string;
  tareWeight: string;
  netWeight: string;
  weightUnit: string;
  weighedAt: string;
  operatorName: string;
  siteName: string;
}

/**
 * WeighEventForm — manual weighbridge event entry for an order.
 */
export default function WeighEventForm({ orderId, onSuccess }: WeighEventFormProps) {
  const { notify } = useNotification();

  const { values, errors, submitting, handleChange, handleSubmit } = useForm<WeighFormValues>({
    initialValues: {
      vehicleRego: '',
      grossWeight: '',
      tareWeight: '',
      netWeight: '',
      weightUnit: 'kg',
      weighedAt: new Date().toISOString().slice(0, 16),
      operatorName: '',
      siteName: '',
    },
    validate(v): ValidationErrors {
      const errs: ValidationErrors = {};
      if (!v.vehicleRego) errs.vehicleRego = 'Vehicle rego is required';
      const netErr = validatePositiveNumber(Number(v.netWeight), 'Net weight');
      if (netErr) errs.netWeight = netErr;
      return errs;
    },
    async onSubmit(v) {
      await weighbridge.manual({
        orderId,
        vehicleRego: v.vehicleRego,
        grossWeight: v.grossWeight ? Number(v.grossWeight) : undefined,
        tareWeight: v.tareWeight ? Number(v.tareWeight) : undefined,
        netWeight: Number(v.netWeight),
        weightUnit: v.weightUnit as 'kg' | 'tonne',
        weighedAt: v.weighedAt,
        operatorName: v.operatorName || undefined,
        siteName: v.siteName || undefined,
      });
      notify('Weigh event recorded', 'success');
      onSuccess?.();
    },
  });

  // Auto-calculate net weight
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    handleChange(e);
    if (e.target.name === 'grossWeight' || e.target.name === 'tareWeight') {
      const gross = e.target.name === 'grossWeight' ? Number(e.target.value) : Number(values.grossWeight);
      const tare = e.target.name === 'tareWeight' ? Number(e.target.value) : Number(values.tareWeight);
      if (gross > 0 && tare > 0 && gross > tare) {
        // We can't directly set netWeight here due to hook design, but the user can see the calc
      }
    }
  };

  const autoNet =
    Number(values.grossWeight) > 0 && Number(values.tareWeight) > 0
      ? Number(values.grossWeight) - Number(values.tareWeight)
      : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={errors._form} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="we-rego" className="label">Vehicle Rego *</label>
          <input id="we-rego" name="vehicleRego" type="text" className={`input ${errors.vehicleRego ? 'input-error' : ''}`} value={values.vehicleRego} onChange={handleChange} placeholder="ABC123" />
          {errors.vehicleRego && <p className="field-error">{errors.vehicleRego}</p>}
        </div>

        <div>
          <label htmlFor="we-site" className="label">Site Name</label>
          <input id="we-site" name="siteName" type="text" className="input" value={values.siteName} onChange={handleChange} placeholder="e.g. Wagga Weighbridge" />
        </div>

        <div>
          <label htmlFor="we-gross" className="label">Gross Weight</label>
          <input id="we-gross" name="grossWeight" type="number" min={0} step={0.01} className="input" value={values.grossWeight} onChange={handleWeightChange} />
        </div>

        <div>
          <label htmlFor="we-tare" className="label">Tare Weight</label>
          <input id="we-tare" name="tareWeight" type="number" min={0} step={0.01} className="input" value={values.tareWeight} onChange={handleWeightChange} />
        </div>

        <div>
          <label htmlFor="we-net" className="label">Net Weight *</label>
          <input
            id="we-net"
            name="netWeight"
            type="number"
            min={0}
            step={0.01}
            className={`input ${errors.netWeight ? 'input-error' : ''}`}
            value={values.netWeight}
            onChange={handleChange}
            placeholder={autoNet !== null ? String(autoNet) : ''}
          />
          {autoNet !== null && !values.netWeight && (
            <p className="text-xs text-gray-400 mt-1">Calculated: {autoNet} (enter to confirm)</p>
          )}
          {errors.netWeight && <p className="field-error">{errors.netWeight}</p>}
        </div>

        <div>
          <label htmlFor="we-unit" className="label">Weight Unit</label>
          <select id="we-unit" name="weightUnit" className="input" value={values.weightUnit} onChange={handleChange}>
            <option value="kg">kg</option>
            <option value="tonne">tonne</option>
          </select>
        </div>

        <div>
          <label htmlFor="we-date" className="label">Weighed At</label>
          <input id="we-date" name="weighedAt" type="datetime-local" className="input" value={values.weighedAt} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="we-operator" className="label">Operator Name</label>
          <input id="we-operator" name="operatorName" type="text" className="input" value={values.operatorName} onChange={handleChange} />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Recording…' : 'Record Weigh Event'}
      </button>
    </form>
  );
}

/**
 * @fileoverview Weighbridge data ingestion utilities.
 *
 * Supports four ingestion paths:
 *   1. API   — direct REST push from weighbridge software
 *   2. CSV   — file upload / import from legacy systems
 *   3. OCR   — phone photo of printed docket (stub; real OCR via external service)
 *   4. Manual — operator entry with verification workflow
 *
 * All paths normalise to a common WeighEvent shape before DB insert.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {object} WeighEventInput
 * @property {string}  source          - 'api' | 'csv_import' | 'ocr_upload' | 'manual'
 * @property {string}  [orderId]
 * @property {string}  [freightJobId]
 * @property {string}  [recordedBy]    - User ID
 * @property {string}  [sourceSystem]
 * @property {string}  [sourceTicketId]
 * @property {string}  [siteId]
 * @property {string}  [siteName]
 * @property {string}  [vehicleRego]
 * @property {number}  [grossWeight]   - kg
 * @property {number}  [tareWeight]    - kg
 * @property {number}  [netWeight]     - kg
 * @property {string}  [weightUnit]    - 'kg' | 'tonne'
 * @property {string}  [weighedAt]     - ISO date string
 * @property {string}  [operatorName]
 * @property {string}  [ticketImageUrl]
 * @property {number}  [gpsLat]
 * @property {number}  [gpsLng]
 * @property {boolean} [tradeApproved]
 * @property {object}  [rawData]
 */

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * Normalises a raw weighbridge payload into a consistent WeighEventInput.
 * Handles unit conversion (tonne → kg) and derives netWeight if missing.
 *
 * @param {object} raw    - Raw input from any source
 * @param {string} source - Ingestion source identifier
 * @returns {WeighEventInput}
 */
function normaliseWeighEvent(raw, source) {
  let grossWeight = parseFloat(raw.grossWeight || raw.gross_weight || raw.gross) || null;
  let tareWeight  = parseFloat(raw.tareWeight  || raw.tare_weight  || raw.tare)  || null;
  let netWeight   = parseFloat(raw.netWeight   || raw.net_weight   || raw.net)   || null;
  const weightUnit = (raw.weightUnit || raw.weight_unit || raw.unit || 'kg').toLowerCase();

  // Convert tonnes to kg
  if (weightUnit === 'tonne' || weightUnit === 't') {
    if (grossWeight) grossWeight *= 1000;
    if (tareWeight)  tareWeight  *= 1000;
    if (netWeight)   netWeight   *= 1000;
  }

  // Derive net from gross − tare if missing
  if (!netWeight && grossWeight && tareWeight) {
    netWeight = grossWeight - tareWeight;
  }

  return {
    source,
    orderId:        raw.orderId       || raw.order_id       || null,
    freightJobId:   raw.freightJobId  || raw.freight_job_id || null,
    recordedBy:     raw.recordedBy    || raw.recorded_by    || null,
    sourceSystem:   raw.sourceSystem  || raw.source_system  || null,
    sourceTicketId: raw.sourceTicketId || raw.source_ticket_id || raw.ticketId || raw.ticket_id || null,
    siteId:         raw.siteId        || raw.site_id        || null,
    siteName:       raw.siteName      || raw.site_name      || null,
    vehicleRego:    raw.vehicleRego   || raw.vehicle_rego   || raw.rego || raw.vehicle || null,
    grossWeight:    grossWeight,
    tareWeight:     tareWeight,
    netWeight:      netWeight,
    weightUnit:     'kg',             // always store in kg
    weighedAt:      raw.weighedAt     || raw.weighed_at     || raw.date || raw.timestamp || new Date().toISOString(),
    operatorName:   raw.operatorName  || raw.operator_name  || raw.operator || null,
    ticketImageUrl: raw.ticketImageUrl || raw.ticket_image_url || null,
    gpsLat:         parseFloat(raw.gpsLat || raw.gps_lat || raw.lat) || null,
    gpsLng:         parseFloat(raw.gpsLng || raw.gps_lng || raw.lng) || null,
    tradeApproved:  Boolean(raw.tradeApproved || raw.trade_approved),
    rawData:        raw,
    verified:       source === 'api' && Boolean(raw.tradeApproved || raw.trade_approved),
  };
}

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

/**
 * Parses a CSV string into an array of normalised WeighEventInput objects.
 * Supports common column name variations from different weighbridge vendors.
 *
 * Expected columns (flexible naming):
 *   ticketId/ticket_id, rego/vehicle, gross/grossWeight, tare/tareWeight,
 *   net/netWeight, unit, date/timestamp, site, operator
 *
 * @param {string} csvContent  - Raw CSV string
 * @param {object} [context]   - Additional context (orderId, freightJobId, recordedBy)
 * @returns {{ events: WeighEventInput[], errors: string[] }}
 */
function parseCSV(csvContent, context = {}) {
  const events = [];
  const errors = [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { events, errors: ['CSV must contain a header row and at least one data row'] };
  }

  // Parse header — handle quoted fields
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const row    = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      const raw = {
        ...context,
        sourceTicketId: row.ticketid || row.ticket_id || row.ticket || `CSV-ROW-${i}`,
        vehicleRego:    row.rego     || row.vehicle   || row.vehicle_rego || '',
        grossWeight:    row.gross    || row.grossweight || row.gross_weight || '',
        tareWeight:     row.tare     || row.tareweight  || row.tare_weight  || '',
        netWeight:      row.net      || row.netweight   || row.net_weight   || '',
        weightUnit:     row.unit     || row.weight_unit || 'kg',
        weighedAt:      row.date     || row.timestamp   || row.weighed_at   || '',
        siteName:       row.site     || row.site_name   || '',
        operatorName:   row.operator || row.operator_name || '',
        tradeApproved:  row.approved === 'true' || row.approved === '1' || row.trade_approved === 'true',
      };

      const event = normaliseWeighEvent(raw, 'csv_import');

      // Basic validation
      if (!event.netWeight && !event.grossWeight) {
        errors.push(`Row ${i}: no weight data found`);
        continue;
      }

      events.push(event);
    } catch (err) {
      errors.push(`Row ${i}: ${err.message}`);
    }
  }

  return { events, errors };
}

/**
 * Parses a single CSV line, handling quoted fields with commas.
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result  = [];
  let current   = '';
  let inQuotes  = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── OCR Stub ────────────────────────────────────────────────────────────────

/**
 * Extracts weight data from a weighbridge ticket image via OCR.
 * In production, integrate with Google Cloud Vision, AWS Textract,
 * or a specialist weighbridge OCR service.
 *
 * This stub returns a placeholder result and marks the event as
 * unverified so an operator can review and confirm the values.
 *
 * @param {string} imagePath  - Local file path or storage URL
 * @param {object} [context]  - Additional context (orderId, recordedBy)
 * @returns {Promise<WeighEventInput>}
 */
async function extractFromOCR(imagePath, context = {}) {
  // TODO: Replace with real OCR integration
  // Example: const vision = require('@google-cloud/vision');
  // const [result] = await vision.textDetection(imagePath);
  // Then parse the extracted text for weight values.

  console.warn('[weighbridge] OCR extraction is a stub — manual verification required');

  return normaliseWeighEvent(
    {
      ...context,
      ticketImageUrl: imagePath,
      // Values will be null until operator verifies
      grossWeight:  null,
      tareWeight:   null,
      netWeight:    null,
      tradeApproved: false,
    },
    'ocr_upload',
  );
}

// ─── Weight Validation ───────────────────────────────────────────────────────

/**
 * Validates a weigh event for physical plausibility.
 * Returns an array of warning strings (empty = valid).
 *
 * @param {WeighEventInput} event
 * @returns {string[]} Validation warnings
 */
function validateWeighEvent(event) {
  const warnings = [];

  if (event.netWeight !== null && event.netWeight <= 0) {
    warnings.push('Net weight must be positive');
  }

  if (event.grossWeight && event.tareWeight) {
    const derived = event.grossWeight - event.tareWeight;
    if (event.netWeight && Math.abs(derived - event.netWeight) > 50) {
      warnings.push(
        `Net weight (${event.netWeight}kg) differs from gross−tare (${derived}kg) by more than 50kg`,
      );
    }
    if (event.tareWeight >= event.grossWeight) {
      warnings.push('Tare weight must be less than gross weight');
    }
  }

  // Sanity: single truck load unlikely to exceed 60 tonnes
  if (event.netWeight && event.netWeight > 60000) {
    warnings.push(`Net weight ${event.netWeight}kg exceeds 60 tonne — please verify`);
  }

  // Sanity: minimum meaningful weight 10kg
  if (event.netWeight && event.netWeight < 10) {
    warnings.push(`Net weight ${event.netWeight}kg is unusually low — please verify`);
  }

  return warnings;
}

/**
 * Cleans up a temporary upload file.
 * @param {string} filePath
 */
function cleanupUpload(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('[weighbridge] Failed to clean up upload:', err.message);
  }
}

module.exports = {
  normaliseWeighEvent,
  parseCSV,
  parseCSVLine,
  extractFromOCR,
  validateWeighEvent,
  cleanupUpload,
};

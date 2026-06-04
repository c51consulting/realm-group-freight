#!/usr/bin/env node
/**
 * Import REALM Carrier Network CSV into carrier_directory table.
 * Uses the Supabase REST API directly via fetch (no SDK dependency).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node tools/import-carrier-directory.mjs ./data/REALM_Carrier_Network_Australia.csv
 *
 * Idempotent: upserts on realm_record_id.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node tools/import-carrier-directory.mjs <path/to/csv>');
  process.exit(1);
}

// --- CSV parser (RFC 4180) ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

function parseRegions(s) {
  if (!s) return [];
  const u = s.toUpperCase();
  if (u.includes('AUSTRALIA WIDE') || u.includes('NATIONAL') || u.includes('ALL STATES')) {
    return ['ALL'];
  }
  const tags = new Set();
  for (const st of AU_STATES) {
    if (new RegExp(`\\b${st}\\b`).test(u)) tags.add(st);
  }
  return [...tags];
}

function parseList(s) {
  if (!s) return [];
  return s
    .split(/[,;]/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const raw = readFileSync(resolve(csvPath), 'utf8');
const rows = parseCSV(raw);
const header = rows.shift();
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const slugSeen = new Map();
function uniqueSlug(name) {
  const base = slugify(name);
  const n = (slugSeen.get(base) || 0) + 1;
  slugSeen.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

const records = rows.map(r => {
  const get = k => (r[idx[k]] || '').trim();
  const operatorName = get('operator_name');
  return {
    realm_record_id: get('realm_record_id'),
    operator_name: operatorName,
    slug: uniqueSlug(operatorName),
    address: get('address') || null,
    phone: get('phone') || null,
    email: /@/.test(get('email')) ? get('email').toLowerCase() : null,
    digital_contact_type: get('digital_contact_type') || null,
    website: get('website') || null,
    carrier_type: get('carrier_type') || null,
    carrier_type_tags: parseList(get('carrier_type')),
    equipment_and_services: get('equipment_and_services') || null,
    equipment_tags: parseList(get('equipment_and_services')),
    operating_regions: get('operating_regions') || null,
    region_tags: parseRegions(get('operating_regions')),
    pos_matching_fit: get('pos_matching_fit') || null,
    country: get('country') || 'Australia',
    verification_status:
      get('verification_status').toLowerCase().includes('verified') ? 'verified' :
      get('verification_status').toLowerCase().includes('flagged') ? 'flagged' :
      'unverified',
    confidence: get('confidence') || null,
    source_urls: get('source_urls') || null,
    research_subject: get('research_subject') || null,
    is_published: true,
  };
});

console.log(`Parsed ${records.length} records. Upserting via PostgREST...`);

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/carrier_directory?on_conflict=realm_record_id`;
const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(records),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  console.error(text);
  process.exit(1);
}

let data;
try { data = JSON.parse(text); } catch { data = []; }
console.log(`✅ Upserted ${Array.isArray(data) ? data.length : records.length} carriers.`);
if (Array.isArray(data) && data.length) {
  console.log('Sample:', data.slice(0, 3).map(d => `${d.realm_record_id} → ${d.slug}`).join(', '));
}

#!/usr/bin/env node
/**
 * Import REALM Carrier Network CSV into carrier_directory table.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node tools/import-carrier-directory.mjs ./data/REALM_Carrier_Network_Australia_verified_contacts.csv
 *
 * Idempotent: upserts on realm_record_id.
 */

import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// --- CSV parser (RFC 4180, handles quoted fields with commas/newlines) ---
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

// --- Parsers for the free-text columns into clean tags ---
const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

function parseRegions(s) {
  if (!s) return [];
  const u = s.toUpperCase();
  if (u.includes('AUSTRALIA WIDE') || u.includes('NATIONAL') || u.includes('ALL STATES')) {
    return ['ALL'];
  }
  const tags = new Set();
  for (const st of AU_STATES) {
    const re = new RegExp(`\\b${st}\\b`);
    if (re.test(u)) tags.add(st);
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
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// --- Main ---
const raw = readFileSync(resolve(csvPath), 'utf8');
const rows = parseCSV(raw);
const header = rows.shift();
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const required = [
  'realm_record_id','operator_name','address','phone','email','digital_contact_type',
  'website','carrier_type','equipment_and_services','operating_regions','pos_matching_fit',
  'country','verification_status','confidence','source_urls','research_subject',
];
for (const r of required) {
  if (!(r in idx)) {
    console.error(`Missing required column: ${r}`);
    process.exit(1);
  }
}

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

console.log(`Parsed ${records.length} records. Upserting...`);

const { data, error } = await supabase
  .from('carrier_directory')
  .upsert(records, { onConflict: 'realm_record_id' })
  .select('id, realm_record_id');

if (error) {
  console.error('Upsert error:', error);
  process.exit(1);
}
console.log(`✅ Upserted ${data.length} carriers.`);

// REALM Edge Gateway
// Reads weight readings from a serial-attached weighbridge indicator and POSTs
// them to the REALM Group Freight ingest API.
//
// Supported protocols: rinstrum, mettler-cont, sics, generic
//
// Run: node index.js

import 'dotenv/config';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const {
  REALM_INGEST_URL,
  REALM_DEVICE_KEY,
  SERIAL_PORT,
  SERIAL_BAUD = '9600',
  INDICATOR_PROTOCOL = 'generic',
  STABLE_WINDOW_MS = '2000',
  WEIGHBRIDGE_ID,
  DIRECTION_DEFAULT = 'in',
} = process.env;

if (!REALM_INGEST_URL || !REALM_DEVICE_KEY || !SERIAL_PORT) {
  console.error('Missing REALM_INGEST_URL, REALM_DEVICE_KEY, or SERIAL_PORT in env');
  process.exit(1);
}

const stableMs = parseInt(STABLE_WINDOW_MS, 10);

let lastWeight = null;
let lastChangeAt = Date.now();
let lastSent = null;

function parseLine(line) {
  // Returns { kg, motion } or null
  const s = line.trim();
  if (!s) return null;

  switch (INDICATOR_PROTOCOL) {
    case 'rinstrum': {
      // Typical Rinstrum print frame: 'GROSS    1234.5 kg' or '+0001234kg'
      const m = s.match(/([+-]?\d+(?:\.\d+)?)\s*(kg|t|lb)?/i);
      if (!m) return null;
      const val = parseFloat(m[1]);
      const unit = (m[2] || 'kg').toLowerCase();
      const kg = unit === 't' ? val * 1000 : unit === 'lb' ? val * 0.453592 : val;
      return { kg: Math.round(kg), motion: /MOTION|M/.test(s) };
    }
    case 'mettler-cont': {
      // Mettler continuous: STX, status, weight (6), tare (6), CR
      // Status byte bit 0 = stable when 0
      const m = s.match(/([+-]?\d+(?:\.\d+)?)/);
      if (!m) return null;
      return { kg: Math.round(parseFloat(m[1])), motion: /M/.test(s) };
    }
    case 'sics': {
      // 'S S      0.000 kg' or 'S D' (dynamic/motion)
      const m = s.match(/^S\s+([SD])\s+([+-]?\d+(?:\.\d+)?)\s*(kg|t)?/i);
      if (!m) return null;
      const motion = m[1] === 'D';
      const val = parseFloat(m[2]);
      const unit = (m[3] || 'kg').toLowerCase();
      const kg = unit === 't' ? val * 1000 : val;
      return { kg: Math.round(kg), motion };
    }
    default: {
      const m = s.match(/([+-]?\d+(?:\.\d+)?)/);
      if (!m) return null;
      return { kg: Math.round(parseFloat(m[1])), motion: false };
    }
  }
}

async function postReading({ kg }) {
  const payload = {
    device_key: REALM_DEVICE_KEY,
    weighbridge_id: WEIGHBRIDGE_ID || undefined,
    gross_kg: kg,
    direction: DIRECTION_DEFAULT,
    captured_at: new Date().toISOString(),
    source: `edge-gateway:${INDICATOR_PROTOCOL}`,
  };
  try {
    const res = await fetch(REALM_INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-key': REALM_DEVICE_KEY,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`[${new Date().toISOString()}] -> ${res.status} ${text.slice(0, 160)}`);
  } catch (e) {
    console.error('POST failed:', e.message);
  }
}

const port = new SerialPort({ path: SERIAL_PORT, baudRate: parseInt(SERIAL_BAUD, 10) });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => console.log(`Serial open ${SERIAL_PORT} @ ${SERIAL_BAUD} (${INDICATOR_PROTOCOL})`));
port.on('error', (e) => console.error('Serial error:', e.message));

parser.on('data', (line) => {
  const r = parseLine(line);
  if (!r) return;
  if (r.motion) { lastChangeAt = Date.now(); lastWeight = r.kg; return; }
  if (lastWeight !== r.kg) { lastWeight = r.kg; lastChangeAt = Date.now(); return; }
  // stable if weight unchanged for stableMs and not equal to last sent
  if (Date.now() - lastChangeAt >= stableMs && lastSent !== r.kg && r.kg > 0) {
    lastSent = r.kg;
    postReading({ kg: r.kg });
  }
});

process.on('SIGINT', () => { port.close(); process.exit(0); });

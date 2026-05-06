# REALM Edge Gateway

Reference scripts to bridge a physical weighbridge indicator (Rinstrum, Mettler Toledo, Avery Weigh-Tronix, Rice Lake, Accuweigh, Tru-Test) to the REALM Group Freight ingest API.

## How it works

```
[Scale indicator] --(RS-232/RS-485 or TCP)--> [Edge gateway PC / Raspberry Pi] --(HTTPS)--> POST /api/weighbridge/ingest
```

- The gateway parses the indicator's serial stream (typically Rinstrum RS-232 9600 8N1, or Mettler Continuous Output / SICS).
- It debounces stable readings (weight unchanged for ~2 s, motion bit clear).
- On a stable capture (or when the operator hits 'PRINT'), it POSTs JSON to REALM with the device key.

## Install (Raspberry Pi / any Linux box with USB-RS232)

```bash
sudo apt update && sudo apt install -y nodejs npm
cd tools/edge-gateway
npm install
cp .env.example .env   # edit with your device key + serial port
npm start
```

## Environment variables

| Var | Example | Notes |
|---|---|---|
| REALM_INGEST_URL | https://realm-ag-marketplace-production.up.railway.app/api/weighbridge/ingest | Production endpoint |
| REALM_DEVICE_KEY | wbk_live_... | Generated via /admin/weighbridges |
| SERIAL_PORT | /dev/ttyUSB0 | Or COM3 on Windows |
| SERIAL_BAUD | 9600 | Match indicator |
| INDICATOR_PROTOCOL | rinstrum | rinstrum, mettler-cont, sics, generic |
| STABLE_WINDOW_MS | 2000 | Debounce window |

## Supported indicator protocols

- Rinstrum R300/R400/R500: ASCII frames at 9600 8N1.
- Mettler Toledo Continuous Output: status byte for motion/over/under.
- Mettler SICS: query/response (SI -> S S 0.000 kg).
- Generic line-based: any indicator emitting <weight><unit>\n.

## Operator workflow

1. Add the weighbridge in /admin/weighbridges.
2. Add a device; copy the one-time device key.
3. Drop the key into .env on the gateway box.
4. Wire RS-232 from the indicator to a USB-serial adapter.
5. npm start (or install as systemd - see realm-edge.service).
6. Confirm the reading appears on a test order's WeighbridgeTimeline.

## Security

- Device key is per-device. Rotate via /admin/weighbridges.
- Gateway only needs outbound HTTPS (443). No inbound ports.

# REALM Group Freight - Integrations Catalogue

This folder catalogues every weighbridge / telematics / saleyard / grain handler integration we target, plus the API access process and outreach templates for each.

All integrations terminate at one of two endpoints:

- `POST /api/weighbridge/ingest` (canonical, header `x-device-key`)
- `POST /api/weighbridge/ingest/zapier` (low-code adapter, flexible field names)

## Categories

1. **Telematics platforms** (in-truck, fastest path)
   - Geotab (MyGeotab API)
   - Teletrac Navman (DIRECTOR API)
   - EROAD (REST API)
   - Webfleet (Webfleet.connect)
   - MTData / Procon (REST)
   - Trimble TMT (REST)

2. **Weighbridge software vendors**
   - AccuWeigh WinWeigh / WeighWiz (ODBC + CSV export)
   - Active Weighing AWS (REST)
   - Sicom (REST)
   - Precia Molen i-Site (REST)
   - Weightron Bilanciai (CSV/SFTP)
   - Mettler Toledo Datapac (ODBC)

3. **Indicator hardware (via edge gateway)**
   - Rinstrum R300/R400/R500
   - Mettler Toledo IND-series
   - Avery Weigh-Tronix ZM-series
   - Rice Lake 880/882
   - Tru-Test / Datamars (livestock)

4. **Grain handlers / public networks**
   - GrainCorp LoadNet (carrier + grower feeds)
   - CBH LoadNet / CDF (WA)
   - Viterra eDocs (SA)
   - AWB / Cargill / Riordan / Manildra (per-site)

5. **Saleyards (livestock)**
   - ALPA member yards (NLIS-linked)
   - Roma, Wodonga, Pakenham, Dalby, etc.

See individual files in this folder for outreach templates and integration spec per partner.

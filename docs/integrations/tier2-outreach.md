# Tier 2 - Vendor Software API Outreach Pack

Target list: 9 Australian weighbridge software vendors. Send order: NWI WinWeigh, NUWEIGH ClearWeigh, Diverseco, Mettler-Toledo, Weigh-More EzyWeigh, iWeigh, Gendio, SRO Technology, Precia Molen.

From details (fill once):
- From: <<Your name>>, Founder, REALM Group Freight / C51 Consulting Pty Ltd
- Email: <<you@c51consulting.com>>
- Phone: <<+61 4xx xxx xxx>>
- Platform: https://realm-ag-marketplace-production.up.railway.app

---

## 1. NWI Group (WinWeigh)
To: info@nwigroup.com.au
Cc: amelia.larkin@nationalweighing.com.au
Subject: WinWeigh <-> REALM Group Freight API integration - partnership enquiry

Body:
Hi NWI team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural marketplace and freight verification platform (https://realm-ag-marketplace-production.up.railway.app). We give growers, buyers, and transport operators real-time, tamper-evident proof-of-movement on every load by ingesting weighbridge + telematics data directly into the order record.

A number of sites we are onboarding already run WinWeigh, and your integration page mentions REST API + CSV export with Xero, MYOB, Pronto, Dynamics and SAP connectors. We'd like to add REALM Group Freight as a first-class WinWeigh integration target.

Proposed flow:
1. Site operator authorises the connection in their WinWeigh portal.
2. WinWeigh pushes each finalised ticket (gross/tare/net, vehicle, docket, commodity, timestamp) to our REST endpoint.
3. REALM links the ticket to the order and surfaces it instantly to both shipper and receiver.

We have the endpoint ready (POST /api/weighbridge/ingest with per-site device key) plus a low-code adapter (/api/weighbridge/ingest/zapier) that accepts flexible field names.

Could you connect me with whoever owns the WinWeigh integration roadmap? Happy to share our architecture doc and co-author a short integration guide for your customers.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 2. NWS NUWEIGH (ClearWeigh)
To: sales@nuweigh.com.au
Cc: sales@nws.com.au
Subject: ClearWeigh <-> REALM Group Freight integration - ticket data sync

Body:
Hi NUWEIGH team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural freight + marketplace platform (https://realm-ag-marketplace-production.up.railway.app). We verify every load with real-time weighbridge + telematics data linked to live orders.

Your ClearWeigh product highlights flexible integration with third-party business systems. We'd like to become one of those targets - several operators we're onboarding already run ClearWeigh, so an official integration would save everyone time.

When a ticket is finalised in ClearWeigh, push it to our REST endpoint (gross/tare/net, vehicle rego, docket, commodity, timestamp, site). We've built an adapter that maps common field names automatically.

Can you connect me with your software dev team to scope this? Happy to share architecture + sandbox device key.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 3. Diverseco
To: info@diverseco.com.au
Subject: Weighbridge software integration - REALM Group Freight (agtech platform)

Body:
Hi Diverseco team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural freight + marketplace platform (https://realm-ag-marketplace-production.up.railway.app). We link weighbridge and telematics data to live orders so every load has tamper-evident proof.

Diverseco supplies and services a large share of AU trade-legal weighbridges. We'd like to formalise an integration so your customers can opt-in to push ticket data straight to REALM.

What we accept (whichever is easiest for you): REST push, CSV/SFTP drop, or ODBC pull. Fields: gross/tare/net kg, vehicle rego, docket, commodity, site ID, timestamp. Our adapter tolerates almost any field naming.

Could you route this to whoever owns integrations / software partnerships at Diverseco? Happy to share architecture and a one-page benefits summary for your customer base.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 4. Mettler-Toledo Australia (Datapac / IND)
To: info.mtaus@mt.com
Subject: Datapac / IND weighbridge integration - REALM Group Freight API

Body:
Hi Mettler-Toledo Australia team,
I'm <<Your name>>, founder of REALM Group Freight - an AU agricultural marketplace and freight verification platform (https://realm-ag-marketplace-production.up.railway.app). We ingest weighbridge and telematics data in real time to give shippers, receivers, and finance counterparties tamper-evident load confirmation.

A meaningful share of our pipeline sits on Mettler-Toledo IND-series indicators and Datapac. With the operator's authorisation we'd like Datapac to push (or let us poll) finalised ticket data to our REST endpoint.

Could you connect me with your weighbridge solutions team (I understand John Beard leads this area) to scope an API or ODBC path? We support:
- Direct Datapac SQL / ODBC pull
- SICS query/response at the indicator (via our edge gateway)
- Vendor-side REST push to /api/weighbridge/ingest

Happy to share architecture and a sandbox device key.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 5. Weigh-More Solutions / AWS (EzyWeigh)
To: sales@weigh-more.com.au
Subject: EzyWeigh <-> REALM Group Freight - API / SFTP integration

Body:
Hi Weigh-More team,
I'm <<Your name>>, founder of REALM Group Freight (https://realm-ag-marketplace-production.up.railway.app) - an Australian agricultural marketplace + freight verification platform. We link live weighbridge and telematics data to orders so every load has tamper-evident proof.

Your EzyWeigh platform mentions secure FTP + real-time API. We'd like to add REALM as an integration target so your customers can auto-push ticket data to our platform in one authorisation step.

We need: finalised ticket (gross/tare/net, vehicle, docket, commodity, timestamp, site). REST POST or scheduled SFTP - whichever you already support. Our adapter endpoint tolerates flexible field names.

Could you connect me with whoever owns EzyWeigh integrations? Happy to share architecture + sample payload.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 6. iWeigh Solutions
To: support@iweighsoftware.com.au
Subject: iWeigh <-> REALM Group Freight integration partnership

Body:
Hi iWeigh team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural marketplace + freight verification platform (https://realm-ag-marketplace-production.up.railway.app).

You service transfer stations and weighbridges across AU with cameras, unmanned driver stations, and weighbridge software - operating 24/7. That's exactly the shipper/receiver loop we're trying to close on the marketplace side.

With your customer's authorisation we'd love iWeigh to push finalised ticket data to our REST endpoint so it auto-links to the active freight order on REALM.

Could you connect me with whoever owns software integrations at iWeigh? I can share architecture, sample payload, and sandbox device key.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 7. Gendio Weighbridges
To: sales@gendio.com.au
Cc: (optional) Peter Hallam +61 429 902 346
Subject: Gendio weighbridge software <-> REALM Group Freight API

Body:
Hi Gendio / Hallam team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural marketplace and freight verification platform (https://realm-ag-marketplace-production.up.railway.app). We pair weighbridge + telematics data with live orders so both sides get tamper-evident load confirmation.

Gendio is NMI-accredited and supplies a solid share of regional AU sites - many already in our pipeline. We'd like to set up a simple integration so your customers can opt-in to push finalised ticket data (gross/tare/net, vehicle, docket, commodity, timestamp) to our REST endpoint.

We accept REST, SFTP CSV, or ODBC pull. Our low-code adapter tolerates flexible field names so usually no schema change on your side.

Happy to share architecture and a sandbox device key. Could you connect me with whoever owns software development at Gendio?

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 8. SRO Technology
To: sales@srotechnology.com
Cc: service@srotechnology.com
Subject: Weighbridge software integration - REALM Group Freight

Body:
Hi SRO Technology team,
I'm <<Your name>>, founder of REALM Group Freight (https://realm-ag-marketplace-production.up.railway.app) - an Australian agricultural marketplace + freight verification platform. We link weighbridge and telematics data to live orders for real-time proof-of-movement.

SRO services and integrates weighbridge software across AU. We'd like to formalise a push integration so your customers can opt-in to sync ticket data (gross/tare/net, vehicle, docket, commodity, timestamp) straight to REALM.

We support REST, SFTP CSV, and ODBC. Our adapter tolerates flexible field names so usually no schema change required.

Could you connect me with whoever owns integrations / software partnerships? Happy to share architecture + sample payload.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## 9. Precia Molen Australia
To: (submit via contact form at https://au.preciamolen.com/ - no public email)
Alt: phone +61 2 8006 8037, or LinkedIn Precia Molen Australia (Artarmon NSW)
Subject: i-Site <-> REALM Group Freight integration partnership enquiry

Body:
Hi Precia Molen Australia team,
I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural marketplace and freight verification platform (https://realm-ag-marketplace-production.up.railway.app).

Precia Molen i-Site is in use across several sites in our onboarding pipeline. We'd like to add REALM as an integration target so your customers can push finalised ticket data (gross/tare/net, vehicle, docket, commodity, timestamp) to our REST endpoint with a single authorisation step.

We support REST, SFTP CSV, and ODBC pull - whichever i-Site already exposes. Our adapter tolerates flexible field names so integration effort is minimal.

As this is coming via your contact form, could you route to whoever owns i-Site integrations in APAC? Happy to share architecture and a sandbox device key.

Thanks,
<<Your name>>
<<email>> | <<phone>>
REALM Group Freight | C51 Consulting Pty Ltd

---

## Follow-up template (day +7, same thread with 'Re:')

Hi <<first name>>,
Just floating this back to the top of your inbox - we're formalising the REALM Group Freight integration roadmap for the next quarter and would love to include <<Vendor>> in the first wave.
Happy to jump on a 15-minute call if easier than email - let me know a time.
Thanks, <<Your name>>

---

## Tracking

Log each send in a spreadsheet with columns:
Vendor | To | Cc | Sent | Reply | Status | Next action | Notes

Status values: sent, acked, in discussion, scoping, integrating, live, declined, no response.
Follow-up at day 7 and day 14. After day 21 with no reply, park and retry via LinkedIn InMail to the vendor's software lead.

# API Partner Outreach Templates

Use these templates verbatim or as a starting point. Replace `<<...>>` placeholders.

Sender details (default):
- Company: REALM Group Freight (a C51 Consulting Pty Ltd venture)
- Contact: <<Your name>>, Founder
- Email: <<you@c51consulting.com>>
- Platform URL: https://realm-ag-marketplace-production.up.railway.app
- Use case: real-time weighbridge + freight verification for AU agricultural supply chains

---

## 1. Geotab (MyGeotab API / Marketplace)

**Where to apply:** https://www.geotab.com/marketplace/become-a-partner/  
**Developer docs:** https://developers.geotab.com/  
**API style:** JSON-RPC over HTTPS, MyGeotab credentials per database.

**Email subject:** REALM Group Freight - MyGeotab integration partner request (AU agriculture)

```
Hi Geotab Partnerships team,

I'm <<Your name>>, founder of REALM Group Freight - an Australian agricultural
freight and marketplace platform connecting growers, buyers, and transport
operators (https://realm-ag-marketplace-production.up.railway.app).

We are building real-time weight + GPS verification on every freight movement
so both shipper and receiver get instant, tamper-evident confirmation when a
truck passes through a weighbridge or hits a delivery point.

Many of our transport partners already run MyGeotab. We would like to:
  1. Read GetFeed data for DeviceStatusInfo, ExceptionEvent, and StatusData
     (axle weight where available) for vehicles authorised by their owners.
  2. Push these readings to our /api/weighbridge/ingest endpoint.

Could you point me to the appropriate Add-In / Marketplace pathway and any
reseller / ISV agreement we need to sign? Happy to share architecture docs and
a demo environment.

Thanks,
<<Your name>>
```

---

## 2. Teletrac Navman (DIRECTOR API / Connect)

**Where to apply:** https://www.teletracnavman.com.au/contact (request DIRECTOR API access)  
**Developer portal:** https://help.teletracnavman.com/director-api  
**API style:** REST + OAuth2.

**Email subject:** DIRECTOR API integration request - REALM Group Freight (AU agtech)

```
Hi Teletrac Navman team,

REALM Group Freight is an Australian agricultural marketplace and freight
verification platform. We are integrating telematics + weighbridge data to
provide instant, tamper-evident proof-of-movement on every load.

A significant portion of our transport partners run Teletrac Navman DIRECTOR.
With their consent we would like API access to:
  - Vehicle position and trip events
  - On-board mass / axle weight (where the unit reports it)
  - Driver hours / status changes for compliance evidence

Could you confirm:
  1. The application path for ISV / partner DIRECTOR API credentials
  2. Whether OEM mass data is available via DIRECTOR or only via the unit's
     CAN feed
  3. Any partner agreement requirements

We already publish a public ingest endpoint that can accept DIRECTOR webhooks
or we can poll the API on a schedule.

Thanks,
<<Your name>>
<<email>> | <<phone>>
```

---

## 3. GrainCorp (LoadNet carrier / grower API)

**Where to apply:** https://www.graincorp.com.au/contact-us/ (Grower Services / Digital)  
**Portal:** https://www.loadnet.com.au/  
**API style:** Auth'd REST / EDI feed for registered carriers and growers.

**Email subject:** LoadNet API access for REALM Group Freight (carrier + grower data)

```
Hi GrainCorp Digital / Grower Services team,

I'm reaching out from REALM Group Freight, an Australian agricultural
marketplace platform (https://realm-ag-marketplace-production.up.railway.app)
that verifies grain movements end-to-end with weighbridge + telematics data
for growers, buyers, and carriers.

Many of our users move grain through GrainCorp sites. With explicit grower
/ carrier authorisation, we would like API or EDI access to LoadNet ticket
data - specifically:
  - Site, date/time, vehicle, ticket number
  - Gross / tare / net weight, commodity, grade
  - NGR / delivery reference

We will only ingest data for parties who have authorised us via their REALM
account. Could you point me to:
  1. The LoadNet API / EDI partner program contact
  2. Required agreements (DPA, technical questionnaire)
  3. Sandbox access for development

Thanks,
<<Your name>>
<<email>>
```

---

## 4. CBH Group (LoadNet WA / CDF)

**Where to apply:** https://www.cbh.com.au/contact-us (Digital / Grower Services)  
**Portal:** https://loadnet.cbh.com.au/  
**API style:** Auth'd REST / file feed for registered growers and carriers.

**Email subject:** LoadNet (CBH) API access for REALM Group Freight

```
Hi CBH Digital team,

REALM Group Freight is an Australian agricultural freight + marketplace
platform. We provide growers, buyers, and carriers real-time, tamper-evident
verification of grain movements via weighbridge and telematics data.

With grower / carrier authorisation we would like API or scheduled file feed
access to CBH LoadNet ticket / CDF data:
  - Site, date/time, vehicle, docket number
  - Gross / tare / net weight, commodity, grade, segregation

Could you point me to:
  1. The LoadNet / digital partner contact at CBH
  2. The application process and any required agreements
  3. Whether sandbox / test data is available

We are happy to mirror your authentication and audit requirements (per-grower
consent, full audit log, SOC2-style controls).

Thanks,
<<Your name>>
<<email>>
```

---

## 5. Generic operator outreach (small/regional weighbridge or saleyard)

**Email subject:** Free real-time weighbridge integration with REALM Group Freight

```
Hi <<Operator name>>,

I'm <<Your name>> from REALM Group Freight. We connect Australian growers,
buyers, and transport operators - and we provide a free weighbridge
integration so the loads passing through your scale are automatically
verified on our platform.

Three quick questions to scope the integration:
  1. What weighbridge software do you use (e.g. AccuWeigh WinWeigh, Active
     Weighing AWS, Sicom, Precia i-Site, custom)?
  2. What scale indicator (e.g. Rinstrum, Mettler Toledo, Avery, Rice Lake)?
  3. Do you currently export tickets via CSV, ODBC, or a vendor API?

We support all three pathways:
  - Read your existing software's REST/ODBC export
  - SFTP CSV drop
  - Edge gateway reading the indicator's serial port directly

No cost to your business. Onboarding takes ~1 hour once we have access.

Happy to send a one-page architecture diagram and our security overview.

Thanks,
<<Your name>>
<<email>> | <<phone>>
```

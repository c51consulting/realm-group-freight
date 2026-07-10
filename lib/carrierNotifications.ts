type SupabaseLike = {
  from: (table: string) => any;
};

type CarrierMatch = {
  id: string;
  owner_id: string;
  business_name: string;
  contact_phone: string | null;
  regions_served: string[] | null;
  commodities_handled: string[] | null;
};

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function includesMatch(values: string[] | null | undefined, target: unknown) {
  const normalizedTarget = normalize(target);
  if (!normalizedTarget) return true;
  return (values ?? []).some((value) => normalize(value) === normalizedTarget || normalize(value) === 'all');
}

async function sendSms(to: string | null, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!to || !sid || !token || !from) {
    return { sent: false, error: !to ? 'Carrier has no phone number' : 'SMS provider is not configured' };
  }

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    return { sent: false, error: await res.text() };
  }
  return { sent: true, error: null };
}

export async function notifyMatchedCarriersForOrder(supabase: SupabaseLike, orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      carrier_id,
      listing:listings!listing_id(id, title, material_type, pickup_address)
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order || order.status !== 'paid' || order.carrier_id) {
    return { matched: 0, notified: 0 };
  }

  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const pickupState = listing?.pickup_address?.state;
  const materialType = listing?.material_type;

  const { data: carriers, error: carrierError } = await supabase
    .from('carriers')
    .select('id, owner_id, business_name, contact_phone, regions_served, commodities_handled')
    .eq('status', 'active')
    .limit(250);

  if (carrierError) throw carrierError;

  const matches = ((carriers ?? []) as CarrierMatch[]).filter((carrier) => (
    includesMatch(carrier.regions_served, pickupState)
    && includesMatch(carrier.commodities_handled, materialType)
  ));

  if (matches.length === 0) return { matched: 0, notified: 0 };

  const rows = matches.map((carrier) => ({
    order_id: order.id,
    carrier_id: carrier.id,
    carrier_owner_id: carrier.owner_id,
    channel: 'sms',
    sent_to: carrier.contact_phone,
    status: 'pending',
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('carrier_load_notifications')
    .upsert(rows, { onConflict: 'order_id,carrier_id', ignoreDuplicates: true })
    .select('id, carrier_id, sent_to');

  if (insertError) throw insertError;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://realm-ag-marketplace-production.up.railway.app';
  let notified = 0;

  for (const notification of inserted ?? []) {
    const carrier = matches.find((match) => match.id === notification.carrier_id);
    const sms = await sendSms(
      notification.sent_to,
      `REALM load available: ${listing?.title ?? order.order_number}. First active carrier to accept wins. ${appUrl}/carrier/loads`
    );

    const status = sms.sent ? 'sms_sent' : 'pending';
    if (sms.sent) notified += 1;

    await supabase
      .from('carrier_load_notifications')
      .update({
        status,
        sent_at: sms.sent ? new Date().toISOString() : null,
        error_message: sms.error,
        sent_to: carrier?.contact_phone ?? notification.sent_to,
      })
      .eq('id', notification.id);
  }

  return { matched: matches.length, notified };
}

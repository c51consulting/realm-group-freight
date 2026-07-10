import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const notificationId = body.notificationId || body.notification_id;
  const action = body.action;

  if (!notificationId || !UUID_RE.test(notificationId)) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }
  if (action !== 'reject') {
    return NextResponse.json({ error: 'Only reject is supported here' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('carrier_load_notifications')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('carrier_owner_id', user.id)
    .in('status', ['pending', 'sms_sent'])
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Notification not found or already actioned' }, { status: 404 });

  return NextResponse.json({ notification: data });
}

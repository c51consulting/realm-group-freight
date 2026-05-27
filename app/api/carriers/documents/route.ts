import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/carriers/documents
// multipart/form-data: file=<File>, kind=<string> (e.g. "insurance")
// Stores into supabase storage bucket 'carrier-docs' at path <user_id>/<kind>-<timestamp>-<filename>
// Returns { path, signedUrl }. Caller should PATCH /api/carriers with insuranceDocUrl=<path>.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });

  const file = formData.get('file');
  const kind = String(formData.get('kind') ?? 'doc').replace(/[^a-z0-9_-]/gi, '');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  // 10MB cap, basic mime allow-list
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }
  const allowedMime = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
  if (file.type && !allowedMime.has(file.type)) {
    return NextResponse.json({ error: `Unsupported mime type: ${file.type}` }, { status: 415 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-80);
  const path = `${user.id}/${kind}-${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from('carrier-docs')
    .upload(path, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Signed URL (7 days) for the uploader to verify
  const { data: signed } = await supabase.storage
    .from('carrier-docs')
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  return NextResponse.json({ path, signedUrl: signed?.signedUrl ?? null }, { status: 201 });
}

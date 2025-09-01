// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { token, page_data } = await req.json();
  if (!token || !Array.isArray(page_data)) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
  }
  // For simplicity we store partial responses in the invites table as a JSON column.
  // In a production system, a separate table or key‑value store would be preferable.
  const { data: invite, error: inviteErr } = await supabase.from('invites').select('*').eq('token', token).single();
  if (inviteErr || !invite) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 404 });
  }
  // Merge page_data into a partial_responses jsonb column (create if necessary)
  const partial = invite.partial_responses || [];
  const merged = partial.concat(page_data);
  const { error: updateErr } = await supabase.from('invites').update({ partial_responses: merged }).eq('id', invite.id);
  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ saved: merged.length }), { headers: { 'Content-Type': 'application/json' } });
}

serve(handler);
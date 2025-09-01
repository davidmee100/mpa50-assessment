// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const emailProviderKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
const emailDomain = Deno.env.get('EMAIL_PROVIDER_DOMAIN');

const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { invite_id } = await req.json();
  if (!invite_id) {
    return new Response(JSON.stringify({ error: 'Missing invite_id' }), { status: 400 });
  }
  const { data: invite, error } = await supabase.from('invites').select('*').eq('id', invite_id).single();
  if (error || !invite) {
    return new Response(JSON.stringify({ error: 'Invite not found' }), { status: 404 });
  }
  const token = crypto.randomUUID();
  const { error: updateError } = await supabase
    .from('invites')
    .update({ token, status: 'resent', resend_count: (invite.resend_count || 0) + 1, sent_at: new Date().toISOString() })
    .eq('id', invite_id);
  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }
  // send email again
  try {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': emailProviderKey || '',
      },
      body: JSON.stringify({
        From: `noreply@${emailDomain}`,
        To: invite.email,
        Subject: 'Your Culture Fit Assessment Invitation (Resend)',
        HtmlBody: `<p>This is a reminder to complete your culture fit assessment.</p><p><a href="https://your-domain.com/candidate?token=${token}">Begin Assessment</a></p>`
      }),
    });
  } catch (_err) {
    // ignore email errors
  }
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}

serve(handler);
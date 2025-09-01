// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function to create candidate invites.
// This script runs in a Deno environment.  It uses the service role key to
// perform privileged operations.  Never expose the service role key to the
// browser; it should be provided as an environment variable at deploy time.

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const emailProviderKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
const emailDomain = Deno.env.get('EMAIL_PROVIDER_DOMAIN');

const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { list_of_emails, campaign_id } = await req.json();
  if (!Array.isArray(list_of_emails) || !campaign_id) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
  }
  const created = [];
  const skipped = [];
  for (const rawEmail of list_of_emails) {
    const email = String(rawEmail).trim().toLowerCase();
    if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
      skipped.push({ email, reason: 'Invalid format' });
      continue;
    }
    // Check for duplicates within the same campaign
    const { count } = await supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign_id)
      .eq('email', email);
    if (count > 0) {
      skipped.push({ email, reason: 'Duplicate' });
      continue;
    }
    const token = crypto.randomUUID();
    const { error } = await supabase.from('invites').insert({ campaign_id, email, token, status: 'sent' });
    if (error) {
      skipped.push({ email, reason: error.message });
      continue;
    }
    created.push({ email, token });
    // Send email via the provider API (placeholder).  Replace with your provider’s fetch call.
    try {
      // Example: send via Postmark, SendGrid, etc.  This is a stub.
      await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': emailProviderKey || '',
        },
        body: JSON.stringify({
          From: `noreply@${emailDomain}`,
          To: email,
          Subject: 'Your Culture Fit Assessment Invitation',
          HtmlBody: `<p>You have been invited to complete the culture fit assessment.</p><p><a href="https://your-domain.com/candidate?token=${token}">Begin Assessment</a></p>`
        }),
      });
    } catch (_err) {
      // Log email send error; do not block processing
    }
  }
  return new Response(JSON.stringify({ created, skipped }), { headers: { 'Content-Type': 'application/json' } });
}

serve(handler);
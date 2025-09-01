// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const emailProviderKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
const emailDomain = Deno.env.get('EMAIL_PROVIDER_DOMAIN');

const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { action, email, name, role, user_id } = await req.json();
  if (action === 'add') {
    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }
    // Create auth user
    const { data: user, error: authErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name }
    });
    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), { status: 500 });
    }
    // Insert into admin_users
    const { error: insertErr } = await supabase.from('admin_users').insert({ user_id: user.user.id, name, role });
    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
    }
    // Send invite email (placeholder)
    try {
      await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': emailProviderKey || '',
        },
        body: JSON.stringify({
          From: `noreply@${emailDomain}`,
          To: email,
          Subject: 'Admin Account Invitation',
          HtmlBody: `<p>You have been added as an administrator.  Please use the password reset link to set your password.</p>`
        }),
      });
    } catch (_err) {
      // ignore email errors
    }
    return new Response(JSON.stringify({ success: true, id: user.user.id }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (action === 'remove') {
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
    }
    // Remove from admin_users
    await supabase.from('admin_users').delete().eq('user_id', user_id);
    // Disable auth user
    await supabase.auth.admin.updateUserById(user_id, { disabled: true });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}

serve(handler);
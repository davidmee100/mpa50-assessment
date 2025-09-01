// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { campaign_id } = await req.json();
  if (!campaign_id) {
    return new Response(JSON.stringify({ error: 'Missing campaign_id' }), { status: 400 });
  }
  // Fetch invites
  const { data: invites, error: invErr } = await supabase
    .from('invites')
    .select('id, email, sent_at, opened_at, completed_at, status')
    .eq('campaign_id', campaign_id);
  if (invErr) {
    return new Response(JSON.stringify({ error: invErr.message }), { status: 500 });
  }
  // Fetch candidates
  const { data: candidates, error: candErr } = await supabase
    .from('candidates')
    .select('id, overall_score, overall_risk, completed_at')
    .eq('campaign_id', campaign_id);
  if (candErr) {
    return new Response(JSON.stringify({ error: candErr.message }), { status: 500 });
  }
  const totalInvites = invites.length;
  const totalCompleted = candidates.length;
  const completionRate = totalInvites === 0 ? 0 : totalCompleted / totalInvites;
  let scoreSum = 0;
  const riskCounts = { Low: 0, Moderate: 0, Borderline: 0, High: 0 };
  candidates.forEach((c) => {
    const score = parseFloat(c.overall_score) || 0;
    scoreSum += score;
    if (c.overall_risk in riskCounts) {
      riskCounts[c.overall_risk] += 1;
    }
  });
  const averageScore = totalCompleted === 0 ? 0 : scoreSum / totalCompleted;
  return new Response(
    JSON.stringify({
      total_invites: totalInvites,
      total_completed: totalCompleted,
      completion_rate: completionRate,
      average_overall_score: parseFloat(averageScore.toFixed(2)),
      risk_distribution: riskCounts,
      candidates,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

serve(handler);
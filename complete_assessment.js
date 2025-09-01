// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRole);

async function handler(req) {
  const { token, final_responses, candidate_info } = await req.json();
  if (!token || !Array.isArray(final_responses) || !candidate_info) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
  }
  // Validate token
  const { data: invite, error: inviteErr } = await supabase.from('invites').select('*').eq('token', token).single();
  if (inviteErr || !invite) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 404 });
  }
  if (invite.completed_at) {
    return new Response(JSON.stringify({ error: 'Assessment already completed' }), { status: 400 });
  }
  // Fetch question metadata
  const { data: questions, error: qErr } = await supabase.from('questions').select('*').order('id', { ascending: true });
  if (qErr) {
    return new Response(JSON.stringify({ error: qErr.message }), { status: 500 });
  }
  // Compute normalized values and trait scores
  const traitSums = {};
  const traitCounts = {};
  let koTriggered = false;
  const koItems = [];
  questions.forEach((q, idx) => {
    const val = final_responses[idx];
    if (typeof val !== 'number') return;
    const normalized = q.reverse ? 6 - val : val;
    traitSums[q.trait] = (traitSums[q.trait] || 0) + normalized;
    traitCounts[q.trait] = (traitCounts[q.trait] || 0) + 1;
    if (q.ko_threshold && normalized <= q.ko_threshold) {
      koTriggered = true;
      koItems.push({ id: q.id, value: normalized });
    }
  });
  const traitScores = {};
  let overallSum = 0;
  let traitNum = 0;
  for (const trait in traitSums) {
    const mean = traitSums[trait] / traitCounts[trait];
    traitScores[trait] = parseFloat(mean.toFixed(2));
    overallSum += mean;
    traitNum += 1;
  }
  const overallScore = overallSum / traitNum;
  // Determine risk labels
  let overallRisk;
  if (koTriggered || overallScore < 3) {
    overallRisk = 'High';
  } else if (overallScore < 3.5) {
    overallRisk = 'Borderline';
  } else if (overallScore < 4) {
    overallRisk = 'Moderate';
  } else {
    overallRisk = 'Low';
  }
  // Insert candidate record
  const { error: insertErr } = await supabase.from('candidates').insert({
    invite_id: invite.id,
    campaign_id: invite.campaign_id,
    name: candidate_info.name,
    email: candidate_info.email.toLowerCase(),
    experience: candidate_info.experience,
    responses: final_responses,
    trait_scores: traitScores,
    overall_score: overallScore.toFixed(2),
    overall_risk: overallRisk,
    ko_triggered: koTriggered,
    ko_items: koItems,
    completed_at: new Date().toISOString()
  });
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
  }
  // Mark invite as completed
  await supabase.from('invites').update({ completed_at: new Date().toISOString(), status: 'completed' }).eq('id', invite.id);
  return new Response(JSON.stringify({ success: true, overall_score: overallScore, overall_risk: overallRisk }), { headers: { 'Content-Type': 'application/json' } });
}

serve(handler);
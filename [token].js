import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../utils/supabaseClient';

// A simplified question bank.  In a real implementation the questions would be
// fetched from Supabase to ensure version control and correct KO thresholds.
const QUESTION_BANK = [
  { id: 1, text: 'I complete tasks efficiently.', trait: 'Conscientiousness' },
  { id: 2, text: 'I stay calm under pressure.', trait: 'Emotional Stability' },
  { id: 3, text: 'I would never take credit for someone else’s work.', trait: 'Integrity' },
  { id: 4, text: 'I always follow safety rules.', trait: 'Safety Orientation' },
  { id: 5, text: 'I enjoy collaborating with others.', trait: 'Teamwork' },
  // … populate the rest of the 53 questions here or fetch from Supabase
];

const QUESTIONS_PER_PAGE = 5;

export default function CandidateAssessment() {
  const router = useRouter();
  const { token } = router.query;
  const [step, setStep] = useState('info');
  const [candidate, setCandidate] = useState({ name: '', email: '', experience: '', campaign: '', consent: false });
  const [responses, setResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(QUESTION_BANK.length / QUESTIONS_PER_PAGE);

  // Load invite data and prefill email/campaign when token is present
  useEffect(() => {
    if (!token) return;
    const loadInvite = async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('email, campaign_id')
        .eq('token', token)
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setCandidate(prev => ({ ...prev, email: data.email, campaign: data.campaign_id }));
    };
    loadInvite();
  }, [token]);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!candidate.name || !candidate.email || !candidate.experience || !candidate.consent) return;
    // Move to the first page of questions
    setStep('questions');
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextPage = async () => {
    // Persist current page responses via Supabase function
    const pageResponses = QUESTION_BANK.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE)
      .map(q => responses[q.id]);
    try {
      await supabase.functions.invoke('save_response', { body: { token, page_data: pageResponses } });
    } catch (err) {
      console.error('Failed to save responses:', err);
    }
    if (currentPage + 1 < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      // All pages complete
      setStep('complete');
      await supabase.functions.invoke('complete_assessment', { body: { token, final_responses: Object.values(responses), candidate_info: candidate } });
    }
  };

  if (!token) {
    return <p style={{ padding: '2rem' }}>Invalid or missing token.</p>;
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Assessment</title>
      </Head>
      {step === 'info' && (
        <form onSubmit={handleInfoSubmit} style={styles.card}>
          <h2 style={styles.heading}>Candidate Information</h2>
          <label style={styles.label}>
            Full Name
            <input
              type="text"
              value={candidate.name}
              onChange={(e) => setCandidate({ ...candidate, name: e.target.value })}
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={candidate.email}
              onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Years of Experience
            <input
              type="number"
              min="0"
              value={candidate.experience}
              onChange={(e) => setCandidate({ ...candidate, experience: e.target.value })}
              style={styles.input}
              required
            />
          </label>
          {/* In a real implementation, campaign options would be fetched from Supabase. */}
          <label style={styles.label}>
            Campaign
            <input
              type="text"
              value={candidate.campaign}
              onChange={(e) => setCandidate({ ...candidate, campaign: e.target.value })}
              style={styles.input}
              placeholder="Campaign ID"
              required
            />
          </label>
          <label style={{ ...styles.label, flexDirection: 'row', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={candidate.consent}
              onChange={(e) => setCandidate({ ...candidate, consent: e.target.checked })}
              style={{ marginRight: '0.5rem' }}
              required
            />
            I consent to the processing of my data and have read the{' '}
            <a href="/privacy" style={{ color: '#6B46C1', textDecoration: 'underline' }}>
              privacy notice
            </a>
            .
          </label>
          <button type="submit" style={{ ...styles.button, marginTop: '1rem' }}>Begin Assessment</button>
        </form>
      )}
      {step === 'questions' && (
        <div style={styles.card}>
          <h2 style={styles.heading}>Assessment (Page {currentPage + 1} of {totalPages})</h2>
          {QUESTION_BANK.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE).map((q) => (
            <div key={q.id} style={styles.questionRow}>
              <p style={{ marginBottom: '0.5rem' }}>{q.text}</p>
              <div style={styles.responseButtons}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleResponseChange(q.id, val)}
                    style={{
                      ...styles.responseButton,
                      backgroundColor: responses[q.id] === val ? '#6B46C1' : '#EDF2F7',
                      color: responses[q.id] === val ? '#FFFFFF' : '#2D3748'
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#4A5568' }}>
              {Object.keys(responses).length} / {QUESTION_BANK.length} answered
            </div>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={QUESTION_BANK.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE).some(q => !responses[q.id])}
              style={{ ...styles.button, opacity: QUESTION_BANK.slice(currentPage * QUESTIONS_PER_PAGE, (currentPage + 1) * QUESTIONS_PER_PAGE).some(q => !responses[q.id]) ? 0.5 : 1 }}
            >
              {currentPage + 1 === totalPages ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      )}
      {step === 'complete' && (
        <div style={styles.card}>
          <h2 style={styles.heading}>Thank You!</h2>
          <p>Your assessment has been submitted.  We appreciate your time.</p>
          <p>You may now close this window.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '2rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1rem',
    textAlign: 'center'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1rem',
    color: '#2D3748',
    fontSize: '0.9rem'
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #CBD5E0',
    marginTop: '0.25rem'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6B46C1',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600
  },
  questionRow: {
    marginBottom: '1rem'
  },
  responseButtons: {
    display: 'flex',
    gap: '0.5rem'
  },
  responseButton: {
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #CBD5E0',
    cursor: 'pointer',
    minWidth: '40px'
  }
};
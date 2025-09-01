import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CandidateHome() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      router.replace(`/candidate/${token}`);
    }
  }, [token, router]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Candidate Entry</h1>
      <p style={styles.paragraph}>
        To start your assessment please use the unique link provided in your invitation
        email.  If you believe you have received this message in error, please contact
        your recruiter.
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '70vh',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    textAlign: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#2D3748'
  },
  paragraph: {
    fontSize: '1rem',
    color: '#4A5568'
  }
};
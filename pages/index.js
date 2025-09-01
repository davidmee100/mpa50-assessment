import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  const handleAdminClick = () => {
    router.push('/admin/login');
  };

  const handleCandidateClick = () => {
    router.push('/candidate');
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Culture Fit Assessment</title>
      </Head>
      <h1 style={styles.title}>Culture Fit Assessment</h1>
      <p style={styles.description}>
        Welcome to the Culture Fit Assessment.  Please select your role below to begin.
      </p>
      <div style={styles.buttonsContainer}>
        <button style={{ ...styles.button, backgroundColor: '#6B46C1' }} onClick={handleCandidateClick}>
          Candidate
        </button>
        <button style={{ ...styles.button, backgroundColor: '#4A5568' }} onClick={handleAdminClick}>
          Administrator
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)',
    padding: '2rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#2D3748'
  },
  description: {
    fontSize: '1rem',
    color: '#4A5568',
    maxWidth: '600px',
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem'
  },
  button: {
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'background-color 0.2s ease'
  }
};
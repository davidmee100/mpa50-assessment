import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Admin Login</title>
      </Head>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.heading}>Administrator Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </label>
        <label style={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </label>
        <button type="submit" style={{ ...styles.button, opacity: loading ? 0.6 : 1 }} disabled={loading}>
          {loading ? 'Signing In…' : 'Sign In'}
        </button>
        <div style={{ marginTop: '1rem' }}>
          <a href="/" style={{ color: '#6B46C1', textDecoration: 'underline' }}>Back to Home</a>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)',
    padding: '2rem'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  heading: {
    fontSize: '1.5rem',
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
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#6B46C1',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600
  },
  error: {
    backgroundColor: '#FED7D7',
    color: '#C53030',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center'
  }
};
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [emails, setEmails] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase.from('campaigns').select('*');
      if (!error) {
        setCampaigns(data);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedCampaign || !emails) return;
    const emailList = emails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e);
    try {
      await supabase.functions.invoke('create_invites', {
        body: { list_of_emails: emailList, campaign_id: selectedCampaign },
      });
      setMessage('Invites sent successfully');
      setEmails('');
    } catch (err) {
      console.error(err);
      setMessage('Error sending invites');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <p style={{ padding: '2rem' }}>Loading…</p>;
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <header style={styles.header}>
        <h1 style={styles.heading}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </header>
      <section style={styles.section}>
        <h2 style={styles.subheading}>Create Campaign</h2>
        {/* Simple campaign creation form */}
        <CampaignCreator onCreated={(newCampaign) => setCampaigns([...campaigns, newCampaign])} />
      </section>
      <section style={styles.section}>
        <h2 style={styles.subheading}>Send Invites</h2>
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)} style={styles.input} required>
            <option value="" disabled>Select campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Enter candidate emails separated by commas or newlines"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            style={{ ...styles.input, height: '100px' }}
            required
          />
          <button type="submit" style={styles.button}>Send Invites</button>
        </form>
        {message && <p style={{ color: '#4A5568', marginTop: '0.5rem' }}>{message}</p>}
      </section>
      <section style={styles.section}>
        <h2 style={styles.subheading}>Campaigns</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CampaignCreator({ onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    const { data, error } = await supabase.from('campaigns').insert({ name }).select().single();
    if (error) {
      setError(error.message);
    } else {
      onCreated(data);
      setName('');
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Campaign name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
        required
      />
      <button type="submit" style={styles.button}>Create</button>
      {error && <div style={{ color: '#C53030', flexBasis: '100%' }}>{error}</div>}
    </form>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#2D3748'
  },
  logoutButton: {
    backgroundColor: '#4A5568',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer'
  },
  section: {
    marginBottom: '2rem'
  },
  subheading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#2D3748'
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #CBD5E0',
    flex: 1
  },
  button: {
    backgroundColor: '#6B46C1',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontWeight: 600
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem',
    borderBottom: '1px solid #E2E8F0',
    color: '#2D3748'
  },
  td: {
    padding: '0.5rem',
    borderBottom: '1px solid #E2E8F0',
    color: '#4A5568'
  }
};
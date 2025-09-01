import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { supabase } from '../../../utils/supabaseClient';

export default function CandidateReport() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setReport(data);
      }
      setLoading(false);
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return <p style={{ padding: '2rem' }}>Loading…</p>;
  }
  if (!report) {
    return <p style={{ padding: '2rem' }}>Report not found.</p>;
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Candidate Report</title>
      </Head>
      <h1 style={styles.heading}>Candidate Report</h1>
      <div style={styles.card}>
        <h2 style={styles.subheading}>{report.name}</h2>
        <p style={styles.paragraph}>Email: {report.email}</p>
        <p style={styles.paragraph}>Campaign: {report.campaign_id}</p>
        <p style={styles.paragraph}>Completed: {new Date(report.completed_at).toLocaleString()}</p>
        <p style={styles.paragraph}>Overall Score: {report.overall_score?.toFixed(2) ?? 'N/A'}</p>
        <p style={styles.paragraph}>Overall Risk: {report.overall_risk ?? 'N/A'}</p>
        {report.ko_triggered && (
          <p style={{ ...styles.paragraph, color: '#C53030' }}>Knock‑Out Triggered</p>
        )}
      </div>
      {/* Trait breakdown, interview questions and full responses would be displayed here in a real implementation */}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#2D3748'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    marginBottom: '2rem'
  },
  subheading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#2D3748'
  },
  paragraph: {
    marginBottom: '0.5rem',
    color: '#4A5568'
  }
};
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div style={styles.container}>
      <Head>
        <title>Privacy Notice</title>
      </Head>
      <h1 style={styles.title}>Privacy Notice</h1>
      <p style={styles.paragraph}>
        We respect your privacy and are committed to protecting your personal data.  This
        assessment collects your name, email and responses solely for the purpose of
        evaluating your alignment with the traits required for the selected role.  Your
        data is stored securely, will not be shared outside of authorised recruiters,
        and will be retained only for the duration necessary to complete the
        recruitment process.
      </p>
      <p style={styles.paragraph}>
        By participating in this assessment you consent to the processing of your
        personal data as described herein.  You may contact us at any time to request
        deletion of your data or to learn more about how it is used.
      </p>
      <Link href="/">
        <a style={styles.link}>Return to Home</a>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    marginTop: '2rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    textAlign: 'center',
    color: '#2D3748'
  },
  paragraph: {
    marginBottom: '1rem',
    color: '#4A5568',
    lineHeight: '1.5'
  },
  link: {
    display: 'inline-block',
    marginTop: '1.5rem',
    color: '#6B46C1',
    textDecoration: 'underline',
    cursor: 'pointer'
  }
};
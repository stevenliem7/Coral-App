import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        🌊
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: '0.9' }}>
        The coral reef you're looking for seems to have drifted away...
      </p>
      <Link href="/">
        <button style={{
          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          🏠 Return to Coral Collective
        </button>
      </Link>
    </div>
  );
}

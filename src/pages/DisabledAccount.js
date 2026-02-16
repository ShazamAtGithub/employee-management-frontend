import { useNavigate } from 'react-router-dom';

function DisabledAccount() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: 'rgba(233,79,55,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="1.5" y="7" width="21" height="13" rx="2.5" stroke="#E94F37" strokeWidth="1.5" />
              <path d="M7 7V5.5A4 4 0 0 1 15 5.5V7" stroke="#E94F37" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="13.5" r="1.2" fill="#E94F37" />
            </svg>
          </div>

          <h2 style={{ marginBottom: 6 }}>Account Disabled</h2>

          <p style={{ color: '#555', marginBottom: 18 }}>
            Your account has been disabled. Please contact your administrator to reactivate access.
          </p>

          <button
            className="btn-login"
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
          >
            Back to Login
          </button>

          <small className="field-error" style={{ marginTop: 8, color: '#9095a6' }}>
            If you believe this is an error, reach out to your HR or admin team.
          </small>
        </div>
      </div>
    </div>
  );
}

export default DisabledAccount;
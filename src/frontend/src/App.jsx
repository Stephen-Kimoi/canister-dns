import { useState } from 'react';
import { backend } from 'declarations/backend';

function App() {
  const [type, setType] = useState('normal'); // 'normal' or 'subdomain'
  // Normal domain state
  const [domain, setDomain] = useState('');
  const [canisterId, setCanisterId] = useState('');
  const [showWww, setShowWww] = useState(false);
  // Subdomain state
  const [mainDomain, setMainDomain] = useState('');
  const [subLabel, setSubLabel] = useState('');
  const [subCanisterId, setSubCanisterId] = useState('');
  // Results
  const [records, setRecords] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    console.log('handleSubmit');
    event.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setRecords(null);
    if (type === 'normal') {
      if (!domain || !canisterId) { setLoading(false); return; }
      console.log('submitting normal');
      await backend.submit(domain, canisterId, type);
      setRecords(generateRecords({ domain, canisterId, type, showWww }));
    } else {
      if (!mainDomain || !subLabel || !subCanisterId) { setLoading(false); return; }
      console.log('submitting subdomain');
      const subdomain = `${subLabel}.${mainDomain}`;
      await backend.submit(subdomain, subCanisterId, type);
      setRecords(generateRecords({ mainDomain, subLabel, subCanisterId, type }));
    }
    setLoading(false);
    setSubmitted(true);
  }

  function generateRecords({ domain, canisterId, type, showWww, mainDomain, subLabel, subCanisterId }) {
    if (type === 'normal') {
      let baseRecords = [
        { label: 'ALIAS Record', host: '@', value: `${domain}.icp1.io` },
        { label: 'CNAME Record', host: '_acme-challenge', value: `_acme-challenge.${domain}.icp2.io` },
        { label: 'TXT Record', host: '_canister-id', value: canisterId },
      ];
      if (showWww) {
        baseRecords = baseRecords.concat([
          { label: 'CNAME Record', host: 'www', value: `www.${domain}.icp1.io` },
          { label: 'CNAME Record', host: '_acme-challenge.www', value: `_acme-challenge.www.${domain}.icp2.io` },
          { label: 'TXT Record', host: '_canister-id.www', value: canisterId },
        ]);
      }
      return baseRecords;
    } else {
      // Subdomain
      const subdomain = `${subLabel}.${mainDomain}`;
      return [
        { label: 'ALIAS Record', host: subLabel, value: `${subdomain}.icp1.io` },
        { label: 'CNAME Record', host: `_acme-challenge.${subLabel}`, value: `_acme-challenge.${subdomain}.icp2.io` },
        { label: 'TXT Record', host: `_canister-id.${subLabel}`, value: subCanisterId },
      ];
    }
  }

  function handleCopy(value, idx) {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '2em 0', fontSize: '1em' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '2em',
          width: '100%',
          maxWidth: 1100,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Form Card */}
        <div style={{ background: '#fff', boxShadow: '0 2px 16px #0001', borderRadius: 16, padding: '2em 1.5em', minWidth: 320, maxWidth: 420, flex: '1 1 340px', marginBottom: '2em', fontSize: '0.98em' }}>
          <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.2em', color: '#222' }}>ICP DNS Config Generator</h1>
          <div style={{ display: 'flex', gap: '1.2em', justifyContent: 'center', marginBottom: '1.2em' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: '0.98em' }}>
              <input type="radio" name="type" value="normal" checked={type === 'normal'} onChange={() => { setType('normal'); setSubmitted(false); }} style={{ accentColor: '#4f46e5' }} disabled={loading} />
              Normal Domain
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: '0.98em' }}>
              <input type="radio" name="type" value="subdomain" checked={type === 'subdomain'} onChange={() => { setType('subdomain'); setSubmitted(false); }} style={{ accentColor: '#4f46e5' }} disabled={loading} />
              Subdomain
            </label>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
            {type === 'normal' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                  <label htmlFor="domain" style={{ fontWeight: 500, fontSize: '1em' }}>Domain</label>
                  <input id="domain" type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" required style={{ padding: '0.6em', borderRadius: 8, border: '1px solid #ccc', fontSize: '1em' }} disabled={loading} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                  <label htmlFor="canister" style={{ fontWeight: 500, fontSize: '1em' }}>Canister ID</label>
                  <input id="canister" type="text" value={canisterId} onChange={e => setCanisterId(e.target.value)} placeholder="aaaaa-aa" required style={{ padding: '0.6em', borderRadius: 8, border: '1px solid #ccc', fontSize: '1em' }} disabled={loading} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0.5em 0 0.2em 0', fontWeight: 500, fontSize: '0.98em' }}>
                  <input
                    type="checkbox"
                    checked={showWww}
                    onChange={e => {
                      setShowWww(e.target.checked);
                      if (type === 'normal' && submitted) {
                        setRecords(generateRecords({ domain, canisterId, type, showWww: e.target.checked }));
                      }
                    }}
                    disabled={loading}
                  />
                  Show with www
                </label>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                  <label htmlFor="mainDomain" style={{ fontWeight: 500, fontSize: '1em' }}>Main Domain</label>
                  <input id="mainDomain" type="text" value={mainDomain} onChange={e => setMainDomain(e.target.value)} placeholder="example.com" required style={{ padding: '0.6em', borderRadius: 8, border: '1px solid #ccc', fontSize: '1em' }} disabled={loading} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                  <label htmlFor="subLabel" style={{ fontWeight: 500, fontSize: '1em' }}>Subdomain Label</label>
                  <input id="subLabel" type="text" value={subLabel} onChange={e => setSubLabel(e.target.value)} placeholder="marketplace" required style={{ padding: '0.6em', borderRadius: 8, border: '1px solid #ccc', fontSize: '1em' }} disabled={loading} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
                  <label htmlFor="subCanisterId" style={{ fontWeight: 500, fontSize: '1em' }}>Canister ID</label>
                  <input id="subCanisterId" type="text" value={subCanisterId} onChange={e => setSubCanisterId(e.target.value)} placeholder="aaaaa-aa" required style={{ padding: '0.6em', borderRadius: 8, border: '1px solid #ccc', fontSize: '1em' }} disabled={loading} />
                </div>
              </>
            )}
            <button type="submit" style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em', fontWeight: 600, fontSize: '1em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.3em', boxShadow: '0 1px 4px #0001', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Loading...' : 'Show DNS Records'}
            </button>
          </form>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <span className="spinner" style={{ width: 28, height: 28, border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
            </div>
          )}
        </div>
        {/* DNS Records Card */}
        {submitted && records && !loading && (
          <div style={{ background: '#fff', boxShadow: '0 2px 16px #0001', borderRadius: 16, padding: '2em 1.2em', minWidth: 320, maxWidth: 600, flex: '1 1 340px', fontSize: '0.97em' }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1em', color: '#222' }}>
              DNS Records for {type === 'normal' ? domain : `${subLabel}.${mainDomain}`}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.97em' }}>
              <thead>
                <tr style={{ background: '#f7f8fa' }}>
                  <th style={{ textAlign: 'left', padding: '0.5em 0.4em' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.5em 0.4em' }}>Host</th>
                  <th style={{ textAlign: 'left', padding: '0.5em 0.4em' }}>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f7f8fa' : '#fff' }}>
                    <td style={{ padding: '0.4em 0.4em', fontWeight: 600 }}>{rec.label}</td>
                    <td style={{ padding: '0.4em 0.4em' }}><code>{rec.host}</code></td>
                    <td style={{ padding: '0.4em 0.4em', wordBreak: 'break-all' }}><code>{rec.value}</code></td>
                    <td style={{ padding: '0.4em 0.4em' }}>
                      <button onClick={() => handleCopy(rec.value, i)} style={{ background: '#e0e7ff', border: 'none', borderRadius: 6, padding: '0.25em 0.6em', cursor: 'pointer', fontWeight: 500, color: '#3730a3', fontSize: '0.97em' }}>
                        {copiedIdx === i ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Responsive styles and spinner animation */}
      <style>{`
        @media (max-width: 900px) {
          div[style*='flex-direction: row'] {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
        html, body {
          font-size: 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
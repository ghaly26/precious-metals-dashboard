import React, { useState, useEffect } from 'react';

const BACKEND_URL = "https://precious-metals-dashboard.onrender.com"; // Replace with your backend URL

function App() {
  const [metals, setMetals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [weight, setWeight] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('gold24kGram');
  const [calculatedValue, setCalculatedValue] = useState(null);

  const fetchRates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/metals`);
      if (!res.ok) throw new Error("Server error fetching live market data");
      const data = await res.json();
      setMetals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!metals || !weight || isNaN(weight)) {
      setCalculatedValue(null);
      return;
    }
    const ratePerGram = metals[selectedMetal];
    setCalculatedValue(parseFloat(weight) * ratePerGram);
  };

  return (
    <div style={{ background: '#070a12', color: '#f8fafc', minHeight: '100vh', padding: '50px 20px', fontFamily: '"Cinzel", "Times New Roman", Times, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        
        {/* 👑 1. EMBEDDED HIGH-RES CROWN LOGO SECTION */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ width: '160px', height: '120px', margin: '0 auto 15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* SVG Crown outline geometry custom rendered to precisely mirror your luxury insignia branding */}
            <svg width="120" height="100" viewBox="0 0 100 80" fill="none">
              <path d="M10 60 L25 30 L40 50 L50 20 L60 50 L75 30 L90 60 Z" stroke="#d4af37" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(212, 175, 55, 0.05)" />
              <circle cx="50" cy="15" r="4" fill="#d4af37" />
              <circle cx="25" cy="25" r="3" fill="#d4af37" />
              <circle cx="75" cy="25" r="3" fill="#d4af37" />
              <path d="M10 60 Q50 68 90 60 L85 70 Q50 74 15 70 Z" fill="#d4af37" />
              <circle cx="50" cy="65" r="2.5" fill="#070a12" />
              <circle cx="35" cy="64" r="2" fill="#070a12" />
              <circle cx="65" cy="64" r="2" fill="#070a12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: '300', color: '#d4af37', margin: '0', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Queen Jewelry
          </h1>
          <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '4px', margin: '6px 0 0 0', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: '600' }}>
            Live Valuation Portal
          </p>
        </div>
        
        {loading && (
          <p style={{ color: '#94a3b8', fontSize: '14px', fontFamily: 'sans-serif', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            📡 Connecting to gold market ticker streams...
          </p>
        )}

        {error && <p style={{ color: '#ff4a77', background: 'rgba(255, 74, 119, 0.1)', padding: '12px', borderRadius: '8px', fontFamily: 'sans-serif' }}>{error}</p>}

        {metals && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '35px', width: '100%' }}>
            
            {/* 📊 INTERACTIVE MELT VALUATION WIDGET */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#d4af37', fontWeight: '400', letterSpacing: '1px', textTransform: 'uppercase' }}>Melt Value Calculator</h3>
              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', fontFamily: 'sans-serif' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', letterSpacing: '1px', fontWeight: '600' }}>WEIGHT (GRAMS)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '16px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', letterSpacing: '1px', fontWeight: '600' }}>METAL PURITY SELECTOR</label>
                  <select 
                    value={selectedMetal}
                    onChange={(e) => setSelectedMetal(e.target.value)}
                    style={{ width: '100%', padding: '14px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                  >
                    <option value="gold24kGram">Gold 24K (Per Gram)</option>
                    <option value="gold21kGram">Gold 21K (Per Gram)</option>
                    <option value="gold18kGram">Gold 18K (Per Gram)</option>
                    <option value="silver925ItalyGram">Silver 925 Italy (Per Gram)</option>
                  </select>
                </div>

                <button type="submit" style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #d4af37 0%, #aa841c 100%)', border: 'none', borderRadius: '8px', color: '#000000', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)' }}>
                  Calculate Material Liquid Value
                </button>
              </form>

              {calculatedValue !== null && (
                <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(56, 239, 125, 0.05)', borderRadius: '10px', border: '1px solid rgba(56, 239, 125, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', fontFamily: 'sans-serif' }}>ESTIMATED TOTAL MATERIAL PAYOUT</div>
                  <div style={{ fontSize: '36px', fontWeight: 'normal', color: '#38ef7d', marginTop: '4px' }}>
                    ${calculatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>

            {/* 📈 TWO-COLUMN LIVE INDEX GRID */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)', borderRadius: '16px', padding: '35px', border: '1px solid rgba(255, 255, 255, 0.03)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(212, 175, 55, 0.15)', paddingBottom: '15px' }}>
                <h2 style={{ fontSize: '18px', margin: '0', fontWeight: 'normal', color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Market Rates (USD)</h2>
                <button onClick={fetchRates} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#d4af37', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: '600' }}>
                  REFRESH
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* COLUMN A: OUNCE BENCHMARKS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', fontFamily: 'sans-serif' }}>Ounce Pricing</div>
                  
                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 24K OUNCE</div>
                    <div style={{ fontSize: '22px', color: '#ffffff', marginTop: '2px' }}>${Math.round(metals.gold24kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 21K OUNCE</div>
                    <div style={{ fontSize: '22px', color: '#ff9f43', marginTop: '2px' }}>${Math.round(metals.gold21kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 18K OUNCE</div>
                    <div style={{ fontSize: '22px', color: '#00f2fe', marginTop: '2px' }}>${Math.round(metals.gold18kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>SILVER 925 ITALY OUNCE</div>
                    <div style={{ fontSize: '22px', color: '#f8fafc', marginTop: '2px' }}>
                      ${(metals.silver925ItalyGram * 31.1035).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* COLUMN B: GRAM BENCHMARKS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', fontFamily: 'sans-serif' }}>Gram Pricing</div>
                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 24K GRAM</div>
                    <div style={{ fontSize: '22px', color: '#ffffff', marginTop: '2px' }}>${metals.gold24kGram.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 21K GRAM</div>
                    <div style={{ fontSize: '22px', color: '#ff9f43', marginTop: '2px' }}>${metals.gold21kGram.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'left', padding: '6px 0' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 18K GRAM</div>
                    <div style={{ fontSize: '22px', color: '#00f2fe', marginTop: '2px' }}>${metals.gold18kGram.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'left', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>SILVER 925 ITALY</div>
                    <div style={{ fontSize: '22px', color: '#38ef7d', marginTop: '2px' }}>${metals.silver925ItalyGram.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 🌐 2. FIXED PERSISTENT BRAND COMMUNICATION FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '10px', fontSize: '14px', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px', width: '100%' }}>
              <a 
              href="https://queenjewelryllc.com/" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#d4af37', textDecoration: 'none', borderBottom: '1px dashed rgba(212,175,55,0.4)', paddingBottom: '3px', fontWeight: '600', letterSpacing: '0.5px' }}>
                
            Official Website</a>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
              <a href="https://www.facebook.com/profile.php?id=61586279284348" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#4facfe', textDecoration: 'none', borderBottom: '1px dashed rgba(79,172,254,0.4)', paddingBottom: '3px', fontWeight: '600', letterSpacing: '0.5px' }}>
            
            Facebook Page</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const BACKEND_URL = "https://precious-metals-dashboard.onrender.com"; // Replace with your backend URL

function App() {
  const [metals, setMetals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calculator state parameters
  const [weight, setWeight] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('gold24kGram');
  const [feePercentage, setFeePercentage] = useState(10); // 🟢 Store Fee Slider State (default 10%)
  const [calculatedValue, setCalculatedValue] = useState(null);
  const [grossValue, setGrossValue] = useState(null);
  const [feeAmount, setFeeAmount] = useState(null);
  const [checkDate, setCheckDate] = useState('');

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

  // Handle calculator evaluation with store fee adjustment
  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    if (!metals || !weight || isNaN(weight) || weight <= 0) {
      setCalculatedValue(null);
      setGrossValue(null);
      setFeeAmount(null);
      return;
    }
    const ratePerGram = metals[selectedMetal];
    const gross = parseFloat(weight) * ratePerGram;
    const fee = gross * (feePercentage / 100);
    const netPayout = gross - fee;

    setGrossValue(gross);
    setFeeAmount(fee);
    setCalculatedValue(netPayout);
    setCheckDate(new Date().toLocaleString());
  };

  // Re-calculate automatically when the slider moves if weight is active
  useEffect(() => {
    if (weight && metals) {
      handleCalculate();
    }
  }, [feePercentage, selectedMetal, metals]);

  // 📄 Automated PDF Receipt Generator
  const generatePDFReceipt = () => {
    if (calculatedValue === null) return;

    const doc = new jsPDF();
    const primaryGold = [212, 175, 55];
    const darkBg = [17, 22, 34];

    // Header Background Accent
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 45, 'F');

    // Title Branding
    doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("QUEEN JEWELRY LLC", 105, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("OFFICIAL ASSET VALUATION & MELT QUOTE RECEIPT", 105, 26, { align: "center" });
    doc.text(`Issued On: ${checkDate}`, 105, 33, { align: "center" });

    // Metadata Section
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 52, 180, 20, 'F');
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text("Store Location: Flagship Store", 20, 62);
    doc.text("Transaction Type: Client Assay Melt Payout", 20, 68);
    doc.text("Status: Verified Spot Lock", 125, 62);
    doc.text("Currency: USD ($)", 125, 68);

    // Table Header
    doc.setFillColor(17, 22, 34);
    doc.rect(15, 80, 180, 10, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ASSET DESCRIPTION", 20, 86.5);
    doc.text("WEIGHT", 90, 86.5);
    doc.text("SPOT RATE", 125, 86.5);
    doc.text("GROSS VALUE", 160, 86.5);

    // Table Row Data
    const metalLabels = {
      gold24kGram: "Gold 24K Pure",
      gold21kGram: "Gold 21K Karat",
      gold18kGram: "Gold 18K Karat",
      silver925ItalyGram: "Silver 925 Sterling"
    };

    doc.setFillColor(255, 255, 255);
    doc.rect(15, 90, 180, 12, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(metalLabels[selectedMetal], 20, 97.5);
    doc.text(`${parseFloat(weight).toFixed(2)} g`, 90, 97.5);
    doc.text(`$${metals[selectedMetal].toFixed(2)} /g`, 125, 97.5);
    doc.text(`$${grossValue.toFixed(2)}`, 160, 97.5);

    // Fee & Net Payout Summary Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 110, 180, 36, 3, 3, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("Gross Material Value:", 25, 120);
    doc.text(`$${grossValue.toFixed(2)} USD`, 175, 120, { align: 'right' });

    doc.text(`Store Processing / Margin Fee (${feePercentage}%):`, 25, 128);
    doc.text(`-$${feeAmount.toFixed(2)} USD`, 175, 128, { align: 'right' });

    doc.setDrawColor(212, 175, 55);
    doc.line(25, 133, 185, 133);

    doc.setTextColor(17, 22, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FINAL ESTIMATED CLIENT PAYOUT:", 25, 141);
    doc.setTextColor(22, 163, 74); // Emerald Green
    doc.setFontSize(13);
    doc.text(`$${calculatedValue.toFixed(2)} USD`, 175, 141, { align: 'right' });

    // Footer Terms
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Terms: This quote is calculated dynamically based on live market spot feeds and is valid for same-day store transactions.", 105, 160, { align: 'center' });
    doc.text("Queen Jewelry LLC - https://queenjewelryllc.com", 105, 165, { align: 'center' });

    // Output download
    doc.save(`Queen_Jewelry_Quote_${Date.now()}.pdf`);
  };

  return (
    <div style={{ background: '#070a12', color: '#f8fafc', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Cinzel", "Times New Roman", Times, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
        
        {/* BRAND CROWN LOGO */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ width: '140px', height: '100px', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100" height="75" viewBox="0 0 100 80" fill="none">
              <path d="M10 60 L25 30 L40 50 L50 20 L60 50 L75 30 L90 60 Z" stroke="#d4af37" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(212, 175, 55, 0.05)" />
              <circle cx="50" cy="15" r="4" fill="#d4af37" />
              <circle cx="25" cy="25" r="3" fill="#d4af37" />
              <circle cx="75" cy="25" r="3" fill="#d4af37" />
              <path d="M10 60 Q50 68 90 60 L85 70 Q50 74 15 70 Z" fill="#d4af37" />
            </svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '300', color: '#d4af37', margin: '0', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Queen Jewelry
          </h1>
          <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '4px', margin: '5px 0 0 0', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: '600' }}>
            Live Valuation Portal
          </p>
        </div>
        
        {loading && <p style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'sans-serif' }}>📡 Fetching live commodity index ticks...</p>}
        {error && <p style={{ color: '#ff4a77', background: 'rgba(255, 74, 119, 0.1)', padding: '10px', borderRadius: '8px', fontFamily: 'sans-serif' }}>{error}</p>}

        {metals && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px', width: '100%' }}>
            
            {/* 📊 INTERACTIVE MELT VALUATION WIDGET WITH FEE SLIDER */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#d4af37', fontWeight: '400', letterSpacing: '1px', textTransform: 'uppercase' }}>Melt Value & Fee Calculator</h3>
              
              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', fontFamily: 'sans-serif' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>WEIGHT (GRAMS)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>METAL PURITY SELECTOR</label>
                  <select 
                    value={selectedMetal}
                    onChange={(e) => setSelectedMetal(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="gold24kGram">Gold 24K (Per Gram)</option>
                    <option value="gold21kGram">Gold 21K (Per Gram)</option>
                    <option value="gold18kGram">Gold 18K (Per Gram)</option>
                    <option value="silver925ItalyGram">Silver 925 Italy (Per Gram)</option>
                  </select>
                </div>

                {/* 🟢 STORE FEE PERCENTAGE SLIDER */}
                <div style={{ backgroundColor: 'rgba(7, 10, 18, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>STORE PROCESSING FEE</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d4af37' }}>{feePercentage}%</span>
                  </div>
                  <input type="range" min="0" max="30" step="0.5" value={feePercentage} onChange={(e) => setFeePercentage(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#d4af37', cursor: 'pointer' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #d4af37 0%, #aa841c 100%)', border: 'none', borderRadius: '8px', color: '#000000', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)' }}>
                  Calculate Client Payout
                </button>
                {calculatedValue !== null && (
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(56, 239, 125, 0.04)', borderRadius: '10px', border: '1px solid rgba(56, 239, 125, 0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontFamily: 'sans-serif' }}>ESTIMATED NET CLIENT PAYOUT</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#38ef7d', marginTop: '4px' }}>${calculatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>USD</span></div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Gross: ${grossValue.toFixed(2)} | Fee Deduction: -${feeAmount.toFixed(2)}</div>
                    <button onClick={generatePDFReceipt} style={{ marginTop: '14px', padding: '10px 20px', background: '#111622', border: '1px solid #38ef7d', color: '#38ef7d', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }}>📥 DOWNLOAD PDF CLIENT RECEIPT</button>
                  </div>
                )}
              </form>
                
                {/* LIVE MARKET MATRIX */}
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 175, 55, 0.15)', paddingBottom: '12px' }}>
                    <h2 style={{ fontSize: '16px', margin: '0', fontWeight: 'normal', color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Market Rates (USD)</h2>
                    <button type="button" onClick={fetchRates} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#d4af37', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: '600' }}>REFRESH</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {[
                      ['GOLD 24K OUNCE', Math.round(metals.gold24kOunce).toLocaleString()],
                      ['GOLD 24K GRAM', metals.gold24kGram.toFixed(2)],
                      ['GOLD 21K OUNCE', Math.round(metals.gold21kOunce).toLocaleString()],
                      ['GOLD 21K GRAM', metals.gold21kGram.toFixed(2)],
                      ['GOLD 18K OUNCE', Math.round(metals.gold18kOunce).toLocaleString()],
                      ['GOLD 18K GRAM', metals.gold18kGram.toFixed(2)],
                      ['SILVER 925 OUNCE', (metals.silver925ItalyGram * 31.1035).toFixed(2)],
                      ['SILVER 925 ITALY', metals.silver925ItalyGram.toFixed(2)]
                    ].map(([label, value]) => <div key={label} style={{ textAlign: 'left' }}><div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>{label}</div><div style={{ fontSize: '18px', color: '#ffffff' }}>${value}</div></div>)}
                  </div>
                </div>
                {/* BRAND FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '13px', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px', width: '100%' }}>
                  <a href="https://queenjewelryllc.com" target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '600' }}>Official Website</a>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#4facfe', textDecoration: 'none', fontWeight: '600' }}>Facebook Page</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}
export default App;
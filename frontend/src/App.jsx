import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const BACKEND_URL = 'https://precious-metals-dashboard.onrender.com';
const STAMP_IMAGE_BASE64 = 'data:image/png;base64,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';

function App() {
  const [metals, setMetals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState('');

  const [weight, setWeight] = useState('');
  const [selectedMetal, setSelectedMetal] = useState('gold24kGram');
  const [documentType, setDocumentType] = useState('quote'); // 'quote' | 'invoice'
  const [customFee, setCustomFee] = useState('');
  const [customRatePerGram, setCustomRatePerGram] = useState('');
  const [chargeFeePerGram, setChargeFeePerGram] = useState('yes'); // invoice + custom only
  const [items, setItems] = useState([{ id: 1, description: '', weight: '' }]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [clientStreetAddress, setClientStreetAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientZip, setClientZip] = useState('');
  const [calculatedValue, setCalculatedValue] = useState(null);
  const [grossValue, setGrossValue] = useState(null);
  const [feeAmount, setFeeAmount] = useState(null);
  const [checkDate, setCheckDate] = useState('');

  // Invoice-only verification gate
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verificationVerified, setVerificationVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // USPS shipping label (Invoice mode only)
  const [printShippingLabel, setPrintShippingLabel] = useState('no');
  const [signatureOption, setSignatureOption] = useState('without'); // 'with' | 'without'
  const [mailingDate, setMailingDate] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [labelGenerating, setLabelGenerating] = useState(false);
  const [labelError, setLabelError] = useState('');
  const [labelResult, setLabelResult] = useState(null); // { trackingNumber, postage, labelPdfBase64 }
  const [labelConfirmModalOpen, setLabelConfirmModalOpen] = useState(false);

  const addItem = () => {
    setItems((prev) => (prev.length >= 10 ? prev : [...prev, { id: Date.now(), description: '', weight: '' }]));
  };

  const removeItem = (id) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const resetFormFields = () => {
    setWeight('');
    setSelectedMetal('gold24kGram');
    setCustomFee('');
    setCustomRatePerGram('');
    setChargeFeePerGram('yes');
    setItems([{ id: Date.now(), description: '', weight: '' }]);
    setPhoneNumber('');
    setCustomClientName('');
    setClientStreetAddress('');
    setClientCity('');
    setClientState('');
    setClientZip('');
    setCalculatedValue(null);
    setGrossValue(null);
    setFeeAmount(null);
    setCheckDate('');
    setVerificationVerified(false);
    setVerificationModalOpen(false);
    setVerificationCodeInput('');
    setVerificationError('');
  };

  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
    resetFormFields();
  };

  const isInvoice = documentType === 'invoice';
  const isCustomMetal = selectedMetal === 'custom';
  // Custom items and any invoice always use the itemized entry list; a plain
  // Quote for a standard karat keeps the original single-weight field.
  const useItemizedEntry = isCustomMetal || isInvoice;
  const noFeeMode = isInvoice && isCustomMetal && chargeFeePerGram === 'no';
  const clientAddressCombined = `${clientStreetAddress}, ${clientCity}, ${clientState} ${clientZip}`.trim();

  const requiredInvoiceFieldsFilled =
    customClientName.trim() !== '' && phoneNumber.trim() !== '' &&
    clientStreetAddress.trim() !== '' && clientCity.trim() !== '' &&
    clientState.trim() !== '' && clientZip.trim() !== '';

  // Default mailing date = the day after the invoice is issued, editable by the user.
  useEffect(() => {
    if (isInvoice && checkDate && !mailingDate) {
      const next = new Date(checkDate);
      next.setDate(next.getDate() + 1);
      setMailingDate(next.toISOString().split('T')[0]);
    }
  }, [isInvoice, checkDate]);

  // Re-verification is required if identity details change after a code was verified.
  useEffect(() => {
    setVerificationVerified(false);
  }, [documentType, customClientName, phoneNumber, clientStreetAddress, clientCity, clientState, clientZip]);

  const sendVerificationCode = async () => {
    setVerificationError('');
    setVerificationSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/send-verification-code`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setVerificationModalOpen(true);
      } else {
        setVerificationError('Could not send verification code. Please try again.');
      }
    } catch (err) {
      setVerificationError('Could not send verification code. Please try again.');
    } finally {
      setVerificationSending(false);
    }
  };

  const submitVerificationCode = async () => {
    setVerifyingCode(true);
    setVerificationError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCodeInput }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerificationVerified(true);
        setVerificationModalOpen(false);
        setVerificationCodeInput('');
      } else {
        setVerificationError(data.reason || 'Invalid code.');
      }
    } catch (err) {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const getRatePerGram = (metalKey, metalsData, customRateValue) => {
    if (!metalsData) return 0;
    if (metalKey === 'custom') {
      const parsed = Number(customRateValue);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (metalKey === 'bullion24kGram') return metalsData.gold24kGram;
    if (metalKey === 'gold14kGram') return metalsData.gold24kGram * (14 / 24);
    if (metalKey === 'gold10kGram') return metalsData.gold24kGram * (10 / 24);
    if (metalKey === 'gold9kGram') return metalsData.gold24kGram * (9 / 24);
    return metalsData[metalKey];
  };

  const fetchRates = async () => {
    setLoading(true);
    setSlowLoading(false);
    setError('');

    const slowTimer = setTimeout(() => setSlowLoading(true), 6000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/metals`);
      if (!res.ok) throw new Error('Server error fetching live market data');
      const data = await res.json();
      setMetals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const sendQuoteNotification = async ({ baseValue, feeAmount: fee, totalGross, pdfBase64 }) => {
    try {
      const spotRatePerGram = getRatePerGram(selectedMetal, metals, customRatePerGram);
      const itemsSummary = useItemizedEntry
        ? items
            .filter((it) => it.weight !== '' && Number(it.weight) > 0)
            .map((it) => ({ description: it.description.trim() || null, weight: it.weight }))
        : undefined;

      await fetch(`${BACKEND_URL}/api/send-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metalType: selectedMetal,
          weight,
          spotRate: spotRatePerGram.toFixed(2),
          baseValue: baseValue?.toFixed(2),
          customFee: fee?.toFixed(2),
          totalGross: totalGross?.toFixed(2),
          phoneNumber,
          clientName: customClientName,
          clientAddress: clientAddressCombined,
          documentType,
          items: itemsSummary,
          pdfBase64,
          timestamp: new Date().toLocaleString(),
        }),
      });
    } catch (notifyErr) {
      console.warn('Quote notification email failed to send.', notifyErr.message);
    }
  };

  const handleCalculate = (e) => {
    if (e) e.preventDefault();

    if (isInvoice && (!requiredInvoiceFieldsFilled || !verificationVerified)) {
      setCalculatedValue(null);
      setGrossValue(null);
      setFeeAmount(null);
      return;
    }

    const invalidCustomRate =
      isCustomMetal && (customRatePerGram === '' || Number.isNaN(Number(customRatePerGram)) || Number(customRatePerGram) <= 0);

    if (!metals || invalidCustomRate) {
      setCalculatedValue(null);
      setGrossValue(null);
      setFeeAmount(null);
      return;
    }

    const ratePerGram = getRatePerGram(selectedMetal, metals, customRatePerGram);
    const fee = customFee !== '' && !Number.isNaN(Number(customFee)) ? Number(customFee) : 0;
    const customFeeApplies = isInvoice && isCustomMetal && chargeFeePerGram === 'yes';

    let totalWeight;

    if (useItemizedEntry) {
      const validItems = items.filter(
        (it) => it.weight !== '' && !Number.isNaN(Number(it.weight)) && Number(it.weight) > 0
      );
      if (validItems.length === 0) {
        setCalculatedValue(null);
        setGrossValue(null);
        setFeeAmount(null);
        return;
      }
      totalWeight = validItems.reduce((sum, it) => sum + Number(it.weight), 0);
    } else {
      if (!weight || Number.isNaN(Number(weight)) || Number(weight) <= 0) {
        setCalculatedValue(null);
        setGrossValue(null);
        setFeeAmount(null);
        return;
      }
      totalWeight = Number(weight);
    }

    const baseGoldPrice = totalWeight * ratePerGram;
    const totalfeeamount = selectedMetal === 'custom'
      ? (customFeeApplies ? fee * totalWeight : 0)
      : selectedMetal === 'bullion24kGram' ? fee : fee * totalWeight;
    const clientTotalGross = baseGoldPrice + totalfeeamount;

    setGrossValue(baseGoldPrice);
    setFeeAmount(totalfeeamount);
    setCalculatedValue(clientTotalGross);
    setCheckDate(new Date().toLocaleString());

    // Fire-and-forget: notify the store by email whenever a client calculates a quote.
    sendQuoteNotification({
      baseValue: baseGoldPrice,
      feeAmount: totalfeeamount,
      totalGross: clientTotalGross,
    });
  };

  const requestShippingLabel = async () => {
    setLabelGenerating(true);
    setLabelError('');
    setLabelResult(null);
    try {
      const totalWeightGrams = useItemizedEntry
        ? items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0)
        : Number(weight) || 0;
      const weightLb = Math.max(totalWeightGrams / 453.592, 0.1); // USPS needs a non-trivial weight

      const res = await fetch(`${BACKEND_URL}/api/create-shipping-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: {
            firstName: customClientName.split(' ')[0] || customClientName,
            lastName: customClientName.split(' ').slice(1).join(' ') || '',
            streetAddress: clientStreetAddress,
            city: clientCity,
            state: clientState,
            ZIPCode: clientZip,
          },
          weightLb,
          signatureRequired: signatureOption === 'with',
          mailingDate,
          packageValue: packageValue ? Number(packageValue) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLabelResult(data);
        setLabelConfirmModalOpen(true);
      } else {
        setLabelError(data.error || 'Could not generate the shipping label.');
      }
    } catch (err) {
      setLabelError('Could not reach the shipping label service.');
    } finally {
      setLabelGenerating(false);
    }
  };

  const downloadShippingLabel = () => {
    if (!labelResult?.labelPdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${labelResult.labelPdfBase64}`;
    link.download = `USPS_Label_${labelResult.trackingNumber || Date.now()}.pdf`;
    link.click();
  };

  const generatePDFReceipt = () => {
    if (calculatedValue === null) return;

    const doc = new jsPDF();
    const primaryGold = [212, 175, 55];
    const darkBg = [17, 22, 34];

    // Invoice documents get two extra client-detail lines in the info box.

    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(primaryGold[0], primaryGold[1], primaryGold[2]);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('QUEEN JEWELRY LLC', 105, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      isInvoice ? 'OFFICIAL ASSET VALUATION & MELT INVOICE' : 'OFFICIAL ASSET VALUATION & MELT QUOTE RECEIPT',
      105,
      26,
      { align: 'center' }
    );
    doc.text(`Issued On: ${checkDate}`, 105, 33, { align: 'center' });

    const hasClientInfoQuote = !isInvoice && (customClientName.trim() !== '' || phoneNumber.trim() !== '');
    const infoYOffset = isInvoice ? 14 : (hasClientInfoQuote ? 7 : 0);

    doc.setFillColor(248, 250, 252);
    doc.rect(15, 52, 180, 26 + infoYOffset, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 51, 51);
    doc.text(
      isInvoice
        ? 'Store Location: 3725 Summersville Ln, Fort Worth -Texas-USA,76244'
        : 'Store Location: Flagship Store',
      20,
      60
    );
    doc.setFontSize(10);
    doc.text(
      `Transaction Type: ${isInvoice ? 'Client Online Jewelry Payout' : 'Client Assay Melt Payout'}`,
      20,
      68
    );
    doc.text('Status: Verified Spot Lock', 125, 68);
    doc.text('Currency: USD ($)', 20, 74);

    if (isInvoice) {
      doc.text(`Client Name: ${customClientName}`, 20, 80);
      doc.text(`Items: ${items.length}`, 125, 80);
      doc.text(`Client Address: ${clientAddressCombined}`, 20, 86);
      doc.text(`Client Phone: ${phoneNumber}`, 125, 86);
    } else if (hasClientInfoQuote) {
      const clientInfoParts = [];
      if (customClientName.trim()) clientInfoParts.push(`Client: ${customClientName.trim()}`);
      if (phoneNumber.trim()) clientInfoParts.push(`Phone: ${phoneNumber.trim()}`);
      doc.text(clientInfoParts.join('   |   '), 20, 81);
    }

    let cursorY = 86 + infoYOffset;

    doc.setFillColor(17, 22, 34);
    doc.rect(15, cursorY, 180, 10, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ASSET DESCRIPTION', 20, cursorY + 6.5);
    doc.text('WEIGHT', 90, cursorY + 6.5);
    doc.text('SPOT RATE', 125, cursorY + 6.5);
    doc.text('BASE VALUE', 160, cursorY + 6.5);
    cursorY += 10;

    const metalLabels = {
      gold24kGram: 'Gold 24K Pure',
      gold21kGram: 'Gold 21K Karat',
      gold18kGram: 'Gold 18K Karat',
      gold14kGram: 'Gold 14K Karat',
      gold10kGram: 'Gold 10K Karat',
      gold9kGram: 'Gold 9K Karat',
      silver925ItalyGram: 'Silver 925 Sterling',
      bullion24kGram: 'Bullion Jewelry 24K',
      custom: 'Custom Item',
    };

    const pdfRatePerGram = getRatePerGram(selectedMetal, metals, customRatePerGram);

    // Itemized entry (Custom, or any Invoice) draws one row per item, each
    // priced individually. A plain Quote for a standard karat draws the
    // original single row driven by the simple weight field.
    const rows = useItemizedEntry
      ? items
          .filter((it) => it.weight !== '' && !Number.isNaN(Number(it.weight)) && Number(it.weight) > 0)
          .map((it) => ({
            description: it.description.trim() || metalLabels[selectedMetal],
            weight: Number(it.weight),
          }))
      : [{ description: metalLabels[selectedMetal], weight: Number(weight) }];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descriptionColWidth = 65; // mm available before the WEIGHT column starts at x=90

    rows.forEach((row) => {
      const wrappedLines = doc.splitTextToSize(row.description, descriptionColWidth);
      const rowHeight = Math.max(12, wrappedLines.length * 5 + 4);
      const rowBaseValue = row.weight * pdfRatePerGram;

      doc.setFillColor(255, 255, 255);
      doc.rect(15, cursorY, 180, rowHeight, 'F');
      doc.setTextColor(30, 41, 59);
      wrappedLines.forEach((line, idx) => {
        doc.text(line, 20, cursorY + 7 + idx * 5);
      });
      doc.text(`${row.weight.toFixed(2)} g`, 90, cursorY + 7);
      doc.text(`$${pdfRatePerGram.toFixed(2)} /g`, 125, cursorY + 7);
      doc.text(`$${rowBaseValue.toFixed(2)}`, 160, cursorY + 7);

      cursorY += rowHeight;
    });

    cursorY += 4;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, cursorY, 180, 36, 3, 3, 'F');

    const goldValueLabel = noFeeMode ? 'Gold Pricing Value (Fee Included):' : 'Base Gold Pricing Value:';
    const finalLabel = noFeeMode ? 'FINAL CLIENT GROSS:' : 'FINAL ESTIMATED CLIENT GROSS:';

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(goldValueLabel, 25, cursorY + 10);
    doc.text(`$${grossValue.toFixed(2)} USD`, 175, cursorY + 10, { align: 'right' });

    if (!noFeeMode) {
      doc.text('Custom Store Processing Fee / Add-on:', 25, cursorY + 18);
      doc.text(`+$${feeAmount.toFixed(2)} USD`, 175, cursorY + 18, { align: 'right' });
    }

    doc.setDrawColor(212, 175, 55);
    doc.line(25, cursorY + 23, 185, cursorY + 23);

    doc.setTextColor(17, 22, 34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(finalLabel, 25, cursorY + 31);
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(13);
    doc.text(`$${calculatedValue.toFixed(2)} USD`, 175, cursorY + 31, { align: 'right' });

    cursorY += 36;

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      isInvoice
        ? 'Terms: This invoice is calculated dynamically based on live market spot feeds and is valid for same-day store transactions.'
        : 'Terms: This quote is calculated dynamically based on live market spot feeds and is valid for same-day store transactions.',
      105,
      cursorY + 14,
      { align: 'center' }
    );
    doc.text('Queen Jewelry LLC - https://queenjewelryllc.com', 105, cursorY + 19, { align: 'center' });

    if (isInvoice) {
      // Stamp sits centered, just under the two terms lines. Bumped up from
      // 30mm to 38mm wide per request, sized to its ~1.08:1 aspect ratio.
      const stampWidth = 38;
      const stampHeight = stampWidth * (488 / 528);
      const stampX = (210 - stampWidth) / 2;
      const stampY = cursorY + 19 + 8;
      doc.addImage(STAMP_IMAGE_BASE64, 'PNG', stampX, stampY, stampWidth, stampHeight);
    }

    doc.save(`Queen_Jewelry_Quote_${Date.now()}.pdf`);

    const pdfDataUri = doc.output('datauristring');
    const pdfBase64 = pdfDataUri.split(',')[1];

    sendQuoteNotification({
      baseValue: grossValue,
      feeAmount,
      totalGross: calculatedValue,
      pdfBase64,
    });
  };

  return (
    <div style={{ background: '#070a12', color: '#f8fafc', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Cinzel", "Times New Roman", Times, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
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

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '20px 0' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                border: '3px solid rgba(212, 175, 55, 0.15)',
                borderTopColor: '#d4af37',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'sans-serif', margin: 0, textAlign: 'center' }}>
              📡 Fetching live commodity index ticks...
            </p>
            {slowLoading && (
              <p style={{ color: '#64748b', fontSize: '11px', fontFamily: 'sans-serif', margin: 0, textAlign: 'center', maxWidth: '280px' }}>
                Still working — our server is waking up from idle, this can take up to 30 seconds on the first visit.
              </p>
            )}
          </div>
        )}
        {error && <p style={{ color: '#ff4a77', background: 'rgba(255, 74, 119, 0.1)', padding: '10px', borderRadius: '8px', fontFamily: 'sans-serif' }}>{error}</p>}

        {metals && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '25px', width: '100%' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#d4af37', fontWeight: '400', letterSpacing: '1px', textTransform: 'uppercase' }}>Melt Value & Fee Calculator</h3>

              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', fontFamily: 'sans-serif' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>DOCUMENT TYPE</label>
                  <select
                    value={documentType}
                    onChange={handleDocumentTypeChange}
                    style={{ width: '100%', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="quote">Quote</option>
                    <option value="invoice">Invoice</option>
                  </select>
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
                    <option value="gold14kGram">Gold 14K (Per Gram)</option>
                    <option value="gold10kGram">Gold 10K (Per Gram)</option>
                    <option value="gold9kGram">Gold 9K (Per Gram)</option>
                    <option value="silver925ItalyGram">Silver 925 Italy (Per Gram)</option>
                    <option value="bullion24kGram">Bullion Jewelry 24K (Per Gram)</option>
                    <option value="custom">Custom (Manual Entry)</option>
                  </select>
                </div>

                {useItemizedEntry ? (
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px', fontWeight: '600' }}>
                      ITEMS (DESCRIPTION + WEIGHT)
                    </label>
                    {items.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder={`Item ${idx + 1} description`}
                          style={{ flex: 2, boxSizing: 'border-box', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                        <input
                          type="number"
                          step="any"
                          value={item.weight}
                          onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                          placeholder="Weight (g)"
                          style={{ flex: 1, boxSizing: 'border-box', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            style={{ padding: '10px 12px', background: 'transparent', border: '1px solid rgba(255,74,119,0.4)', color: '#ff4a77', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={items.length >= 10}
                      style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px dashed rgba(212,175,55,0.4)', color: '#d4af37', borderRadius: '6px', fontSize: '12px', cursor: items.length >= 10 ? 'default' : 'pointer', opacity: items.length >= 10 ? 0.5 : 1 }}
                    >
                      + Add Item {items.length >= 10 ? '(max 10)' : ''}
                    </button>
                  </div>
                ) : (
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
                )}

                {selectedMetal === 'custom' ? (
                  <>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                        TOTAL PRICE PER GRAM (MANUAL, $)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={customRatePerGram}
                        onChange={(e) => setCustomRatePerGram(e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#d4af37', fontSize: '15px', outline: 'none', fontWeight: 'bold' }}
                      />
                    </div>

                    {isInvoice && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                          ADD STORE PROCESSING FEE PER GRAM?
                        </label>
                        <select
                          value={chargeFeePerGram}
                          onChange={(e) => setChargeFeePerGram(e.target.value)}
                          style={{ width: '100%', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}

                    {isInvoice && chargeFeePerGram === 'yes' && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                          STORE PROCESSING / MARGIN FEE ($/Gram)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={customFee}
                          onChange={(e) => setCustomFee(e.target.value)}
                          placeholder="0.00"
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#d4af37', fontSize: '15px', outline: 'none', fontWeight: 'bold' }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                      {selectedMetal === 'bullion24kGram' ? 'STORE PROCESSING / MARGIN FEE ($, FLAT)' : 'STORE PROCESSING / MARGIN FEE ($/Gram)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={customFee}
                      onChange={(e) => setCustomFee(e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#d4af37', fontSize: '15px', outline: 'none', fontWeight: 'bold' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                    CLIENT NAME {isInvoice ? '(REQUIRED)' : '(OPTIONAL)'}
                  </label>
                  <input
                    type="text"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    placeholder="Full name"
                    required={isInvoice}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                    CLIENT PHONE NUMBER {isInvoice ? '(REQUIRED)' : '(OPTIONAL)'}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    required={isInvoice}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                  />
                </div>

                {isInvoice && (
                  <>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                        CLIENT STREET ADDRESS (REQUIRED)
                      </label>
                      <input
                        type="text"
                        value={clientStreetAddress}
                        onChange={(e) => setClientStreetAddress(e.target.value)}
                        placeholder="123 Main St"
                        required
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                          CITY (REQUIRED)
                        </label>
                        <input
                          type="text"
                          value={clientCity}
                          onChange={(e) => setClientCity(e.target.value)}
                          placeholder="Fort Worth"
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                          STATE
                        </label>
                        <input
                          type="text"
                          value={clientState}
                          onChange={(e) => setClientState(e.target.value.toUpperCase())}
                          placeholder="TX"
                          maxLength={2}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none', textTransform: 'uppercase' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                          ZIP
                        </label>
                        <input
                          type="text"
                          value={clientZip}
                          onChange={(e) => setClientZip(e.target.value)}
                          placeholder="76244"
                          maxLength={10}
                          required
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                        Invoices require a one-time verification code emailed to our store before generating.
                      </p>
                      <button
                        type="button"
                        onClick={sendVerificationCode}
                        disabled={!requiredInvoiceFieldsFilled || verificationSending || verificationVerified}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: verificationVerified ? 'rgba(56,239,125,0.15)' : 'transparent',
                          border: `1px solid ${verificationVerified ? '#38ef7d' : 'rgba(212,175,55,0.4)'}`,
                          color: verificationVerified ? '#38ef7d' : '#d4af37',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: requiredInvoiceFieldsFilled && !verificationVerified ? 'pointer' : 'default',
                          opacity: !requiredInvoiceFieldsFilled ? 0.5 : 1,
                        }}
                      >
                        {verificationVerified ? '✅ Verified' : verificationSending ? 'Sending code...' : 'Send Verification Code'}
                      </button>
                      {verificationError && !verificationModalOpen && (
                        <p style={{ color: '#ff4a77', fontSize: '11px', marginTop: '8px', marginBottom: 0 }}>{verificationError}</p>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isInvoice && (!requiredInvoiceFieldsFilled || !verificationVerified)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: isInvoice && (!requiredInvoiceFieldsFilled || !verificationVerified)
                      ? 'rgba(212, 175, 55, 0.25)'
                      : 'linear-gradient(135deg, #d4af37 0%, #aa841c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000000',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: isInvoice && (!requiredInvoiceFieldsFilled || !verificationVerified) ? 'not-allowed' : 'pointer',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)',
                  }}
                >
                  Calculate Client Total Gross
                </button>
              </form>

              {calculatedValue !== null && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(56, 239, 125, 0.04)', borderRadius: '10px', border: '1px solid rgba(56, 239, 125, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontFamily: 'sans-serif' }}>FINAL ESTIMATED CLIENT GROSS (GOLD + FEES)</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#38ef7d', marginTop: '4px' }}>
                    ${calculatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}> USD</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Gold Base: ${grossValue.toFixed(2)} | Fee Added: +${feeAmount.toFixed(2)}
                  </div>
                  <button
                    onClick={generatePDFReceipt}
                    style={{ marginTop: '14px', padding: '10px 20px', background: '#111622', border: '1px solid #38ef7d', color: '#38ef7d', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }}
                  >
                    📥 DOWNLOAD PDF CLIENT RECEIPT
                  </button>

                  {isInvoice && (
                    <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.08)', textAlign: 'left' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                        PRINT USPS SHIPPING LABEL?
                      </label>
                      <select
                        value={printShippingLabel}
                        onChange={(e) => { setPrintShippingLabel(e.target.value); setLabelResult(null); setLabelError(''); }}
                        style={{ width: '100%', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>

                      {printShippingLabel === 'yes' && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                            SIGNATURE REQUIRED
                          </label>
                          <select
                            value={signatureOption}
                            onChange={(e) => setSignatureOption(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: '10px' }}
                          >
                            <option value="without">No</option>
                            <option value="with">Yes</option>
                          </select>

                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                            SHIPPING DATE
                          </label>
                          <input
                            type="date"
                            value={mailingDate}
                            onChange={(e) => setMailingDate(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: '10px' }}
                          />

                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '5px', letterSpacing: '1px', fontWeight: '600' }}>
                            PACKAGE VALUE (OPTIONAL, $) — INSURANCE
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={packageValue}
                            onChange={(e) => setPackageValue(e.target.value)}
                            placeholder="0.00"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: Number(packageValue) > 500 ? '4px' : '10px' }}
                          />
                          {Number(packageValue) > 500 && (
                            <p style={{ color: '#f5a623', fontSize: '10px', margin: '0 0 10px 0' }}>
                              ⚠️ USPS caps insurance payouts for jewelry/precious metals at $500, regardless of declared value.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={requestShippingLabel}
                            disabled={labelGenerating || !mailingDate}
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: labelGenerating ? 'default' : 'pointer' }}
                          >
                            {labelGenerating ? 'Generating label...' : '🖨️ Generate Shipping Label'}
                          </button>

                          {labelError && (
                            <p style={{ color: '#ff4a77', fontSize: '11px', marginTop: '8px' }}>{labelError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 175, 55, 0.15)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', margin: '0', fontWeight: 'normal', color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Market Rates (USD)</h2>
                <button onClick={fetchRates} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#d4af37', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: '600' }}>
                  REFRESH
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#d4af37', letterSpacing: '2px', fontWeight: 'bold', borderBottom: '1px dashed rgba(212,175,55,0.3)', paddingBottom: '4px', textAlign: 'left', fontFamily: 'sans-serif' }}>OUNCE PRICING</div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 24K OUNCE</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#ffffff', fontFamily: 'serif' }}>${Math.round(metals.gold24kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 21K OUNCE</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#ff9f43', fontFamily: 'serif' }}>${Math.round(metals.gold21kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 18K OUNCE</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#00f2fe', fontFamily: 'serif' }}>${Math.round(metals.gold18kOunce).toLocaleString()}</div>
                  </div>

                  <div style={{ textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>SILVER 925 OUNCE</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#38ef7d', fontFamily: 'serif' }}>${(metals.silver925ItalyGram * 31.1035).toFixed(2)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '15px' }}>
                  <div style={{ fontSize: '11px', color: '#d4af37', letterSpacing: '2px', fontWeight: 'bold', borderBottom: '1px dashed rgba(212,175,55,0.3)', paddingBottom: '4px', textAlign: 'left', fontFamily: 'sans-serif' }}>GRAM PRICING</div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 24K GRAM</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#ffffff', fontFamily: 'serif' }}>${metals.gold24kGram.toFixed(2)}</div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 21K GRAM</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#ff9f43', fontFamily: 'serif' }}>${metals.gold21kGram.toFixed(2)}</div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>GOLD 18K GRAM</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#00f2fe', fontFamily: 'serif' }}>${metals.gold18kGram.toFixed(2)}</div>
                  </div>

                  <div style={{ textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'sans-serif' }}>SILVER 925 ITALY</div>
                    <div style={{ fontSize: '20px', fontWeight: '300', color: '#38ef7d', fontFamily: 'serif' }}>${metals.silver925ItalyGram.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '13px', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px', width: '100%' }}>
              <a href="https://queenjewelryllc.com" target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: '600' }}>Official Website</a>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
              <a href="https://www.facebook.com/profile.php?id=61586279284348" target="_blank" rel="noreferrer" style={{ color: '#4facfe', textDecoration: 'none', fontWeight: '600' }}>Facebook Page</a>
            </div>
          </div>
        )}
      </div>

      {verificationModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#111622',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '340px',
              width: '100%',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontFamily: 'sans-serif',
              textAlign: 'left',
            }}
          >
            <h3 style={{ color: '#d4af37', margin: '0 0 10px 0', fontSize: '16px' }}>Enter Verification Code</h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0' }}>
              A code was emailed to our store. If you don't receive it, contact us at +1 (682) 217-3134.
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={verificationCodeInput}
              onChange={(e) => setVerificationCodeInput(e.target.value)}
              placeholder="6-digit code"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#090d16', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', outline: 'none', marginBottom: '12px' }}
            />
            {verificationError && (
              <p style={{ color: '#ff4a77', fontSize: '12px', margin: '0 0 12px 0' }}>{verificationError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setVerificationModalOpen(false); setVerificationError(''); }}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitVerificationCode}
                disabled={verifyingCode || verificationCodeInput.trim() === ''}
                style={{ flex: 1, padding: '10px', background: '#d4af37', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                {verifyingCode ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {labelConfirmModalOpen && labelResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#111622',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '340px',
              width: '100%',
              border: '1px solid rgba(56, 239, 125, 0.3)',
              fontFamily: 'sans-serif',
              textAlign: 'left',
            }}
          >
            <h3 style={{ color: '#38ef7d', margin: '0 0 14px 0', fontSize: '16px' }}>Shipping Label Ready</h3>
            <div style={{ background: '#090d16', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0' }}>
                Tracking: <span style={{ color: '#fff' }}>{labelResult.trackingNumber}</span>
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 4px 0' }}>
                Base Postage: <span style={{ color: '#fff' }}>${labelResult.basePostage?.toFixed(2)}</span>
              </p>
              {labelResult.extraServicesBreakdown?.map((s, i) => (
                <p key={i} style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 4px 0' }}>
                  {s.name}: <span style={{ color: '#fff' }}>+${s.price.toFixed(2)}</span>
                </p>
              ))}
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 6px 0', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                Total Postage: <span style={{ color: '#38ef7d', fontWeight: 'bold' }}>${labelResult.postage.toFixed(2)}</span>
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0' }}>
                Signature: <span style={{ color: '#fff' }}>{signatureOption === 'with' ? 'Required' : 'Not required'}</span>
              </p>
              {Number(packageValue) > 0 && (
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0' }}>
                  Insured Value: <span style={{ color: '#fff' }}>${Number(packageValue).toFixed(2)}</span>
                </p>
              )}
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Ship Date: <span style={{ color: '#fff' }}>{mailingDate}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setLabelConfirmModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { downloadShippingLabel(); setLabelConfirmModalOpen(false); }}
                style={{ flex: 1, padding: '10px', background: '#38ef7d', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Confirm & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
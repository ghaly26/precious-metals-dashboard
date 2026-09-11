import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';
dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

const troyOunceToGram = 31.1035;

// 🧪 TEMPORARY TEST TOGGLE: set to false to skip goldprice.dev and metals.dev
// entirely and always serve HARD_FALLBACK below. Flip back to true when done testing.
const USE_LIVE_SOURCES = true; // Set to true in production

// Last known-good prices, used only if every live source AND the cache are unavailable.
const HARD_FALLBACK = { xau: 4428.72, xag: 66.40 };

// Simple in-memory cache so we don't hammer either source on every dashboard refresh.
// 10 minutes comfortably keeps monthly usage well under goldprice.dev's 1,000/mo
// and metals.dev's 100/mo free-tier caps, even with steady daytime traffic.
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
}

async function fetchLocationForIp(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return null; // local/dev requests won't resolve to a real location
  }
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
    if (response.data?.status === 'success') {
      return {
        ip,
        city: response.data.city,
        region: response.data.regionName,
        country: response.data.country,
        loc: `${response.data.lat}, ${response.data.lon}`,
        org: response.data.isp,
      };
    }
  } catch (err) {
    console.warn('IP geolocation lookup failed:', err.message);
  }
  return null;
}

async function fetchGoldpriceDevPrice(metal) {
  // /v1/convert is documented as free for both XAU and XAG (unlike /v1/prices,
  // whose silver row is gated to paid tiers). Works with or without an API key.
  const apiKey = process.env.GOLDPRICE_DEV_API_KEY;
  const url = `https://api.goldprice.dev/v1/convert?from=${metal}&to=USD&amount=1&unit=oz`;
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  const response = await axios.get(url, { timeout: 10000, headers });
  const price = parseFloat(response.data?.result);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`goldprice.dev returned no usable price for ${metal}.`);
  }
  return price;
}

async function fetchGoldpriceDevXauXag() {
  const [xau, xag] = await Promise.all([
    fetchGoldpriceDevPrice('XAU'),
    fetchGoldpriceDevPrice('XAG'),
  ]);
  return { xau, xag };
}

async function fetchMetalsDevPrice(metal) {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) {
    throw new Error("Missing METALS_DEV_API_KEY in server configuration.");
  }

  const url = `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=USD`;
  const response = await axios.get(url, { timeout: 10000 });

  const price = response.data?.rate?.price;
  if (!price || typeof price !== 'number') {
    throw new Error(`metals.dev returned no usable price for ${metal}.`);
  }
  return price;
}

async function fetchMetalsDevXauXag() {
  const [xau, xag] = await Promise.all([
    fetchMetalsDevPrice('gold'),
    fetchMetalsDevPrice('silver'),
  ]);
  return { xau, xag };
}

async function fetchLiveXauXag() {
  if (!USE_LIVE_SOURCES) {
    throw new Error("USE_LIVE_SOURCES is false — skipping live sources for testing.");
  }
  try {
    return await fetchGoldpriceDevXauXag();
  } catch (goldpriceError) {
    console.warn("goldprice.dev fetch failed, trying metals.dev fallback:", goldpriceError.message);
    return await fetchMetalsDevXauXag();
  }
}

function buildPayload({ xau, xag }) {
  return {
    status: "success",
    gold24kOunce: xau,
    gold24kGram: xau / troyOunceToGram,
    gold21kOunce: xau * 0.875,
    gold21kGram: (xau * 0.875) / troyOunceToGram,
    gold18kOunce: xau * 0.75,
    gold18kGram: (xau * 0.75) / troyOunceToGram,
    silver925ItalyGram: (xag / troyOunceToGram) * 0.925,
  };
}

app.get('/api/metals', async (req, res) => {
  const now = Date.now();

  if (cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return res.json(cache.data);
  }

  try {
    const prices = await fetchLiveXauXag();
    const payload = buildPayload(prices);
    cache = { data: payload, timestamp: now };
    return res.json(payload);
  } catch (error) {
    console.error("All live price sources failed:", error.message);

    if (cache.data) {
      console.warn("Serving stale cached prices after live source failure.");
      return res.json(cache.data);
    }

    console.warn("No cache available, serving hardcoded fallback prices.");
    return res.json(buildPayload(HARD_FALLBACK));
  }
});

const verificationCodes = new Map();
const VERIFICATION_CODE_EXPIRY_MS = 5 * 60 * 1000;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendResendEmail({ subject, html, attachments }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("⚠️ RESEND_API_KEY missing in environment variables. Email simulation logged only.");
    return;
  }

  const emailPayload = {
    from: 'Queen Jewelry Portal <admin@queenjewelryllc.com>',
    to: ['info@queenjewelryllc.com'],
    subject,
    html,
  };
  if (attachments) {
    emailPayload.attachments = attachments;
  }

  await axios.post('https://api.resend.com/emails', emailPayload, {
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

app.post('/api/send-verification-code', async (req, res) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'RESEND_API_KEY is not configured.'
      });
    }

    const code = generateVerificationCode();

    verificationCodes.set('invoice', {
      code,
      expiresAt: Date.now() + VERIFICATION_CODE_EXPIRY_MS
    });

    await sendResendEmail({
      subject: '🔐 Queen Jewelry Invoice Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>Queen Jewelry Invoice Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:8px;">${code}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error(
      'Verification email failed:',
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: 'Failed to send verification email.'
    });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { code } = req.body;
  const saved = verificationCodes.get('invoice');

  if (!saved || Date.now() > saved.expiresAt) {
    verificationCodes.delete('invoice');
    return res.json({ valid: false });
  }

  if (code !== saved.code) {
    return res.json({ valid: false });
  }

  verificationCodes.delete('invoice');
  res.json({ valid: true });
});

// 🟢 Client Quote Notification Route (Emails info@queenjewelryllc.com)
app.post('/api/send-quote', async (req, res) => {
  const { metalType, weight, spotRate, baseValue, customFee, totalGross, phoneNumber, clientName, clientAddress, documentType, items, pdfBase64, timestamp } = req.body;

  try {
    const clientIp = getClientIp(req);
    const serverLocation = await fetchLocationForIp(clientIp);
    const locationData = serverLocation || req.body.locationData || null;

    const itemsListHtml = Array.isArray(items) && items.length > 0
      ? `<h3 style="color: #00f2fe; margin-top: 20px;">Items:</h3>
         <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
           ${items.map((it) => `<li>${it.description || 'Unnamed item'} — ${it.weight}g</li>`).join('')}
         </ul>`
      : '';

    const emailSubject = `👑 New Client Valuation Quote - ${metalType} (${weight}g)`;
    const emailHtmlContent = `
      <div style="font-family: sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 10px;">
        <h2 style="color: #d4af37; border-bottom: 1px solid #334155; padding-bottom: 10px;">Queen Jewelry - Portal Quote Log</h2>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Document Type:</strong> ${documentType === 'invoice' ? 'Invoice' : 'Quote'}</p>

        <h3 style="color: #38ef7d; margin-top: 20px;">Client Contact & Location Details:</h3>
        <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
          <li><strong>Client Name:</strong> ${clientName || 'Not provided'}</li>
          <li><strong>Client Address:</strong> ${clientAddress || 'Not provided'}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber || 'Not provided'}</li>
          <li><strong>IP Address:</strong> ${locationData?.ip || 'Unknown'}</li>
          <li><strong>Location:</strong> ${locationData?.city || 'Unknown'}, ${locationData?.region || ''} ${locationData?.country || ''}</li>
          <li><strong>Coordinates:</strong> ${locationData?.loc || 'Unknown'}</li>
          <li><strong>Network / ISP:</strong> ${locationData?.org || 'Unknown'}</li>
        </ul>

        ${itemsListHtml}

        <h3 style="color: #00f2fe; margin-top: 20px;">Valuation Breakdown:</h3>
        <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
          <li><strong>Metal Purity:</strong> ${metalType}</li>
          <li><strong>Total Weight:</strong> ${weight} grams</li>
          <li><strong>Spot Rate:</strong> $${spotRate} /g</li>
          <li><strong>Gold Base Value:</strong> $${baseValue} USD</li>
          <li><strong>Store Processing Fee:</strong> +$${customFee} USD</li>
          <li style="font-size: 16px; color: #38ef7d; margin-top: 8px;"><strong>Final Client Gross:</strong> $${totalGross} USD</li>
        </ul>
      </div>
    `;
    // Initialize API key for Resend email service
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const attachments = pdfBase64
        ? [{ filename: `Queen_Jewelry_Quote_${Date.now()}.pdf`, content: pdfBase64 }]
        : undefined;
      await sendResendEmail({ subject: emailSubject, html: emailHtmlContent, attachments });
      console.log("📨 Quote notification email sent successfully to info@queenjewelryllc.com");
    } else {
      console.log("⚠️ RESEND_API_KEY missing in environment variables. Email simulation logged only.");
    }

    res.json({ success: true, message: "Quote log recorded successfully." });
  } catch (error) {
    console.error("Quote email dispatch failure:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Failed to process quote notification." });
  }
});

// 🟢 Weekly reminder email: real usage numbers from goldprice.dev, plus a nudge
// to check metals.dev's dashboard manually (no public usage API on their free tier).
async function checkQuotaAndNotify() {
  let goldpriceUsage = null;
  try {
    const apiKey = process.env.GOLDPRICE_DEV_API_KEY;
    if (apiKey) {
      const response = await axios.get('https://api.goldprice.dev/v1/account/usage', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });
      goldpriceUsage = response.data;
    }
  } catch (err) {
    console.warn('Could not fetch goldprice.dev usage for weekly reminder:', err.message);
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 10px;">
      <h2 style="color: #d4af37;">📊 Weekly API Quota Check-In</h2>
      <p>Time for your weekly check on the metals price API accounts.</p>
      <h3 style="color: #38ef7d;">goldprice.dev (auto-checked)</h3>
      <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
        <li><strong>Calls this month:</strong> ${goldpriceUsage?.calls_this_month ?? 'Unable to fetch — check dashboard'}</li>
        <li><strong>Calls today:</strong> ${goldpriceUsage?.calls_today ?? 'N/A'}</li>
      </ul>
      <h3 style="color: #00f2fe;">metals.dev (please check manually)</h3>
      <p>No public usage API on the free tier — log in to <a href="https://metals.dev" style="color:#d4af37;">metals.dev</a> to confirm you're within your 100/month limit.</p>
    </div>
  `;

  try {
    await sendResendEmail({ subject: '📊 Queen Jewelry — Weekly API Quota Check-In', html });
    console.log('📨 Weekly quota reminder email sent.');
  } catch (err) {
    console.error('Weekly quota reminder email failed:', err.response?.data || err.message);
  }
}

// Runs every Saturday at 9:00 AM Central Time (Fort Worth, TX).
cron.schedule('0 9 * * 6', checkQuotaAndNotify, { timezone: 'America/Chicago' });

// Manual trigger for testing the weekly reminder without waiting for Saturday.
app.get('/api/test-quota-email', async (req, res) => {
  try {
    await checkQuotaAndNotify();
    res.json({ success: true, message: 'Quota reminder email triggered.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🟢 USPS Shipping Label Integration (Invoice mode only)
// Two tokens are required by USPS: an OAuth access token, and a separate
// Payment Authorization token tied to your CRID/MID/account. Both are cached
// and auto-refreshed shortly before they expire.
let uspsTokenCache = { token: null, expiresAt: 0 };
let uspsPaymentTokenCache = { token: null, expiresAt: 0 };

async function getUspsAccessToken() {
  if (uspsTokenCache.token && Date.now() < uspsTokenCache.expiresAt - 60 * 1000) {
    return uspsTokenCache.token;
  }

  const response = await axios.post(
    'https://apis.usps.com/oauth2/v3/token',
    {
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const { access_token, expires_in } = response.data;
  uspsTokenCache = {
    token: access_token,
    expiresAt: Date.now() + Number(expires_in) * 1000,
  };
  return access_token;
}

async function getUspsPaymentToken() {
  if (uspsPaymentTokenCache.token && Date.now() < uspsPaymentTokenCache.expiresAt - 60 * 1000) {
    return uspsPaymentTokenCache.token;
  }

  const accessToken = await getUspsAccessToken();

  const crid = process.env.USPS_CRID;
  const mid = process.env.USPS_MID; // Required — get this from your USPS Business Customer Gateway BSA
  const manifestMid = process.env.USPS_MANIFEST_MID || mid;
  const accountType = process.env.USPS_ACCOUNT_TYPE || 'EPS';
  const accountNumber = process.env.USPS_ACCOUNT_NUMBER;

  if (!crid || !mid || !accountNumber) {
    throw new Error(
      'Missing USPS_CRID, USPS_MID, or USPS_ACCOUNT_NUMBER in server configuration. MID must come from your USPS Business Customer Gateway.'
    );
  }

  const role = { CRID: crid, MID: mid, manifestMID: manifestMid, accountType, accountNumber };

  const response = await axios.post(
    'https://apis.usps.com/payments/v3/payment-authorization',
    { roles: [{ roleName: 'PAYER', ...role }, { roleName: 'LABEL_OWNER', ...role }] },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  uspsPaymentTokenCache = {
    token: response.data.paymentAuthorizationToken,
    // USPS docs state this token is valid ~8 hours; refresh 5 min early to be safe.
    expiresAt: Date.now() + (8 * 60 - 5) * 60 * 1000,
  };
  return uspsPaymentTokenCache.token;
}

// USPS's label endpoint returns multipart/form-data (JSON metadata + a PDF
// part), not plain JSON, so axios's default JSON parsing can't be used —
// this pulls both parts out of the raw multipart body manually.
function parseMultipartLabelResponse(contentType, rawBody) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    throw new Error('USPS response was not multipart as expected — no boundary found.');
  }
  const boundary = `--${boundaryMatch[1].replace(/"/g, '')}`;
  const parts = rawBody.split(boundary).filter((p) => p.trim() && p.trim() !== '--');

  let labelMetadata = null;
  let labelImageBase64 = null;

  for (const part of parts) {
    if (part.includes('name="labelMetadata"')) {
      const jsonStart = part.indexOf('{');
      const jsonEnd = part.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        labelMetadata = JSON.parse(part.slice(jsonStart, jsonEnd));
      }
    } else if (part.includes('name="labelImage"')) {
      const afterHeaders = part.split(/\r?\n\r?\n/).slice(1).join('\n\n').trim();
      labelImageBase64 = afterHeaders;
    }
  }

  return { labelMetadata, labelImageBase64 };
}

app.post('/api/create-shipping-label', async (req, res) => {
  const { toAddress, weightLb, signatureRequired, mailingDate, packageValue } = req.body;

  try {
    const accessToken = await getUspsAccessToken();
    const paymentToken = await getUspsPaymentToken();

    const packageDescription = {
      mailClass: 'PRIORITY_MAIL',
      // Confirmed from USPS's official Domestic Labels 3.0 OpenAPI spec:
      // "FS" = Small Flat Rate Box. This bills the fixed $10.54 flat rate
      // rather than by-weight pricing (which is what "SP" gave us before).
      rateIndicator: 'FS',
      weightUOM: 'lb',
      weight: weightLb,
      dimensionsUOM: 'in',
      // Priority Mail Small Flat Rate Box — confirmed inside dimensions from
      // USPS's own price list and the user's live checkout screen.
      length: 8.625,
      width: 5.375,
      height: 1.625,
      processingCategory: 'MACHINABLE',
      mailingDate: mailingDate || new Date().toISOString().split('T')[0],
      destinationEntryFacilityType: 'NONE',
    };

    // Both signature and insurance ride in the same extraServices array —
    // collect them together rather than overwriting one with the other.
    const extraServiceCodes = [];

    if (signatureRequired) {
      // Confirmed from the official spec: 921 = Signature Confirmation.
      extraServiceCodes.push(921);
      // Required whenever a signature extraServices code (921 among others)
      // is requested. true = physical signature; false allows USPS eSOL
      // (electronic signature) instead.
      packageDescription.physicalSignatureRequired = true;
    }

    if (packageValue && Number(packageValue) > 0) {
      // Confirmed from the official spec: 930 = Insurance <= $500. USPS
      // automatically swaps this to 931 (Insurance > $500) server-side if
      // the declared packageValue exceeds $500 — no action needed here.
      // Reminder: USPS still caps actual payouts at $500 for jewelry/
      // precious metals/coins regardless of declared value, per policy.
      extraServiceCodes.push(930);
      packageDescription.packageOptions = { packageValue: Number(packageValue) };
    }

    if (extraServiceCodes.length > 0) {
      packageDescription.extraServices = extraServiceCodes;
    }

    const labelRequestBody = {
      imageInfo: {
        imageType: 'PDF',
        labelType: '4X6LABEL',
        receiptOption: 'NONE',
        suppressPostage: false,
        suppressMailDate: false,
        returnLabel: false,
      },
      toAddress: {
        firstName: toAddress.firstName,
        lastName: toAddress.lastName,
        streetAddress: toAddress.streetAddress,
        city: toAddress.city,
        state: toAddress.state,
        ZIPCode: toAddress.ZIPCode,
      },
      fromAddress: {
        firstName: 'Queen',
        lastName: 'Jewelry',
        firm: 'Queen Jewelry LLC',
        streetAddress: '3725 Summersville Ln',
        city: 'Fort Worth',
        state: 'TX',
        ZIPCode: '76244',
      },
      packageDescription,
    };

    const response = await axios.post('https://apis.usps.com/labels/v3/label', labelRequestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Payment-Authorization-Token': paymentToken,
        'Content-Type': 'application/json',
      },
      responseType: 'text', // USPS returns multipart, not JSON — parse it manually below
    });

    const { labelMetadata, labelImageBase64 } = parseMultipartLabelResponse(
      response.headers['content-type'],
      response.data
    );

    if (!labelImageBase64) {
      throw new Error('USPS response did not include a label image.');
    }

    res.json({
      success: true,
      trackingNumber: labelMetadata?.trackingNumber,
      postage: labelMetadata?.postage,
      labelPdfBase64: labelImageBase64,
    });
  } catch (error) {
    // responseType: 'text' means axios won't auto-parse a JSON error body —
    // it arrives as a raw string, so error.response.data.error.message would
    // silently be undefined. Parse it manually to get USPS's actual message.
    let uspsErrorDetail = null;
    const rawErrorData = error.response?.data;
    if (rawErrorData) {
      if (typeof rawErrorData === 'string') {
        try {
          uspsErrorDetail = JSON.parse(rawErrorData);
        } catch {
          uspsErrorDetail = rawErrorData; // not JSON — keep as-is for logging
        }
      } else {
        uspsErrorDetail = rawErrorData;
      }
    }

    console.error('USPS label creation failed:', uspsErrorDetail || error.message);

    const uspsMessage =
      uspsErrorDetail?.error?.message ||
      uspsErrorDetail?.error?.errors?.[0]?.detail ||
      (typeof uspsErrorDetail === 'string' ? uspsErrorDetail : null);

    res.status(500).json({
      success: false,
      error: uspsMessage || error.message || 'Failed to create shipping label.',
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Queen Jewelry Live Metals Server running on port ${port}`));
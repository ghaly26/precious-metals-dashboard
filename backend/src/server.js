import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

const troyOunceToGram = 31.1035;

// Last known-good prices, used only if every live source AND the cache are unavailable.
const HARD_FALLBACK = { xau: 4478.50, xag: 68.40 };

// Simple in-memory cache so we don't hammer either source on every dashboard refresh.
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 120 * 1000; // 2 minutes

const NETDANIA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

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

function extractPriceAfterLabel(html, label) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ');

  const idx = text.indexOf(label);
  if (idx === -1) return null;

  const after = text.slice(idx + label.length, idx + label.length + 500);
  const match = after.match(/-?\d{1,3}(?:,\d{3})*\.\d{1,4}/);
  if (!match) return null;

  const value = parseFloat(match[0].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function fetchNetdaniaPrice(path, label) {
  const url = `https://m.netdania.com/commodities/${path}/idc`;
  const response = await axios.get(url, { timeout: 10000, headers: NETDANIA_HEADERS });
  const price = extractPriceAfterLabel(response.data, label);
  if (!price) {
    throw new Error(`Could not parse "${label}" price from Netdania response.`);
  }
  return price;
}

async function fetchNetdaniaXauXag() {
  const [xau, xag] = await Promise.all([
    fetchNetdaniaPrice('xauusdoz', 'Gold, spot'),
    fetchNetdaniaPrice('xagusdoz', 'Silver, spot'),
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
  try {
    return await fetchNetdaniaXauXag();
  } catch (netdaniaError) {
    console.warn("Netdania fetch failed, trying metals.dev fallback:", netdaniaError.message);
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

// 🟢 Client Quote Notification Route (Emails info@queenjewelryllc.com)
app.post('/api/send-quote', async (req, res) => {
  const { metalType, weight, spotRate, baseValue, customFee, totalGross, phoneNumber, pdfBase64, timestamp } = req.body;

  try {
    const clientIp = getClientIp(req);
    const serverLocation = await fetchLocationForIp(clientIp);
    const locationData = serverLocation || req.body.locationData || null;

    const emailSubject = `👑 New Client Valuation Quote - ${metalType} (${weight}g)`;
    const emailHtmlContent = `
      <div style="font-family: sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 10px;">
        <h2 style="color: #d4af37; border-bottom: 1px solid #334155; padding-bottom: 10px;">Queen Jewelry - Portal Quote Log</h2>
        <p><strong>Timestamp:</strong> ${timestamp}</p>

        <h3 style="color: #38ef7d; margin-top: 20px;">Client Contact & Location Details:</h3>
        <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
          <li><strong>Phone Number:</strong> ${phoneNumber || 'Not provided'}</li>
          <li><strong>IP Address:</strong> ${locationData?.ip || 'Unknown'}</li>
          <li><strong>Location:</strong> ${locationData?.city || 'Unknown'}, ${locationData?.region || ''} ${locationData?.country || ''}</li>
          <li><strong>Coordinates:</strong> ${locationData?.loc || 'Unknown'}</li>
          <li><strong>Network / ISP:</strong> ${locationData?.org || 'Unknown'}</li>
        </ul>

        <h3 style="color: #00f2fe; margin-top: 20px;">Valuation Breakdown:</h3>
        <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
          <li><strong>Metal Purity:</strong> ${metalType}</li>
          <li><strong>Weight:</strong> ${weight} grams</li>
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
      const emailPayload = {
        from: 'Queen Jewelry Portal <admin@queenjewelryllc.com>',
        to: ['info@queenjewelryllc.com'],
        subject: emailSubject,
        html: emailHtmlContent,
      };

      if (pdfBase64) {
        emailPayload.attachments = [
          {
            filename: `Queen_Jewelry_Quote_${Date.now()}.pdf`,
            content: pdfBase64,
          },
        ];
      }

      await axios.post('https://api.resend.com/emails', emailPayload, {
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        }
      });
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

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Queen Jewelry Live Metals Server running on port ${port}`));
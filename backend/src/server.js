import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const troyOunceToGram = 31.1035;

// Last known-good prices, used only if metals.dev AND the cache are both unavailable.
const HARD_FALLBACK = { xau: 2515.50, xag: 29.40 };

// Simple in-memory cache so we don't burn free-tier requests on every dashboard refresh.
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60 * 1000; // 1 minute

async function fetchMetalsDevPrice(metal) {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) {
    throw new Error("Missing METALS_DEV_API_KEY in server configuration.");
  }

  const url = `https://metals.dev{apiKey}&metal=${metal}&currency=USD`;
  const response = await axios.get(url, { timeout: 10000 });

  const price = response.data?.rate?.price;
  if (!price || typeof price !== 'number') {
    throw new Error(`metals.dev returned no usable price for ${metal}.`);
  }
  return price;
}

async function fetchLiveXauXag() {
  const [xau, xag] = await Promise.all([
    fetchMetalsDevPrice('gold'),
    fetchMetalsDevPrice('silver'),
  ]);
  return { xau, xag };
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

// 🟢 EXISTING: Live Metals Spot Price Route
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
    console.error("metals.dev fetch failed:", error.message);

    if (cache.data) {
      console.warn("Serving stale cached prices after metals.dev failure.");
      return res.json(cache.data);
    }

    console.warn("No cache available, serving hardcoded fallback prices.");
    return res.json(buildPayload(HARD_FALLBACK));
  }
});

// 🟢 NEW: Client Quote Notification Route (Emails info@queenjewelryllc.com)
app.post('/api/send-quote', async (req, res) => {
  const { metalType, weight, spotRate, baseValue, customFee, totalGross, locationData, timestamp } = req.body;

  try {
    const emailSubject = `👑 New Client Valuation Quote - ${metalType} (${weight}g)`;
    const emailHtmlContent = `
      <div style="font-family: sans-serif; padding: 20px; background: #0b0f19; color: #f8fafc; border-radius: 10px;">
        <h2 style="color: #d4af37; border-bottom: 1px solid #334155; padding-bottom: 10px;">Queen Jewelry - Portal Quote Log</h2>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        
        <h3 style="color: #38ef7d; margin-top: 20px;">Client Location Details:</h3>
        <ul style="background: #131c2e; padding: 15px; border-radius: 8px; list-style: none;">
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

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      await axios.post('https://resend.com', {
        from: 'Queen Jewelry Portal <onboarding@resend.dev>',
        to: ['info@queenjewelryllc.com'],
        subject: emailSubject,
        html: emailHtmlContent
      }, {
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
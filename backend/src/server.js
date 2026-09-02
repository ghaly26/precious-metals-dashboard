import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const troyOunceToGram = 31.1035;

// Last known-good prices, used only if Netdania AND the hardcoded fallback below are needed.
// Update these occasionally so the "last resort" fallback isn't wildly stale.
const HARD_FALLBACK = { xau: 2515.50, xag: 29.40 };

// Simple in-memory cache so we don't hammer Netdania on every dashboard refresh.
let cache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const NETDANIA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

/**
 * Netdania's mobile "full quote" pages render the price as plain text near a
 * label like "Gold, spot" / "Silver, spot". We strip tags to text and grab
 * the first decimal number that follows the label.
 */
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
  const response = await axios.get(url, {
    timeout: 10000,
    headers: NETDANIA_HEADERS,
  });
  const price = extractPriceAfterLabel(response.data, label);
  if (!price) {
    throw new Error(`Could not parse "${label}" price from Netdania response.`);
  }
  return price;
}

async function fetchLiveXauXag() {
  const [xau, xag] = await Promise.all([
    fetchNetdaniaPrice('xauusdoz', 'Gold, spot'),
    fetchNetdaniaPrice('xagusdoz', 'Silver, spot'),
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
    console.error("Netdania fetch failed:", error.message);

    // Serve a stale-but-real cached value rather than the hardcoded number, if we have one.
    if (cache.data) {
      console.warn("Serving stale cached prices after Netdania failure.");
      return res.json(cache.data);
    }

    console.warn("No cache available, serving hardcoded fallback prices.");
    return res.json(buildPayload(HARD_FALLBACK));
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Queen Jewelry Live Metals Server running on port ${port}`));
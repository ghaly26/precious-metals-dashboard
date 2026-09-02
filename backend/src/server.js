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

  const url = `https://api.metals.dev/v1/metal/spot?api_key=${apiKey}&metal=${metal}&currency=USD`;
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

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Queen Jewelry Live Metals Server running on port ${port}`));
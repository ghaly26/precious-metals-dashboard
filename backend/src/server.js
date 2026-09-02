import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    // 🟢 Connects to Yahoo Finance's unblocked high-frequency commodity tracking feeds
    const goldUrl = 'https://yahoo.com';
    const silverUrl = 'https://yahoo.com';

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // 1. Fetch live Gold prices natively
    const goldResponse = await axios.get(goldUrl, { headers, timeout: 10000 });
    
    // 2. Fetch live Silver prices natively
    const silverResponse = await axios.get(silverUrl, { headers, timeout: 10000 });

    // 3. Extract the exact final market quote from Yahoo's database array charts
    const xau = goldResponse.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const xag = silverResponse.data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    // Strict validation verification: No hardcoded fallback values allowed
    if (!xau || !xag) {
      throw new Error(`Market feed parsing error. Gold extracted: ${xau}, Silver: ${xag}`);
    }

    // Deliver exact computations directly to your luxury user interface
    res.json({
      status: "success",
      gold24kOunce: xau,
      gold24kGram: xau / troyOunceToGram,
      gold21kOunce: xau * 0.875,
      gold21kGram: (xau * 0.875) / troyOunceToGram,
      gold18kOunce: xau * 0.75,
      gold18kGram: (xau * 0.75) / troyOunceToGram,
      silver925ItalyGram: (xag / troyOunceToGram) * 0.925
    });

  } catch (error) {
    console.error("Yahoo Commodity Pipeline Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Yahoo Financial Stream Gateway active on port ${port}`));
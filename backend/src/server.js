import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Using your exact unblocked Axios properties and headers strategy
async function fetchNetdaniaPriceFeed() {
  const url = 'https://netdania.com';
  
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      "Accept": "text/html",
      "Origin": "https://netdania.com",
      "Referer": "https://netdania.com/"
    }
  });

  const streamText = response.data;

  // Regular expression searches explicitly for NetDania's internal price tracking matrix
  const goldMatch = streamText.match(/XAUUSD:IDC[^,]*,\s*([\d.]+)/);
  const silverMatch = streamText.match(/XAGUSD:IDC[^,]*,\s*([\d.]+)/);

  const goldSpot = goldMatch ? parseFloat(goldMatch[1]) : null;
  const silverSpot = silverMatch ? parseFloat(silverMatch[1]) : null;

  if (!goldSpot || !silverSpot) {
    throw new Error("Unable to parse live index streams from NetDania network packets.");
  }

  return { goldSpot, silverSpot };
}

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    const prices = await fetchNetdaniaPriceFeed();
    const xau = prices.goldSpot;
    const xag = prices.silverSpot;

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
    console.error("NetDania Stream Error Logged:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 NetDania Stream Engine live on port ${port}`));
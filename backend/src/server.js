import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    const response = await axios.get(
      "https://goldprice.org",
      {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
          "Accept": "application/json"
        }
      }
    );

    // 🟢 DEBUG LOG: Prints the exact keys NetDania is returning right now to your Render dashboard log panel
    console.log("-----------------------------------------");
    console.log("RAW NETDANIA DATA KEYS:", Object.keys(response.data));
    console.log("FULL DATA PAYLOAD:", JSON.stringify(response.data));
    console.log("-----------------------------------------");

    const marketData = response.data;

    // Smart-fallback parsing block: Tries multiple property name formats used by NetDania
    let xau = null;
    let xag = null;

    if (marketData) {
      // Structure format option 1: items object array
      if (marketData.items && marketData.items) {
        xau = parseFloat(marketData.items.xauPrice);
        xag = parseFloat(marketData.items.xagPrice);
      } 
      // Structure format option 2: root object variables
      else if (marketData.xauPrice || marketData.goldPrice) {
        xau = parseFloat(marketData.xauPrice || marketData.goldPrice);
        xag = parseFloat(marketData.xagPrice || marketData.silverPrice);
      }
      // Structure format option 3: array matrix elements
      else if (Array.isArray(marketData) && marketData[0]) {
        xau = parseFloat(marketData[0].xauPrice || marketData[0].price);
        xag = parseFloat(marketData[0].xagPrice || marketData[0].price);
      }
    }

    // Direct system block validation: No unparsed metrics allowed to pass through
    if (!xau || !xag) {
      throw new Error(`Data extraction map structural mismatch. Received keys: ${Object.keys(marketData || {}).join(', ')}`);
    }

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
    console.error("NetDania Engine Pipeline Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 NetDania High-Frequency Engine active on port ${port}`));
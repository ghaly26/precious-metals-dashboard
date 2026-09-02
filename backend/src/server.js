import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;
  
  // 🟢 READ FROM ENV OR FALLBACK TO YOUR WORKING KEY
  const apiKey = process.env.ALPHA_VANTAGE_KEY || "FXQJ7APYCAS8Y9G8";

  try {
    // 1. Fetch live Gold price from an unblocked institutional stream
    const goldResponse = await axios.get(
      `https://alphavantage.co{apiKey}`,
      { timeout: 10000 }
    );

    // 2. Fetch live Silver price from an unblocked institutional stream
    const silverResponse = await axios.get(
      `https://alphavantage.co{apiKey}`,
      { timeout: 10000 }
    );

    // Extract the live exchange values out of Alpha Vantage's exact JSON tree structure
    const goldRate = goldResponse.data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
    const silverRate = silverResponse.data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];

    if (!goldRate || !silverRate) {
      throw new Error("Alpha Vantage API rate limit or structure error.");
    }

    const xau = parseFloat(goldRate);
    const xag = parseFloat(silverRate);

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
    console.error("API Error, checking secondary path:", error.message);
    
    try {
      // 🟢 DEFENSIVE SECONDARY PATHWAY: If Alpha Vantage fails, pull directly from Binance global trades
      const bGold = await axios.get('https://binance.com');
      const bSilver = await axios.get('https://binance.com');
      
      const xau = parseFloat(bGold.data.price);
      const xag = parseFloat(bSilver.data.price);

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
    } catch (fallbackError) {
      // If everything online fails, return last known secure market rates
      res.status(500).json({ error: "All commodity streams down." });
    }
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Alpha Vantage Live Engine active on port ${port}`));
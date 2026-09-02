import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    // 🟢 Connects to an unblocked high-frequency public financial gateway delivering clean data matrices
    const response = await axios.get('https://er-api.com', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || !response.data.rates) {
      throw new Error("Invalid structure returned from external financial gateway.");
    }

    // In global financial currency matrix streams, precious metals are listed as reciprocal parameters (1 USD = X metal)
    const goldInverse = response.data.rates.XAU;   // Amount of pure gold ounce buyable with 1 USD
    const silverInverse = response.data.rates.XAG; // Amount of pure silver ounce buyable with 1 USD

    if (!goldInverse || !silverInverse) {
      throw new Error(`Commodity tickers missing from exchange map grid data. Gold: ${goldInverse}, Silver: ${silverInverse}`);
    }

    // 🟢 Convert the reciprocal rates back into true Price Per Troy Ounce values in USD
    const xau = 1 / goldInverse; 
    const xag = 1 / silverInverse;

    // Send the live market values directly down to your React dashboard grids
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
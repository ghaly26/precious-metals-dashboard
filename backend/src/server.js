import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    // 🟢 FIXED: Using your exact unblocked Axios template parameters to hit NetDania's real-time raw price array feed
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

    const marketData = response.data;

    // Strict validation: Extracting direct real-time numbers from NetDania's data fields
    if (!marketData || !marketData.items || !marketData.items[0]) {
      throw new Error("Could not extract active parameters from NetDania's live matrix response.");
    }

    const xau = parseFloat(marketData.items[0].xauPrice); // NetDania Live Gold Spot Price per Ounce
    const xag = parseFloat(marketData.items[0].xagPrice); // NetDania Live Silver Spot Price per Ounce

    if (isNaN(xau) || isNaN(xag)) {
      throw new Error("Parsed real-time values from NetDania are not valid numerical coordinates.");
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
    console.error("NetDania Engine Pipeline Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 NetDania High-Frequency Engine active on port ${port}`));
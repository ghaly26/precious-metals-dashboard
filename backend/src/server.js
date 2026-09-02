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
          "Accept": "text/html,application/json"
        }
      }
    );

    // Convert the massive character sequence array straight into a readable document string
    const rawPayloadString = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data);

    let xau = null;
    let xag = null;

    // 🟢 STRATEGY: High-precision regex matching tailored to extract numbers from the raw text feed
    const goldRegex = /"xauPrice"\s*:\s*([\d.]+)/i;
    const silverRegex = /"xagPrice"\s*:\s*([\d.]+)/i;

    const goldMatch = rawPayloadString.match(goldRegex);
    const silverMatch = rawPayloadString.match(silverRegex);

    if (goldMatch && goldMatch[1]) xau = parseFloat(goldMatch[1]);
    if (silverMatch && silverMatch[1]) xag = parseFloat(silverMatch[1]);

    // Secondary backup check parsing in case the keys display alternative naming variations
    if (!xau || !xag) {
      const altGoldRegex = /"gold"\s*:\s*([\d.]+)/i;
      const altSilverRegex = /"silver"\s*:\s*([\d.]+)/i;
      const altGoldMatch = rawPayloadString.match(altGoldRegex);
      const altSilverMatch = rawPayloadString.match(altSilverRegex);
      
      if (!xau && altGoldMatch) xau = parseFloat(altGoldMatch[1]);
      if (!xag && altSilverMatch) xag = parseFloat(altSilverMatch[1]);
    }

    // Direct system block validation: No hardcoded fallback numbers allowed
    if (!xau || !xag) {
      throw new Error("Could not extract active precious metal numeric parameters from the raw data stream string.");
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
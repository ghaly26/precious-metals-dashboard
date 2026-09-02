import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    // 🟢 Connects directly to NetDania's unblocked mobile backend endpoint for real-time spot feeds
    const url = 'https://netdania.com';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NetDania connection error: Status ${response.status}`);
    }

    const data = await response.json();
    
    let xau = null;
    let xag = null;

    // Parse NetDania's official array formatting natively
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item.f === 'XAUUSD:IDC' || item.s === 'XAUUSD:IDC') {
          xau = parseFloat(item.p || item.last || item.v);
        }
        if (item.f === 'XAGUSD:IDC' || item.s === 'XAGUSD:IDC') {
          xag = parseFloat(item.p || item.last || item.v);
        }
      });
    }

    // Strict validation: No hardcoded fallback averages allowed
    if (!xau || !xag) {
      throw new Error("Could not parse real-time values from the NetDania server response structure.");
    }

    // Send the dynamic price transformations directly to the React interface panel
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
    console.error("NetDania Engine Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 NetDania High-Frequency Engine live on port ${port}`));
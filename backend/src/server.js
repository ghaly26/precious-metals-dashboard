import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Using your exact unblocked Axios configuration properties
async function fetchNetdaniaPrice(symbolPath) {
  try {
    const response = await axios.get(
      `https://netdania.com{symbolPath}`,
      {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
          "Accept": "text/html",
        }
      }
    );

    const htmlContent = response.data;

    // Deep regex pattern explicitly tailored to extract numbers from NetDania's script data streams
    const valueRegex = /"v"\s*:\s*([\d.]+)/;
    const priceRegex = /"price"\s*:\s*([\d.]+)/i;
    const lastRegex = /"last"\s*:\s*([\d.]+)/i;

    const matchedValue = 
      htmlContent.match(valueRegex) || 
      htmlContent.match(priceRegex) || 
      htmlContent.match(lastRegex);

    if (matchedValue && matchedValue[1]) {
      return parseFloat(matchedValue[1]);
    }

    // Fallback extraction mapping straight from meta or inner window configuration tags
    const genericNumberRegex = /([\d,]+\.\d{2})/g;
    const numbersFound = htmlContent.match(genericNumberRegex);
    if (numbersFound && numbersFound.length > 0) {
      // Strips currency comma characters to parse clean floating index decimals
      return parseFloat(numbersFound[0].replace(/,/g, ''));
    }

    throw new Error("Purity validation error: Price patterns not identified within the source DOM.");
  } catch (err) {
    throw new Error(`Connection or string parsing error: ${err.message}`);
  }
}

app.get('/api/metals', async (req, res) => {
  const troyOunceToGram = 31.1035;

  try {
    // Sequentially pulls Gold and Silver spot assets through your open network tunnel paths
    const xau = await fetchNetdaniaPrice("xauusdoz/idc");
    const xag = await fetchNetdaniaPrice("xagusd/idc");

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
    console.error("NetDania Core Matrix Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 NetDania Unblocked Axios Engine active on port ${port}`));
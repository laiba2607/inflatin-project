import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Base prices (Pakistan approx)
const basePrices = {
  rice: 320,
  wheat: 120,
  sugar: 160,
  petrol: 270,
  flour: 110,
  milk: 180
};

// ✅ Dynamic price generator
function getDynamicPrice(base) {
  const variation = Math.floor(Math.random() * 30 - 15);
  return base + variation;
}

app.post("/api/price", async (req, res) => {
  const { item } = req.body;

  if (!item) {
    return res.status(400).json({ error: "Item missing" });
  }

  // ✅ Price logic (AI pe depend nahi)
  const base = basePrices[item.toLowerCase()] || 200;
  const currentPrice = getDynamicPrice(base);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
You are an AI assistant for Pakistan.

Item: ${item}
Current price: PKR ${currentPrice}

Return ONLY JSON:

{
  "item": "${item}",
  "estimated_price": "PKR ${currentPrice}",
  "trend": "Increasing or Decreasing or Stable",
  "reason": "short simple reason",
  "budget_tip": "simple saving tip",
  "weekly_data": [
    {"day":"Mon","price":${currentPrice - 20}},
    {"day":"Tue","price":${currentPrice - 10}},
    {"day":"Wed","price":${currentPrice - 5}},
    {"day":"Thu","price":${currentPrice}},
    {"day":"Fri","price":${currentPrice + 5}},
    {"day":"Sat","price":${currentPrice + 10}},
    {"day":"Sun","price":${currentPrice + 15}}
  ]
}
`
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = response.data.choices[0].message.content;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const result = JSON.parse(text);

    res.json(result);

  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

// app.listen(5000, () => {
//   console.log("🚀 Server running on http://localhost:5000");
// });


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
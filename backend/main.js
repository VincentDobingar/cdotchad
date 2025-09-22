// main.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import offresRoutes from './routes/offres.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "✅ Hello depuis CDO API" });
});

app.get(["/", "/api"], (req, res) => {
  res.json({
    status: "✅ API OK",
    baseUrl: req.protocol + "://" + req.get("host") + "/api",
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/offres', offresRoutes);

export default app;

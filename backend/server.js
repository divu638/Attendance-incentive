require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { address } = require("./chain");
const listener = require("./listener");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50kb" }));

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  contract: address,
  database: db.isSupabaseConfigured() ? "supabase" : "in-memory (set SUPABASE_URL in backend/.env)"
}));
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "Server error" }); });

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    try {
      await listener.backfill();
      listener.start();
    } catch (chainErr) {
      console.warn("Chain listener note: Blockchain node might not be reachable yet (" + chainErr.message + "). Start hardhat node to sync events.");
    }
  } catch (e) {
    console.error("Startup failed:", e.message);
    process.exit(1);
  }
}

startServer();

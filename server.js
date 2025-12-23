import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(__dirname + "/public"));

// Mock DB (troca futuramente)
let visits = [120,150,180,140,210,230,200];
let conversions = [12,20,15,18,30,28,22];

// API — Dados reais consumidos pelo Dashboard
app.get("/api/visits", (req, res) => {
  res.json({ data: visits });
});

app.get("/api/conversions", (req, res) => {
  res.json({ data: conversions });
});

// API — Exportação Global
app.get("/api/export", (req, res) => {
  const rows = [
    ["dia", "visitas", "conversoes"],
    ...visits.map((v, i) => [i + 1, v, conversions[i] || 0])
  ];
  const csv = rows.map(r => r.join(",")).join("\n");

  res.header("Content-Type", "text/csv");
  res.attachment("revitarium-export.csv");
  return res.send(csv);
});

// ROTA GLOBAL (SPA / fallback)
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(3000, () => console.log("🔥 API rodando em http://localhost:3000"));

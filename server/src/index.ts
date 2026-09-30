import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import chainRoutes from "./routes/chain.js";
import fraudRoutes from "./routes/fraud.js";
import tenderRoutes from "./routes/tenders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Policy Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "tender-guard-ai-backend",
    uptimeSeconds: process.uptime(),
  });
});

// Mount API Controllers under /api
app.use("/api", tenderRoutes);
app.use("/api", fraudRoutes);
app.use("/api", chainRoutes);

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Backend Error:", err.stack || err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Tender Guard AI Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api`);
});

export default app;

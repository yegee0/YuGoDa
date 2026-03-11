/**
 * Express Sunucu — Ana Giriş Noktası
 * ------------------------------------
 * Bu dosya Express uygulamasını yapılandırır ve başlatır.
 *
 * Middleware sırası önemlidir:
 *   1. express.json()      → JSON body parsing
 *   2. express.urlencoded  → iyzico callback body'si form-data gelir, bunu parse eder
 *   3. Router'lar          → iyzico ödeme endpoint'leri
 *
 * Çalıştırma:
 *   node server/index.js
 *   veya: npx tsx server/index.js (TypeScript desteğiyle)
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import paymentRouter from "./routes/payment.js";

// ES Module'lerde __dirname yok; URL'den türetiyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proje kökündeki .env.local dosyasını yükle
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// ─────────────────────────────────────────────
// MIDDLEWARE'LER
// ─────────────────────────────────────────────

// JSON body parsing — REST endpoint'leri için
app.use(express.json());

// URL-encoded body parsing — iyzico callback form-data için zorunlu
app.use(express.urlencoded({ extended: true }));

// CORS başlıkları — Frontend 3000, backend 4000 portunda çalışıyorsa gerekli
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// ─────────────────────────────────────────────
// ROUTER'LAR
// ─────────────────────────────────────────────

// iyzico ödeme işlemleri
// Endpoint'ler: /api/payment/checkout-form, /api/payment/callback, /api/payment/stored-card
app.use("/api/payment", paymentRouter);

// ─────────────────────────────────────────────
// SAĞLIK KONTROLÜ
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        iyzicoMode: process.env.IYZICO_BASE_URL?.includes("sandbox") ? "SANDBOX" : "PRODUCTION",
    });
});

// ─────────────────────────────────────────────
// HATA YAKALAYICI (Global)
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("[Server] Beklenmedik hata:", err.stack);
    res.status(500).json({
        success: false,
        message: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    });
});

// ─────────────────────────────────────────────
// SUNUCUYU BAŞLAT
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅ iyzico Ödeme Sunucusu başlatıldı`);
    console.log(`   URL      : http://localhost:${PORT}`);
    console.log(`   Sağlık   : http://localhost:${PORT}/health`);
    console.log(`   Checkout : POST http://localhost:${PORT}/api/payment/checkout-form`);
    console.log(`   Callback : POST http://localhost:${PORT}/api/payment/callback`);
    console.log(`   iyzico   : ${process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com"}`);
    console.log(`   Mod      : ${process.env.IYZICO_BASE_URL?.includes("sandbox") ? "🧪 SANDBOX" : "🚀 PRODUCTION"}\n`);
});

export default app;

/**
 * iyzico API Konfigürasyonu
 * -------------------------
 * Bu dosya, iyzico SDK'sını başlatmak için gerekli ayarları içerir.
 * API anahtarları güvenlik gereği .env dosyasından okunur;
 * hiçbir zaman kaynak koduna yazılmamalıdır.
 *
 * SANDBOX vs PRODUCTION:
 *   - Geliştirme/Test: https://sandbox-api.iyzipay.com
 *   - Canlı ortam:     https://api.iyzipay.com
 */

import Iyzipay from "iyzipay";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module'lerde __dirname yok; URL'den türetiyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local dosyasını proje kökünden yükle
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// iyzipay SDK örneğini oluştur ve dışa aktar
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY, // iyzico merchant panelinden alınan API anahtarı
    secretKey: process.env.IYZICO_SECRET_KEY, // İmza oluşturmak için kullanılan gizli anahtar
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com", // Sandbox endpoint
});

export default iyzipay;

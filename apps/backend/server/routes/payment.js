/**
 * iyzico Checkout Form & Callback Router
 * ----------------------------------------
 * Bu dosya, ödeme sürecini yöneten iki ana endpoint'i tanımlar:
 *
 *   POST /api/payment/checkout-form
 *     → iyzico'dan ödeme formu HTML'i alır ve frontend'e döner.
 *     → Frontend bu HTML'i sayfaya gömer; kullanıcı 3D Secure formunu görür.
 *
 *   POST /api/payment/callback
 *     → Kullanıcı 3D Secure doğrulamasını tamamlayınca iyzico bu endpoint'e POST atar.
 *     → Token doğrulanır, ödeme durumu kontrol edilir, sonuç kullanıcıya iletilir.
 *
 *   POST /api/payment/stored-card
 *     → Kayıtlı kart sahibi kullanıcılar için 3D Secure başlatır (kart bilgisi girmeden).
 */

import express from "express";
import iyzipay from "../iyzico/config.js";
import { buildDemoPaymentRequest, buildPaymentRequest } from "../iyzico/paymentRequest.js";
import { buildStoredCardPaymentRequest } from "../iyzico/cardStorage.js";
import { parsePaymentResult, getErrorMessage } from "../iyzico/errorHandler.js";

const router = express.Router();

// ─────────────────────────────────────────────
// ENDPOINT 1: Checkout Form Oluştur
// ─────────────────────────────────────────────
/**
 * POST /api/payment/checkout-form
 *
 * Kullanıcı "Ödeme Yap" butonuna bastığında çağrılır.
 * iyzico API'sine ödeme detayları gönderilir;
 * karşılığında bir HTML script veya ödeme URL'i alınır.
 *
 * Body (opsiyonel, yoksa demo verisi kullanılır):
 *   {
 *     conversationId, price, buyer, shippingAddress,
 *     billingAddress, basketItems
 *   }
 */
router.post("/checkout-form", async (req, res) => {
    try {
        // Callback URL: iyzico'nun ödeme sonucunu POST atacağı adres
        // APP_URL ortam değişkeninizden okur; localhost ise ngrok gibi bir tunnel gerekebilir
        const callbackUrl = `${process.env.APP_URL}/api/payment/callback`;

        // Gelen body'den istek paketi oluştur; body boşsa demo verisine geri dön
        let paymentRequest;
        if (req.body && req.body.price) {
            // Gerçek sipariş verisi body'den geliyor
            paymentRequest = buildPaymentRequest({ ...req.body, callbackUrl });
        } else {
            // Test/demo amaçlı örnek veri kullan
            paymentRequest = buildDemoPaymentRequest(callbackUrl);
        }

        console.log("[iyzico] Checkout form isteği gönderiliyor:", {
            conversationId: paymentRequest.conversationId,
            price: paymentRequest.price,
            callbackUrl,
        });

        // iyzico'ya Checkout Form isteği gönder
        iyzipay.checkoutFormInitialize.create(paymentRequest, (err, result) => {
            if (err) {
                console.error("[iyzico] SDK hatası:", err);
                return res.status(500).json({
                    success: false,
                    message: "Ödeme formu oluşturulamadı. Lütfen tekrar deneyin.",
                    error: err.message,
                });
            }

            const { isSuccess, userMessage, rawError } = parsePaymentResult(result);

            if (!isSuccess) {
                return res.status(400).json({
                    success: false,
                    message: userMessage,
                    error: rawError,
                });
            }

            // Başarılı: iyzico'nun döndürdüğü checkout form HTML'ini ve token'ı gönder
            console.log("[iyzico] Checkout form oluşturuldu:", {
                token: result.token,
                conversationId: result.conversationId,
            });

            res.json({
                success: true,
                token: result.token,                         // Doğrulama için sakla
                checkoutFormContent: result.checkoutFormContent, // Sayfaya gömülecek HTML
                payPageUrl: result.payWithIyzicoPageUrl,     // Alternatif: tam sayfa yönlendirme URL'i
                tokenExpireTime: result.tokenExpireTime,     // Token geçerlilik süresi (saniye)
                conversationId: result.conversationId,
            });
        });
    } catch (error) {
        console.error("[iyzico] Beklenmedik sunucu hatası:", error);
        res.status(500).json({
            success: false,
            message: "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
        });
    }
});

// ─────────────────────────────────────────────
// ENDPOINT 2: Callback — Ödeme Sonucu Doğrula
// ─────────────────────────────────────────────
/**
 * POST /api/payment/callback
 *
 * Kullanıcı 3D Secure formunu tamamladığında iyzico bu endpoint'e
 * bir POST isteği atar. İçerikte `token` parametresi bulunur.
 *
 * Yapılması gerekenler:
 *   1. Token'ı iyzico'ya göndererek ödeme sonucunu doğrula
 *   2. Sonuç başarılıysa siparişi veritabanında onayla
 *   3. Kullanıcıyı başarı/hata sayfasına yönlendir
 *
 * GÜVENLIK: Token olmadan ödemeyi asla onaylamayın!
 *   Sadece query param veya body'deki token'ı değil; iyzico API yanıtını doğrulayın.
 */
router.post("/callback", async (req, res) => {
    // iyzico, token'ı form-data olarak body'de gönderir
    const token = req.body?.token;

    if (!token) {
        console.warn("[iyzico] Callback'te token bulunamadı.");
        return res.redirect(`/?payment=error&message=invalid_token`);
    }

    console.log("[iyzico] Callback alındı, token doğrulanıyor:", token);

    const retrieveRequest = {
        locale: "tr",
        conversationId: req.body?.conversationId || "",
        token, // Checkout form oluşturulurken alınan token ile eşleşmeli
    };

    // iyzico'ya token'ı göndererek ödeme sonucunu sorgula
    iyzipay.checkoutForm.retrieve(retrieveRequest, (err, result) => {
        if (err) {
            console.error("[iyzico] Token doğrulama SDK hatası:", err);
            return res.redirect(`/?payment=error&message=verification_failed`);
        }

        const { isSuccess, userMessage, rawError } = parsePaymentResult(result);

        if (!isSuccess) {
            // Ödeme başarısız: Kullanıcıyı hata mesajıyla yönlendir
            const errorMsg = encodeURIComponent(userMessage);
            console.warn("[iyzico] Ödeme başarısız:", rawError);
            return res.redirect(`/?payment=error&message=${errorMsg}`);
        }

        // ─── BAŞARILI ÖDEME ───
        // Burada yapmanız gerekenler:
        //   1. result.paymentId ile veritabanınızdaki siparişi onayla
        //   2. result.fraudStatus'ü kontrol edin (1: güvenli, -1: şüpheli)
        //   3. Eğer kart saklama kullanıyorsanız result.cardToken ve
        //      result.cardUserKey'i kaydedin
        console.log("[iyzico] Ödeme başarılı!", {
            paymentId: result.paymentId,
            conversationId: result.conversationId,
            paidPrice: result.paidPrice,
            fraudStatus: result.fraudStatus, // 1 = güvenli
            // Kart saklama için (iyzico'dan gelirse):
            cardToken: result.cardToken,
            cardUserKey: result.cardUserKey,
        });

        // TODO: Veritabanında siparişi "ödendi" olarak güncelle
        // await db.orders.update({ id: result.conversationId }, { status: "paid", paymentId: result.paymentId });

        // Kullanıcıyı başarı sayfasına yönlendir
        res.redirect(`/?payment=success&orderId=${result.conversationId}`);
    });
});

// ─────────────────────────────────────────────
// ENDPOINT 3: Kayıtlı Kart ile Ödeme (Card Storage)
// ─────────────────────────────────────────────
/**
 * POST /api/payment/stored-card
 *
 * Daha önce kartını kaydetmiş kullanıcıların kart bilgisi girmeden
 * 3D Secure sürecini başlatmasını sağlar.
 *
 * Body:
 *   {
 *     cardUserKey,  // Veritabanından alınan kullanıcı kart kasası anahtarı
 *     cardToken,    // Kullanıcının seçtiği kartın token'ı
 *     conversationId,
 *     price,
 *     buyer,
 *     basketItems
 *   }
 */
router.post("/stored-card", async (req, res) => {
    try {
        const { cardUserKey, cardToken, conversationId, price, buyer, basketItems } = req.body;

        // Zorunlu alanları doğrula
        if (!cardUserKey || !cardToken) {
            return res.status(400).json({
                success: false,
                message: "Kayıtlı kart bilgileri eksik.",
            });
        }

        const callbackUrl = `${process.env.APP_URL}/api/payment/callback`;

        // Kayıtlı kart ödeme isteği paketi oluştur
        const paymentRequest = buildStoredCardPaymentRequest({
            cardUserKey,
            cardToken,
            conversationId: conversationId || `order_${Date.now()}`,
            price: price || "100.00",
            buyer,
            basketItems,
            callbackUrl,
        });

        console.log("[iyzico] Kayıtlı kart ödeme isteği gönderiliyor:", {
            cardUserKey,
            conversationId: paymentRequest.conversationId,
        });

        // iyzico'ya 3DS ile kayıtlı kart ödeme isteği gönder
        iyzipay.threedsInitialize.create(paymentRequest, (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Ödeme başlatılamadı.",
                    error: err.message,
                });
            }

            const { isSuccess, userMessage, rawError } = parsePaymentResult(result);

            if (!isSuccess) {
                return res.status(400).json({
                    success: false,
                    message: userMessage,
                    error: rawError,
                });
            }

            // 3DS HTML içeriğini döndür — frontend bunu sayfaya gömecek
            res.json({
                success: true,
                threeDSHtmlContent: result.threeDSHtmlContent, // 3D Secure form HTML'i
                conversationId: result.conversationId,
            });
        });
    } catch (error) {
        console.error("[iyzico] Kayıtlı kart ödeme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası." });
    }
});

export default router;

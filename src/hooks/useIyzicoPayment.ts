/**
 * useIyzicoPayment Hook
 * ----------------------
 * iyzico ödeme sürecini yöneten özel React hook.
 *
 * Kullanım:
 *   const { initiatePayment, isLoading, error, paymentStatus } = useIyzicoPayment();
 *
 * Akış:
 *   1. initiatePayment() çağrılır → backend'e POST /api/payment/checkout-form
 *   2. Backend iyzico'dan checkoutFormContent (HTML) alır ve döner
 *   3. Hook bu HTML'i bir modal/div'e basar → kullanıcı 3D Secure formunu görür
 *   4. Kullanıcı 3D kodu girince iyzico callback URL'e POST üretir
 *   5. Sayfa yeniden yüklendiğinde URL'deki sorgu parametresi kontrol edilir
 */

import { useState, useEffect, useCallback } from "react";

export type PaymentStatus = "idle" | "loading" | "form_ready" | "success" | "error";

export interface PaymentResult {
    isSuccess: boolean;
    orderId?: string;
    message?: string;
}

export interface UseIyzicoPaymentReturn {
    initiatePayment: (orderData?: Record<string, unknown>) => Promise<void>;
    checkoutFormHtml: string | null;
    payPageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    paymentStatus: PaymentStatus;
    paymentResult: PaymentResult | null;
    clearPayment: () => void;
}

const PAYMENT_API_BASE = "http://localhost:4000/api/payment";

export function useIyzicoPayment(): UseIyzicoPaymentReturn {
    const [checkoutFormHtml, setCheckoutFormHtml] = useState<string | null>(null);
    const [payPageUrl, setPayPageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

    // Sayfa yüklendiğinde URL'deki ödeme sonucunu kontrol et
    // iyzico callback sonrası kullanıcı /?payment=success&orderId=... adresine yönlendirilir
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get("payment");

        if (payment === "success") {
            setPaymentStatus("success");
            setPaymentResult({
                isSuccess: true,
                orderId: params.get("orderId") || undefined,
                message: "Payment successful! 🎉",
            });
            // URL'deki parametreleri temizle
            window.history.replaceState({}, "", window.location.pathname);
        } else if (payment === "error") {
            const message = decodeURIComponent(params.get("message") || "Payment failed.");
            setPaymentStatus("error");
            setError(message);
            setPaymentResult({
                isSuccess: false,
                message,
            });
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    /**
     * Ödeme sürecini başlat
     * @param orderData - Opsiyonel sipariş verisi. Boş bırakılırsa backend demo veri kullanır.
     */
    const initiatePayment = useCallback(async (orderData?: Record<string, unknown>) => {
        setIsLoading(true);
        setError(null);
        setCheckoutFormHtml(null);
        setPaymentStatus("loading");

        try {
            const response = await fetch(`${PAYMENT_API_BASE}/checkout-form`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData || {}),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to load payment form.");
            }

            // Başarılı: iyzico HTML formunu state'e kaydet
            setCheckoutFormHtml(data.checkoutFormContent);
            setPayPageUrl(data.payPageUrl);
            setPaymentStatus("form_ready");
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
            setPaymentStatus("error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Ödeme durumunu sıfırla
     */
    const clearPayment = useCallback(() => {
        setCheckoutFormHtml(null);
        setPayPageUrl(null);
        setError(null);
        setPaymentStatus("idle");
        setPaymentResult(null);
    }, []);

    return {
        initiatePayment,
        checkoutFormHtml,
        payPageUrl,
        isLoading,
        error,
        paymentStatus,
        paymentResult,
        clearPayment,
    };
}

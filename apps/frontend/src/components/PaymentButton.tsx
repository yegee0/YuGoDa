/**
 * PaymentButton Bileşeni — Örnek Kullanım
 * -----------------------------------------
 * useIyzicoPayment hook'u ve IyzicoPaymentModal bileşeninin
 * birlikte nasıl kullanıldığını gösteren örnek bir entegrasyon bileşeni.
 *
 * Bu bileşeni sepet sayfasına, sipariş özeti kartına veya
 * herhangi bir ödeme akışına entegre edebilirsiniz.
 */

import React, { useState } from "react";
import { useIyzicoPayment } from '@/hooks/useIyzicoPayment';
import IyzicoPaymentModal from "@/components/IyzicoPaymentModal";

interface CartItem {
    id: string;
    name: string;
    price: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    category1: string;
}

interface PaymentButtonProps {
    /** Sepet toplam tutarı (TL, string) */
    totalPrice?: string;
    /** Sepet ürünleri */
    cartItems?: CartItem[];
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
    totalPrice = "100.00",
    cartItems,
}) => {
    const {
        initiatePayment,
        checkoutFormHtml,
        payPageUrl,
        isLoading,
        error,
        paymentStatus,
        paymentResult,
        clearPayment,
    } = useIyzicoPayment();

    const [isModalOpen, setIsModalOpen] = useState(false);

    // "Ödeme Yap" butonuna basınca çalışır
    const handlePayment = async () => {
        // Eğer gerçek sipariş verisi varsa buraya ekleyin
        // Yoksa backend demo veri kullacak
        const orderData = cartItems
            ? {
                price: totalPrice,
                paidPrice: totalPrice,
                basketItems: cartItems,
            }
            : undefined;

        await initiatePayment(orderData);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        clearPayment();
    };

    return (
        <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {/* ── ÖDEME SONUÇ BANNER'I ── */}
            {paymentStatus === "success" && paymentResult && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        backgroundColor: "#d1fae5",
                        border: "1px solid #6ee7b7",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span style={{ fontSize: "24px" }}>✅</span>
                    <div>
                        <div style={{ fontWeight: 600, color: "#065f46" }}>{paymentResult.message}</div>
                        {paymentResult.orderId && (
                            <div style={{ fontSize: "13px", color: "#047857", marginTop: "2px" }}>
                                Order No: <strong>{paymentResult.orderId}</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── HATA BANNER'I ── */}
            {(paymentStatus === "error" || error) && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        backgroundColor: "#fee2e2",
                        border: "1px solid #fca5a5",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span style={{ fontSize: "24px" }}>❌</span>
                    <div>
                        <div style={{ fontWeight: 600, color: "#991b1b" }}>Payment Failed</div>
                        <div style={{ fontSize: "13px", color: "#b91c1c", marginTop: "2px" }}>
                            {error || "An error occurred during payment. Please try again."}
                        </div>
                    </div>
                </div>
            )}

            {/* ── ÖDEME BUTONU ── */}
            <button
                id="iyzico-payment-btn"
                onClick={handlePayment}
                disabled={isLoading || paymentStatus === "success"}
                style={{
                    width: "100%",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: isLoading ? "wait" : "pointer",
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                    background: isLoading
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #e63946 0%, #c1121f 100%)",
                    color: "#fff",
                    boxShadow: isLoading ? "none" : "0 4px 20px rgba(230,57,70,0.35)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                }}
            >
                {isLoading ? (
                    <>
                        <span
                            style={{
                                display: "inline-block",
                                width: "18px",
                                height: "18px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }}
                        />
                        Preparing Payment Form...
                    </>
                ) : (
                    <>
                        🔒 Pay {totalPrice} TL Securely
                    </>
                )}
            </button>

            {/* ── GÜVENİLİRLİK NOTU ── */}
            <div
                style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginTop: "10px",
                }}
            >
                Secured by iyzico • 256-bit SSL encryption
            </div>

            {/* ── ÖDEME MODALI ── */}
            <IyzicoPaymentModal
                isOpen={isModalOpen && paymentStatus === "form_ready"}
                checkoutFormHtml={checkoutFormHtml}
                payPageUrl={payPageUrl}
                onClose={handleClose}
                useFullPageRedirect={false} // true yaparsanız iyzico sayfasına yönlendirir
            />

            {/* CSS Animasyonları */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        #iyzico-payment-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 25px rgba(230,57,70,0.45) !important;
        }
        #iyzico-payment-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
        </div>
    );
};

export default PaymentButton;

/**
 * IyzicoPaymentModal Bileşeni
 * ----------------------------
 * iyzico Checkout Form'unu modal olarak gösteren bileşen.
 *
 * iyzico'nun döndürdüğü checkoutFormContent bir HTML string'idir.
 * Bu HTML'i sayfaya güvenli şekilde enjekte etmek için dangerouslySetInnerHTML
 * kullandığımızda iyzico'nun script'i DOM'a eklendikten sonra çalışmaz.
 * Bu yüzden bir <iframe> veya yeni sekme yöntemi daha güvenilirdir.
 *
 * Bu bileşen iki yöntem sunar:
 *   1. Tam Sayfa Yönlendirme (payPageUrl) — En güvenilir yöntem
 *   2. Iframe Modu (checkoutFormHtml) — Modal içinde gösterim
 */

import React, { useEffect, useRef } from "react";

interface IyzicoPaymentModalProps {
    isOpen: boolean;
    checkoutFormHtml: string | null;
    payPageUrl: string | null;
    onClose: () => void;
    /** true: tam sayfa yönlendirme, false: modal/iframe modu */
    useFullPageRedirect?: boolean;
}

const IyzicoPaymentModal: React.FC<IyzicoPaymentModalProps> = ({
    isOpen,
    checkoutFormHtml,
    payPageUrl,
    onClose,
    useFullPageRedirect = false,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Tam sayfa yönlendirme modunda kullanıcıyı iyzico sayfasına gönder
    useEffect(() => {
        if (isOpen && useFullPageRedirect && payPageUrl) {
            window.location.href = payPageUrl;
        }
    }, [isOpen, useFullPageRedirect, payPageUrl]);

    // iyzico HTML'ini iframe'e yaz (script çalışması için)
    useEffect(() => {
        if (isOpen && !useFullPageRedirect && checkoutFormHtml && iframeRef.current) {
            const iframeDoc = iframeRef.current.contentDocument;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(checkoutFormHtml);
                iframeDoc.close();
            }
        }
    }, [isOpen, checkoutFormHtml, useFullPageRedirect]);

    if (!isOpen) return null;
    if (useFullPageRedirect) return null; // Yönlendirme başladıysa modal gösterme

    return (
        <div
            className="iyzico-modal-overlay"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                animation: "fadeIn 0.2s ease",
            }}
            onClick={(e) => {
                // Modal dışına tıklanınca kapat
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "min(480px, 95vw)",
                    maxHeight: "90vh",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                    backgroundColor: "#fff",
                }}
            >
                {/* Modal Başlık */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: "#1a1a2e",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #e63946, #ff6b6b)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                            }}
                        >
                            🔒
                        </div>
                        <div>
                            <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>
                                Secure Payment
                            </div>
                            <div style={{ color: "#aaa", fontSize: "11px" }}>Protected by iyzico</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            borderRadius: "8px",
                            width: "32px",
                            height: "32px",
                            cursor: "pointer",
                            color: "#fff",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Close">
                        ×
                    </button>
                </div>

                {/* iyzico Checkout Form İçeriği (iframe) */}
                {checkoutFormHtml ? (
                    <iframe
                        ref={iframeRef}
                        title="iyzico Secure Payment"
                        style={{
                            width: "100%",
                            height: "560px",
                            border: "none",
                            display: "block",
                        }}
                        sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation"
                    />
                ) : (
                    <div
                        style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#666",
                        }}
                    >
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                        <p>Loading payment form...</p>
                    </div>
                )}

                {/* Güven Rozetleri */}
                <div
                    style={{
                        padding: "12px 20px",
                        backgroundColor: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        fontSize: "11px",
                        color: "#888",
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    <span>🛡️ 256-bit SSL</span>
                    <span>•</span>
                    <span>🏦 3D Secure</span>
                    <span>•</span>
                    <span>💳 All cards</span>
                </div>
            </div>
        </div>
    );
};

export default IyzicoPaymentModal;

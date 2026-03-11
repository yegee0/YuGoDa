/**
 * Ödeme İsteği (Payment Request) Oluşturucu
 * ------------------------------------------
 * Bu modül, iyzico'nun Checkout Form API'sine gönderilecek
 * ödeme istek paketini dinamik olarak oluşturur.
 *
 * İyzico, birbiriyle tutarlı şu bilgileri zorunlu tutar:
 *   - Buyer (alıcı kişi bilgileri)
 *   - ShippingAddress & BillingAddress (teslimat ve fatura adresi)
 *   - BasketItems (sepet ürünleri — fiyatlar price ile eşleşmeli)
 *
 * ÖNEMLİ: price ve tüm basketItem fiyatlarının toplamı birbirine
 * EŞİT OLMALIDIR. Aksi hâlde iyzico hata döner.
 */

/**
 * Dinamik ödeme isteği paketi oluşturur.
 *
 * @param {object} params - Ödeme parametreleri
 * @param {string} params.conversationId  - İşlemi takip etmek için benzersiz ID (ör. sipariş no)
 * @param {string} params.price           - Toplam ödeme tutarı (TL, string olarak)
 * @param {string} params.paidPrice       - Gerçekte tahsil edilecek tutar (komisyon dahil)
 * @param {object} params.buyer           - Alıcı bilgileri
 * @param {object} params.shippingAddress - Teslimat adresi
 * @param {object} params.billingAddress  - Fatura adresi
 * @param {Array}  params.basketItems     - Sepet ürün listesi
 * @param {string} params.callbackUrl     - iyzico'nun ödeme sonucunu POST edeceği URL
 * @returns {object} iyzico API ödeme istek nesnesi
 */
export function buildPaymentRequest({
    conversationId,
    price,
    paidPrice,
    buyer,
    shippingAddress,
    billingAddress,
    basketItems,
    callbackUrl,
}) {
    return {
        locale: "tr",                        // Dil: 'tr' veya 'en'
        conversationId,                       // Sipariş ID'si (geri dönüşte doğrulama için kullanılır)
        price,                                // Ürünlerin KDV dahil toplam tutarı
        paidPrice,                            // Tahsil edilecek tutar (taksit komisyonu eklenirse farklı olabilir)
        currency: "TRY",                      // Para birimi: TRY, USD, EUR, GBP
        basketId: `basket_${conversationId}`, // Sepet referans ID'si
        paymentGroup: "PRODUCT",             // 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION'
        callbackUrl,                          // Ödeme sonrası iyzico'nun POST atacağı adres
        enabledInstallments: [1, 2, 3, 6, 9], // İzin verilen taksit sayıları (1 = peşin)
        buyer,
        shippingAddress,
        billingAddress,
        basketItems,
    };
}

/**
 * Örnek / Demo Ödeme Paketi
 * --------------------------
 * Geliştirme ve test aşamasında kullanmak üzere hazır bir ödeme nesnesi.
 * Gerçek uygulamada bu veriler veritabanı/oturum bilgilerinden gelmeli.
 */
export function buildDemoPaymentRequest(callbackUrl) {
    const conversationId = `order_${Date.now()}`; // Her sipariş için benzersiz ID

    // --- 1. ALICI BİLGİLERİ ---
    const buyer = {
        id: "BY789",                             // Sisteminizdeki kullanıcı ID'si
        name: "Ahmet",
        surname: "Yılmaz",
        gsmNumber: "+905350000000",              // GSM: +90 ile başlamalı
        email: "ahmet.yilmaz@example.com",
        identityNumber: "74300864791",           // TC Kimlik No (sandbox'ta herhangi 11 hane)
        lastLoginDate: "2025-10-05 12:43:35",   // Format: YYYY-MM-DD HH:MM:SS
        registrationDate: "2013-04-21 15:12:09",
        registrationAddress: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        ip: "85.34.78.112",                      // Kullanıcının gerçek IP adresi
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34732",
    };

    // --- 2. TESLİMAT ADRESİ ---
    const shippingAddress = {
        contactName: "Jane Doe",
        city: "Istanbul",
        country: "Turkey",
        address: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        zipCode: "34742",
    };

    // --- 3. FATURA ADRESİ ---
    const billingAddress = {
        contactName: "Jane Doe",
        city: "Istanbul",
        country: "Turkey",
        address: "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1",
        zipCode: "34742",
    };

    // --- 4. SEPET İÇERİĞİ ---
    // ÖNEMLİ: Tüm ürün fiyatlarının toplamı üstteki `price` değerine eşit olmalı!
    const basketItems = [
        {
            id: "BI101",
            name: "Sürpriz Yemek Paketi - Bella Italia",
            category1: "Yiyecek",               // Ana kategori
            category2: "Restoran",              // Alt kategori (opsiyonel)
            itemType: "PHYSICAL",               // 'PHYSICAL' (fiziksel ürün) | 'VIRTUAL' (dijital)
            price: "75.00",                     // Bu ürünün birim fiyatı
        },
        {
            id: "BI102",
            name: "Teslimat Ücreti",
            category1: "Teslimat",
            category2: "Kargo",
            itemType: "VIRTUAL",
            price: "25.00",
        },
    ];

    // Toplam tutar = 75.00 + 25.00 = 100.00 (basketItems toplamıyla eşleşmeli)
    return buildPaymentRequest({
        conversationId,
        price: "100.00",      // Ürünlerin toplamı
        paidPrice: "100.00",  // Peşin ödemede price ile aynı; taksitte komisyon eklenebilir
        buyer,
        shippingAddress,
        billingAddress,
        basketItems,
        callbackUrl,
    });
}

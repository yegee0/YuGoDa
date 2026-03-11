/**
 * iyzico Kart Saklama (Card Storage) Modülü
 * ------------------------------------------
 * Bu modül, kullanıcının kart bilgilerini iyzico'nun güvenli kasasında
 * saklamak ve sonraki alışverişlerde SMS kodu girmeden (tek tıkla) ödeme
 * yapabilmesini sağlamak için gerekli yardımcı fonksiyonları içerir.
 *
 * NASIL ÇALIŞIR?
 *   1. Kullanıcı ilk ödemeyi 3D Secure ile tamamlar.
 *   2. iyzico, callback'te `cardToken` ve `cardUserKey` döner.
 *   3. Bu iki değeri veritabanında kullanıcıyla ilişkilendirirsiniz.
 *   4. Sonraki ödemelerde kart bilgisi girmeden ödemeyi başlatabilirsiniz.
 *
 * GÜVENLİK NOTU:
 *   Kart numarası, CVV gibi hassas bilgiler hiçbir zaman sizin
 *   sunucunuza ulaşmaz; sadece iyzico'nun token'ları saklanır.
 */

import iyzipay from "./config.js";

/**
 * Yeni kart kayıt isteği oluşturmak için istek paketi oluşturur.
 * Bu istek, kullanıcıya kart kayıt formu sunmak için kullanılır.
 *
 * @param {string} userId   - Sisteminizdeki kullanıcı tanımlayıcısı
 * @param {string} userIp   - Kullanıcının IP adresi
 * @returns {Promise<object>} iyzico API yanıtı (cardUserKey içerir)
 */
export async function createCardStorageRequest(userId, userIp) {
    const request = {
        locale: "tr",
        conversationId: `card_store_${userId}_${Date.now()}`,
        externalId: userId,  // Kendi sisteminizdeki kullanıcı ID'si
        email: "kullanici@example.com",  // Gerçekte oturumdan alınmalı
        cardUserKey: null,   // Yeni kullanıcı için null; mevcut kullanıcı için kayıtlı key
        // Gerçek uygulamada bu veri oturumdaki kullanıcı bilgilerinden gelmeli
    };

    return new Promise((resolve, reject) => {
        // iyzico'dan kullanıcıya özgü bir kart kasası alanı talep et
        iyzipay.cardList.retrieve(request, (err, result) => {
            if (err) {
                reject(new Error(`Kart kasası sorgulanamadı: ${err.message}`));
                return;
            }
            resolve(result);
        });
    });
}

/**
 * Kayıtlı kart ile ödeme başlatma isteği paketi oluşturur.
 * Bu istek, `cardUserKey` ve `cardToken` ile 3DS doğrulaması yapar.
 *
 * @param {object} params
 * @param {string} params.cardUserKey     - Kullanıcının iyzico kart kasası anahtarı
 * @param {string} params.cardToken       - Belirli kartın token'ı
 * @param {string} params.conversationId  - İşlem takip ID'si
 * @param {string} params.price           - Ödenecek tutar
 * @param {object} params.buyer           - Alıcı bilgileri
 * @param {Array}  params.basketItems     - Sepet ürünleri
 * @param {string} params.callbackUrl     - Callback URL
 * @returns {object} iyzico 3DS ile kayıtlı kart ödeme istek paketi
 */
export function buildStoredCardPaymentRequest({
    cardUserKey,
    cardToken,
    conversationId,
    price,
    buyer,
    basketItems,
    callbackUrl,
}) {
    return {
        locale: "tr",
        conversationId,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: `basket_${conversationId}`,
        paymentGroup: "PRODUCT",
        callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],

        // Kayıtlı kart bilgisi — ham kart numarası yerine token kullanılır
        paymentCard: {
            cardUserKey,  // Kullanıcının kart kasası anahtarı
            cardToken,    // Spesifik kartın token'ı
        },

        buyer,
        shippingAddress: buyer.shippingAddress || {
            contactName: `${buyer.name} ${buyer.surname}`,
            city: buyer.city,
            country: buyer.country,
            address: buyer.registrationAddress,
            zipCode: buyer.zipCode,
        },
        billingAddress: {
            contactName: `${buyer.name} ${buyer.surname}`,
            city: buyer.city,
            country: buyer.country,
            address: buyer.registrationAddress,
            zipCode: buyer.zipCode,
        },
        basketItems,
    };
}

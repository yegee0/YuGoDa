/**
 * iyzico Hata Yönetimi Modülü
 * ----------------------------
 * Bu modül, iyzico API'sinden dönen hata kodlarını Türkçe kullanıcı
 * dostu mesajlara çevirir. Böylece teknik hata kodları son kullanıcıya
 * gösterilmez ve daha anlamlı geri bildirim sağlanır.
 *
 * HATA FORMATI:
 *   iyzico bir hata durumunda şu yapıyı döner:
 *   {
 *     status: "failure",
 *     errorCode: "10051",
 *     errorMessage: "Do you have sufficient limit?",
 *     errorGroup: "CARD_ERROR"
 *   }
 */

/**
 * iyzico hata kodlarına karşılık gelen Türkçe kullanıcı mesajları.
 * Kaynak: https://dev.iyzipay.com/tr/api/hata-kodlari
 */
const ERROR_MESSAGES = {
    // --- Kart Hataları ---
    "10051": "Kartınızda yeterli limit bulunmuyor. Lütfen farklı bir kart deneyin.",
    "10005": "İşlem reddedildi. Lütfen bankanızı arayın veya farklı bir kart deneyin.",
    "10012": "Geçersiz işlem. Lütfen tekrar deneyin.",
    "10041": "Kayıp kart olarak işaretlenmiş. Lütfen bankanızla iletişime geçin.",
    "10043": "Çalıntı kart olarak işaretlenmiş. Lütfen bankanızla iletişime geçin.",
    "10054": "Kartınızın süresi dolmuş. Lütfen kartınızı kontrol edin.",
    "10057": "Kart sahibi bu işlemi yapamaz. Lütfen bankanızı arayın.",
    "10058": "Bu kart terminale kapalı. Lütfen farklı bir kart deneyin.",
    "10062": "3D Secure doğrulaması başarısız. Lütfen tekrar deneyin.",
    "10084": "CVC/CVV numarası hatalı. Lütfen kart bilgilerinizi kontrol edin.",

    // --- Sistem Hataları ---
    "10001": "Banka bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.",
    "10002": "Geçersiz kart numarası. Lütfen bilgilerinizi kontrol edin.",
    "10008": "Kart numarası geçersiz. Lütfen tekrar kontrol edin.",
    "10009": "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.",

    // --- iyzico Sistem Hataları ---
    "1": "İşlem başarısız. Lütfen tekrar deneyin.",
    "5": "İşlem reddedildi.",
    "6": "İzin reddedildi.",
    "15": "Hatalı istek. Sipariş bilgilerini kontrol edin.",
    "17": "İşlem zaten tamamlanmış.",

    // --- 3D Secure Hataları ---
    "3003": "3D Secure ile doğrulama başarısız. Lütfen tekrar deneyin.",
    "3006": "3D Secure oturumu sonlanmış. Ödeme sürecini yenileyiniz.",

    // --- Genel ---
    "default": "Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.",
};

/**
 * iyzico hata kodunu kullanıcı dostu mesaja çevirir.
 *
 * @param {string|number} errorCode - iyzico'dan dönen hata kodu
 * @returns {string} Kullanıcıya gösterilecek Türkçe hata mesajı
 */
export function getErrorMessage(errorCode) {
    const code = String(errorCode);
    return ERROR_MESSAGES[code] || ERROR_MESSAGES["default"];
}

/**
 * iyzico API yanıtını analiz edip hata durumunu döner.
 *
 * @param {object} result - iyzico API yanıtı
 * @returns {{ isSuccess: boolean, userMessage: string, rawError: object|null }}
 */
export function parsePaymentResult(result) {
    // Yanıt yoksa ya da status 'failure' ise hata
    if (!result || result.status !== "success") {
        const errorCode = result?.errorCode || "default";
        const userMessage = getErrorMessage(errorCode);

        console.error("[iyzico] Ödeme başarısız:", {
            errorCode: result?.errorCode,
            errorMessage: result?.errorMessage,
            errorGroup: result?.errorGroup,
            conversationId: result?.conversationId,
        });

        return {
            isSuccess: false,
            userMessage,
            rawError: {
                code: result?.errorCode,
                message: result?.errorMessage,
                group: result?.errorGroup,
            },
        };
    }

    // Başarılı ödeme
    return {
        isSuccess: true,
        userMessage: "Ödemeniz başarıyla tamamlandı.",
        rawError: null,
    };
}

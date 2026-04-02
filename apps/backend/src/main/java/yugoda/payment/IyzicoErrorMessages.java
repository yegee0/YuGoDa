package yugoda.payment;

import java.util.Map;

public final class IyzicoErrorMessages {

    private IyzicoErrorMessages() {}

    private static final Map<String, String> MESSAGES = Map.ofEntries(
        Map.entry("10051", "Kartınızda yeterli limit bulunmuyor. Lütfen farklı bir kart deneyin."),
        Map.entry("10005", "İşlem reddedildi. Lütfen bankanızı arayın veya farklı bir kart deneyin."),
        Map.entry("10012", "Geçersiz işlem. Lütfen tekrar deneyin."),
        Map.entry("10041", "Kayıp kart olarak işaretlenmiş. Lütfen bankanızla iletişime geçin."),
        Map.entry("10043", "Çalıntı kart olarak işaretlenmiş. Lütfen bankanızla iletişime geçin."),
        Map.entry("10054", "Kartınızın süresi dolmuş. Lütfen kartınızı kontrol edin."),
        Map.entry("10057", "Kart sahibi bu işlemi yapamaz. Lütfen bankanızı arayın."),
        Map.entry("10058", "Bu kart terminale kapalı. Lütfen farklı bir kart deneyin."),
        Map.entry("10062", "3D Secure doğrulaması başarısız. Lütfen tekrar deneyin."),
        Map.entry("10084", "CVC/CVV numarası hatalı. Lütfen kart bilgilerinizi kontrol edin."),
        Map.entry("10001", "Banka bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin."),
        Map.entry("10002", "Geçersiz kart numarası. Lütfen bilgilerinizi kontrol edin."),
        Map.entry("10008", "Kart numarası geçersiz. Lütfen tekrar kontrol edin."),
        Map.entry("10009", "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin."),
        Map.entry("1", "İşlem başarısız. Lütfen tekrar deneyin."),
        Map.entry("5", "İşlem reddedildi."),
        Map.entry("6", "İzin reddedildi."),
        Map.entry("15", "Hatalı istek. Sipariş bilgilerini kontrol edin."),
        Map.entry("17", "İşlem zaten tamamlanmış."),
        Map.entry("3003", "3D Secure ile doğrulama başarısız. Lütfen tekrar deneyin."),
        Map.entry("3006", "3D Secure oturumu sonlanmış. Ödeme sürecini yenileyiniz."),
        Map.entry("default", "Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.")
    );

    public static String get(String errorCode) {
        if (errorCode == null) return MESSAGES.get("default");
        return MESSAGES.getOrDefault(errorCode, MESSAGES.get("default"));
    }
}

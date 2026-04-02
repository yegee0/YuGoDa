package yugoda.controller;

import com.iyzipay.Options;
import com.iyzipay.model.*;
import com.iyzipay.request.*;
import yugoda.payment.IyzicoErrorMessages;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController extends BaseController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final Options iyzicoOptions;

    @Value("${app.url:http://localhost:4000}")
    private String appUrl;

    // POST /checkout-form
    @PostMapping("/checkout-form")
    public ResponseEntity<Map<String, Object>> checkoutForm(@RequestBody(required = false) Map<String, Object> body) {
        try {
            String callbackUrl = appUrl + "/api/payment/callback";

            CreateCheckoutFormInitializeRequest request = buildCheckoutFormRequest(body, callbackUrl);

            log.info("[iyzico] Checkout form isteği gönderiliyor: conversationId={}", request.getConversationId());

            CheckoutFormInitialize result = CheckoutFormInitialize.create(request, iyzicoOptions);

            if (!"success".equals(result.getStatus())) {
                String errorCode = result.getErrorCode();
                String userMessage = IyzicoErrorMessages.get(errorCode);
                log.warn("[iyzico] Checkout form başarısız: code={}, msg={}", errorCode, result.getErrorMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", userMessage,
                    "error", Map.of("code", errorCode != null ? errorCode : "", "message", result.getErrorMessage() != null ? result.getErrorMessage() : "")
                ));
            }

            log.info("[iyzico] Checkout form oluşturuldu: token={}", result.getToken());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", result.getToken() != null ? result.getToken() : "",
                "checkoutFormContent", result.getCheckoutFormContent() != null ? result.getCheckoutFormContent() : "",
                "payPageUrl", "",
                "tokenExpireTime", result.getTokenExpireTime() != null ? result.getTokenExpireTime() : 0,
                "conversationId", result.getConversationId() != null ? result.getConversationId() : ""
            ));
        } catch (Exception e) {
            log.error("[iyzico] Beklenmedik sunucu hatası", e);
            return serverError("Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.");
        }
    }

    // POST /callback
    @PostMapping("/callback")
    public void callback(@RequestParam(required = false) String token,
                         @RequestParam(required = false) String conversationId,
                         @RequestBody(required = false) Map<String, String> body,
                         jakarta.servlet.http.HttpServletResponse response) throws Exception {

        // iyzico sends token in form-data body
        String actualToken = token != null ? token : (body != null ? body.get("token") : null);
        String actualConvId = conversationId != null ? conversationId : (body != null ? body.get("conversationId") : null);

        if (actualToken == null) {
            log.warn("[iyzico] Callback'te token bulunamadı.");
            response.sendRedirect("/?payment=error&message=invalid_token");
            return;
        }

        log.info("[iyzico] Callback alındı, token doğrulanıyor: {}", actualToken);

        RetrieveCheckoutFormRequest request = new RetrieveCheckoutFormRequest();
        request.setLocale(com.iyzipay.model.Locale.TR.getValue());
        request.setConversationId(actualConvId != null ? actualConvId : "");
        request.setToken(actualToken);

        CheckoutForm result = CheckoutForm.retrieve(request, iyzicoOptions);

        if (!"success".equals(result.getStatus())) {
            String userMessage = IyzicoErrorMessages.get(result.getErrorCode());
            log.warn("[iyzico] Ödeme başarısız: {}", result.getErrorMessage());
            response.sendRedirect("/?payment=error&message=" + java.net.URLEncoder.encode(userMessage, "UTF-8"));
            return;
        }

        log.info("[iyzico] Ödeme başarılı! paymentId={}, paidPrice={}", result.getPaymentId(), result.getPaidPrice());
        // TODO: Update order status in DB: mark as paid with result.getPaymentId()

        response.sendRedirect("/?payment=success&orderId=" + (result.getConversationId() != null ? result.getConversationId() : ""));
    }

    // POST /stored-card
    @PostMapping("/stored-card")
    public ResponseEntity<Map<String, Object>> storedCard(@RequestBody Map<String, Object> body) {
        try {
            String cardUserKey = (String) body.get("cardUserKey");
            String cardToken = (String) body.get("cardToken");

            if (cardUserKey == null || cardToken == null) {
                return badRequest("Kayıtlı kart bilgileri eksik.");
            }

            String callbackUrl = appUrl + "/api/payment/callback";
            String conversationId = body.containsKey("conversationId")
                    ? (String) body.get("conversationId")
                    : "order_" + System.currentTimeMillis();
            String price = body.containsKey("price") ? body.get("price").toString() : "100.00";

            CreatePaymentRequest request = buildStoredCardRequest(
                    cardUserKey, cardToken, conversationId, price, body, callbackUrl);

            log.info("[iyzico] Kayıtlı kart ödeme isteği gönderiliyor: cardUserKey={}", cardUserKey);

            ThreedsInitialize result = ThreedsInitialize.create(request, iyzicoOptions);

            if (!"success".equals(result.getStatus())) {
                String userMessage = IyzicoErrorMessages.get(result.getErrorCode());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", userMessage,
                    "error", Map.of("code", result.getErrorCode() != null ? result.getErrorCode() : "")
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "threeDSHtmlContent", result.getHtmlContent() != null ? result.getHtmlContent() : "",
                "conversationId", result.getConversationId() != null ? result.getConversationId() : ""
            ));
        } catch (Exception e) {
            log.error("[iyzico] Kayıtlı kart ödeme hatası", e);
            return serverError("Sunucu hatası.");
        }
    }

    @SuppressWarnings("unchecked")
    private CreateCheckoutFormInitializeRequest buildCheckoutFormRequest(
            Map<String, Object> body, String callbackUrl) {

        CreateCheckoutFormInitializeRequest req = new CreateCheckoutFormInitializeRequest();
        req.setLocale(com.iyzipay.model.Locale.TR.getValue());
        req.setCurrency(com.iyzipay.model.Currency.TRY.name());
        req.setPaymentGroup(PaymentGroup.PRODUCT.name());
        req.setCallbackUrl(callbackUrl);
        req.setEnabledInstallments(List.of(1, 2, 3, 6, 9));

        if (body != null && body.containsKey("price")) {
            // Real order data
            req.setConversationId((String) body.getOrDefault("conversationId", "order_" + System.currentTimeMillis()));
            String priceStr = body.get("price").toString();
            req.setPrice(new BigDecimal(priceStr));
            req.setPaidPrice(new BigDecimal(body.getOrDefault("paidPrice", priceStr).toString()));
            req.setBasketId("basket_" + req.getConversationId());

            if (body.containsKey("buyer")) {
                req.setBuyer(buildBuyer((Map<String, Object>) body.get("buyer")));
            }
            if (body.containsKey("shippingAddress")) {
                req.setShippingAddress(buildAddress((Map<String, Object>) body.get("shippingAddress")));
            }
            if (body.containsKey("billingAddress")) {
                req.setBillingAddress(buildAddress((Map<String, Object>) body.get("billingAddress")));
            }
            if (body.containsKey("basketItems")) {
                req.setBasketItems(buildBasketItems((List<Map<String, Object>>) body.get("basketItems")));
            }
        } else {
            // Demo data
            String convId = "order_" + System.currentTimeMillis();
            req.setConversationId(convId);
            req.setPrice(new BigDecimal("100.00"));
            req.setPaidPrice(new BigDecimal("100.00"));
            req.setBasketId("basket_" + convId);

            Buyer buyer = new Buyer();
            buyer.setId("BY789");
            buyer.setName("Ahmet");
            buyer.setSurname("Yılmaz");
            buyer.setGsmNumber("+905350000000");
            buyer.setEmail("ahmet.yilmaz@example.com");
            buyer.setIdentityNumber("74300864791");
            buyer.setLastLoginDate("2025-10-05 12:43:35");
            buyer.setRegistrationDate("2013-04-21 15:12:09");
            buyer.setRegistrationAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
            buyer.setIp("85.34.78.112");
            buyer.setCity("Istanbul");
            buyer.setCountry("Turkey");
            buyer.setZipCode("34732");
            req.setBuyer(buyer);

            Address addr = new Address();
            addr.setContactName("Jane Doe");
            addr.setCity("Istanbul");
            addr.setCountry("Turkey");
            addr.setAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
            addr.setZipCode("34742");
            req.setShippingAddress(addr);
            req.setBillingAddress(addr);

            BasketItem item1 = new BasketItem();
            item1.setId("BI101");
            item1.setName("Sürpriz Yemek Paketi - Bella Italia");
            item1.setCategory1("Yiyecek");
            item1.setCategory2("Restoran");
            item1.setItemType(BasketItemType.PHYSICAL.name());
            item1.setPrice(new BigDecimal("75.00"));

            BasketItem item2 = new BasketItem();
            item2.setId("BI102");
            item2.setName("Teslimat Ücreti");
            item2.setCategory1("Teslimat");
            item2.setCategory2("Kargo");
            item2.setItemType(BasketItemType.VIRTUAL.name());
            item2.setPrice(new BigDecimal("25.00"));

            req.setBasketItems(List.of(item1, item2));
        }

        return req;
    }

    private CreatePaymentRequest buildStoredCardRequest(
            String cardUserKey, String cardToken, String conversationId,
            String price, Map<String, Object> body, String callbackUrl) {

        CreatePaymentRequest req = new CreatePaymentRequest();
        req.setLocale(com.iyzipay.model.Locale.TR.getValue());
        req.setConversationId(conversationId);
        req.setPrice(new BigDecimal(price));
        req.setPaidPrice(new BigDecimal(price));
        req.setCurrency(com.iyzipay.model.Currency.TRY.name());
        req.setBasketId("basket_" + conversationId);
        req.setPaymentGroup(PaymentGroup.PRODUCT.name());
        req.setCallbackUrl(callbackUrl);

        PaymentCard paymentCard = new PaymentCard();
        paymentCard.setCardUserKey(cardUserKey);
        paymentCard.setCardToken(cardToken);
        req.setPaymentCard(paymentCard);

        return req;
    }

    private Buyer buildBuyer(Map<String, Object> map) {
        Buyer buyer = new Buyer();
        buyer.setId((String) map.getOrDefault("id", ""));
        buyer.setName((String) map.getOrDefault("name", ""));
        buyer.setSurname((String) map.getOrDefault("surname", ""));
        buyer.setGsmNumber((String) map.getOrDefault("gsmNumber", ""));
        buyer.setEmail((String) map.getOrDefault("email", ""));
        buyer.setIdentityNumber((String) map.getOrDefault("identityNumber", ""));
        buyer.setLastLoginDate((String) map.getOrDefault("lastLoginDate", ""));
        buyer.setRegistrationDate((String) map.getOrDefault("registrationDate", ""));
        buyer.setRegistrationAddress((String) map.getOrDefault("registrationAddress", ""));
        buyer.setIp((String) map.getOrDefault("ip", ""));
        buyer.setCity((String) map.getOrDefault("city", ""));
        buyer.setCountry((String) map.getOrDefault("country", ""));
        buyer.setZipCode((String) map.getOrDefault("zipCode", ""));
        return buyer;
    }

    private Address buildAddress(Map<String, Object> map) {
        Address addr = new Address();
        addr.setContactName((String) map.getOrDefault("contactName", ""));
        addr.setCity((String) map.getOrDefault("city", ""));
        addr.setCountry((String) map.getOrDefault("country", ""));
        addr.setAddress((String) map.getOrDefault("address", ""));
        addr.setZipCode((String) map.getOrDefault("zipCode", ""));
        return addr;
    }

    @SuppressWarnings("unchecked")
    private List<BasketItem> buildBasketItems(List<Map<String, Object>> items) {
        if (items == null) return List.of();
        return items.stream().map(item -> {
            BasketItem bi = new BasketItem();
            bi.setId((String) item.getOrDefault("id", ""));
            bi.setName((String) item.getOrDefault("name", ""));
            bi.setCategory1((String) item.getOrDefault("category1", ""));
            bi.setCategory2((String) item.getOrDefault("category2", ""));
            bi.setItemType((String) item.getOrDefault("itemType", BasketItemType.PHYSICAL.name()));
            bi.setPrice(new BigDecimal(item.getOrDefault("price", "0").toString()));
            return bi;
        }).toList();
    }
}

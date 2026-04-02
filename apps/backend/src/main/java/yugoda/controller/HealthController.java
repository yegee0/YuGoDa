package yugoda.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Value("${spring.profiles.active:development}")
    private String env;

    @Value("${iyzico.base-url:https://sandbox-api.iyzipay.com}")
    private String iyzicoBaseUrl;

    // Root endpoint — also handles payment callback redirects (?payment=success/error)
    @GetMapping("/")
    public Map<String, Object> root(
            @RequestParam(required = false) String payment,
            @RequestParam(required = false) String orderId,
            @RequestParam(required = false) String message) {

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("name", "YuGoDa API");
        resp.put("version", "1.0.0");
        resp.put("status", "running");

        if (payment != null) {
            resp.put("payment", payment);
            if (orderId != null) resp.put("orderId", orderId);
            if (message != null) resp.put("message", message);
        }

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("health",        "/health");
        endpoints.put("users",         "/api/users");
        endpoints.put("bags",          "/api/bags");
        endpoints.put("orders",        "/api/orders");
        endpoints.put("stores",        "/api/stores");
        endpoints.put("reviews",       "/api/reviews");
        endpoints.put("notifications", "/api/notifications");
        endpoints.put("disputes",      "/api/disputes");
        endpoints.put("drivers",       "/api/drivers");
        endpoints.put("transactions",  "/api/transactions");
        endpoints.put("payment",       "/api/payment");
        resp.put("endpoints", endpoints);

        return resp;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "ok",
            "timestamp", Instant.now().toString(),
            "environment", env,
            "iyzicoMode", iyzicoBaseUrl.contains("sandbox") ? "SANDBOX" : "PRODUCTION"
        );
    }
}

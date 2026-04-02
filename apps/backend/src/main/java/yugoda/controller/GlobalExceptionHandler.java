package yugoda.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

/**
 * Replaces Spring's Whitelabel Error Page with clean JSON responses.
 */
@RestControllerAdvice
@RestController
public class GlobalExceptionHandler implements ErrorController {

    // Catch unmatched routes that Spring forwards to /error
    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Object status = request.getAttribute("jakarta.servlet.error.status_code");
        int code = status instanceof Integer i ? i : 404;
        String message = code == 404 ? "Endpoint bulunamadı." : "Sunucu hatası.";
        return ResponseEntity.status(code).body(Map.of("success", false, "message", message));
    }

    // 404 for unmatched @RequestMapping routes
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "Endpoint bulunamadı."));
    }

    // Catch-all for unhandled exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Sunucu hatası. Lütfen daha sonra tekrar deneyin."));
    }
}

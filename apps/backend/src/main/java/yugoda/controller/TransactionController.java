package yugoda.controller;

import yugoda.model.Transaction;
import yugoda.security.UserPrincipal;
import yugoda.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController extends BaseController {

    private final TransactionService transactionService;

    // GET / (admin)
    @GetMapping
    public ResponseEntity<Map<String, Object>> listTransactions(
            HttpServletRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");

        Map<String, Object> result = transactionService.listTransactions(status, startDate, endDate);
        result.put("success", true);
        return ResponseEntity.ok(result);
    }

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTransaction(HttpServletRequest request,
                                                                   @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.get("orderId") == null || body.get("amount") == null) {
            return badRequest("orderId ve amount zorunludur.");
        }
        try {
            Transaction tx = transactionService.createTransaction(user.getUid(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "transaction", tx));
        } catch (Exception e) {
            return serverError("İşlem kaydı oluşturulamadı.");
        }
    }
}

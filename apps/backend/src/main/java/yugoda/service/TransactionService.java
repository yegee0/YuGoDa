package yugoda.service;

import yugoda.model.Transaction;
import yugoda.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public Map<String, Object> listTransactions(String status, String startDate, String endDate) {
        List<Transaction> all;
        if (status != null) {
            all = transactionRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            all = transactionRepository.findAllByOrderByCreatedAtDesc();
        }

        // Date filtering (basic string compare)
        Stream<Transaction> stream = all.stream();
        if (startDate != null) stream = stream.filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toString().compareTo(startDate) >= 0);
        if (endDate != null) stream = stream.filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toString().compareTo(endDate) <= 0);
        List<Transaction> transactions = stream.toList();

        // Stats
        List<Transaction> allForStats = transactionRepository.findAll();
        long totalCount = allForStats.size();
        double totalRevenue = allForStats.stream().mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0).sum();
        double totalTips = allForStats.stream().mapToDouble(t -> t.getTip() != null ? t.getTip() : 0).sum();
        double completedRevenue = allForStats.stream()
                .filter(t -> "completed".equals(t.getStatus()))
                .mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0).sum();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCount", totalCount);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTips", totalTips);
        stats.put("completedRevenue", completedRevenue);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactions", transactions);
        result.put("stats", stats);
        return result;
    }

    @Transactional
    public Transaction createTransaction(String uid, Map<String, Object> body) {
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID().toString());
        tx.setOrderId((String) body.get("orderId"));
        tx.setUserId(body.containsKey("userId") ? (String) body.get("userId") : uid);
        tx.setRestaurantId((String) body.get("restaurantId"));
        tx.setAmount(((Number) body.get("amount")).doubleValue());
        tx.setTip(body.containsKey("tip") ? ((Number) body.get("tip")).doubleValue() : 0.0);
        tx.setCurrency((String) body.getOrDefault("currency", "TRY"));
        tx.setStatus((String) body.getOrDefault("status", "pending"));
        tx.setPaymentMethod((String) body.getOrDefault("paymentMethod", "card"));
        return transactionRepository.save(tx);
    }
}

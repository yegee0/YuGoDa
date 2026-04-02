package yugoda.repository;

import yugoda.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findAllByOrderByCreatedAtDesc();
    List<Transaction> findByStatusOrderByCreatedAtDesc(String status);
    List<Transaction> findByOrderId(String orderId);

    @Query("SELECT COUNT(t), COALESCE(SUM(t.amount), 0), COALESCE(SUM(t.tip), 0), " +
           "COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) FROM Transaction t")
    Object[] getStats();
}

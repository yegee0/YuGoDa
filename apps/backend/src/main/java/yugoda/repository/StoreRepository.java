package yugoda.repository;

import yugoda.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, String> {
    List<Store> findByStatusOrderByCreatedAtDesc(String status);
    List<Store> findAllByOrderByCreatedAtDesc();
}

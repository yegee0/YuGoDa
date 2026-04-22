package yugoda.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import yugoda.model.AdminPresence;
import yugoda.repository.AdminPresenceRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminPresenceService {

    private static final List<String> VALID_STATES = List.of("available", "away", "offline");

    private final AdminPresenceRepository presenceRepository;

    @Transactional
    public AdminPresence heartbeat(String adminUid, String state) {
        String resolvedState = VALID_STATES.contains(state) ? state : "available";
        AdminPresence presence = presenceRepository.findById(adminUid).orElseGet(() -> {
            AdminPresence p = new AdminPresence();
            p.setAdminUid(adminUid);
            return p;
        });
        presence.setState(resolvedState);
        presence.setLastHeartbeatAt(LocalDateTime.now());
        return presenceRepository.save(presence);
    }

    public long countAvailable() {
        return presenceRepository.findByState("available").size();
    }

    public Optional<AdminPresence> findFreeAvailable() {
        List<AdminPresence> candidates = presenceRepository
                .findByStateAndCurrentConversationIdIsNullOrderByLastAssignedAtAsc("available");
        return candidates.stream().findFirst();
    }

    @Transactional
    public void assignConversation(String adminUid, String conversationId) {
        presenceRepository.findById(adminUid).ifPresent(p -> {
            p.setCurrentConversationId(conversationId);
            p.setLastAssignedAt(LocalDateTime.now());
            presenceRepository.save(p);
        });
    }

    @Transactional
    public void releaseConversation(String adminUid) {
        presenceRepository.findById(adminUid).ifPresent(p -> {
            p.setCurrentConversationId(null);
            presenceRepository.save(p);
        });
    }

    @Transactional
    public List<AdminPresence> sweepStale(LocalDateTime threshold) {
        List<AdminPresence> stale = presenceRepository.findByLastHeartbeatAtBefore(threshold).stream()
                .filter(p -> !"offline".equals(p.getState()))
                .toList();
        for (AdminPresence p : stale) {
            p.setState("offline");
            p.setCurrentConversationId(null);
        }
        presenceRepository.saveAll(stale);
        return stale;
    }

    public Optional<AdminPresence> get(String adminUid) {
        return presenceRepository.findById(adminUid);
    }

    public boolean isBusy(String adminUid) {
        return presenceRepository.findById(adminUid)
                .map(p -> p.getCurrentConversationId() != null)
                .orElse(false);
    }
}

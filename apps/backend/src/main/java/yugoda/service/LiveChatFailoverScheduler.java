package yugoda.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import yugoda.model.AdminPresence;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Marks admins offline when their heartbeat lapses beyond the threshold,
 * and requeues any conversations they were actively handling.
 */
@Component
@RequiredArgsConstructor
public class LiveChatFailoverScheduler {

    private static final Logger log = LoggerFactory.getLogger(LiveChatFailoverScheduler.class);

    // 3x the frontend heartbeat interval (30s) to tolerate jitter before declaring offline.
    private static final long HEARTBEAT_TIMEOUT_SECONDS = 90;

    private final AdminPresenceService presenceService;
    private final LiveChatService liveChatService;

    @Scheduled(fixedDelayString = "${live-chat.failover-interval-ms:5000}")
    public void sweep() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(HEARTBEAT_TIMEOUT_SECONDS);
        List<AdminPresence> flipped = presenceService.sweepStale(threshold);
        if (flipped.isEmpty()) return;
        log.info("[LiveChat] Marked {} admin(s) offline due to heartbeat timeout.", flipped.size());
        List<String> uids = flipped.stream().map(AdminPresence::getAdminUid).toList();
        liveChatService.requeueOrphanedConversations(uids);
    }
}

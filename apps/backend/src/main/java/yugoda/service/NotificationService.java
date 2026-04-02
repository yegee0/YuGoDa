package yugoda.service;

import yugoda.model.Notification;
import yugoda.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> listNotifications(String userId) {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(String userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public void markRead(String notifId, String uid) {
        Notification notif = notificationRepository.findById(notifId)
                .orElseThrow(() -> new NoSuchElementException("Bildirim bulunamadı."));
        if (!notif.getUserId().equals(uid)) {
            throw new SecurityException("Bu bildirimi güncelleme yetkiniz yok.");
        }
        notif.setRead(1);
        notificationRepository.save(notif);
    }

    @Transactional
    public Notification createNotification(String userId, String title, String message) {
        Notification notif = new Notification();
        notif.setId(UUID.randomUUID().toString());
        notif.setUserId(userId);
        notif.setTitle(title);
        notif.setMessage(message);
        return notificationRepository.save(notif);
    }
}

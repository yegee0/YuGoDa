package yugoda.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FcmService {

    private static final Logger log = LoggerFactory.getLogger(FcmService.class);

    /**
     * Sends a push notification to the given FCM token.
     * Failures are logged but never propagated so they cannot interrupt the order flow.
     *
     * Common reasons for failure on localhost:
     *  - Firebase Admin SDK not initialized (no FIREBASE_SERVICE_ACCOUNT_PATH set and no GCP ADC)
     *    → set FIREBASE_SERVICE_ACCOUNT_PATH in the root .env.local and restart the backend
     *  - FCM token null/empty (customer app has not yet registered, or permission was denied)
     *  - Token/project mismatch (VAPID key belongs to a different Firebase project than the Admin SDK)
     */
    public void sendPush(String fcmToken, String title, String body) {
        if (fcmToken == null || fcmToken.isBlank()) {
            log.debug("[FCM] Skipped — fcmToken is null or blank for title='{}'", title);
            return;
        }

        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("[FCM] FirebaseApp is not initialized — push skipped. " +
                     "For local development set FIREBASE_SERVICE_ACCOUNT_PATH in the root .env.local " +
                     "to a service account JSON downloaded from Firebase Console → Project Settings → Service Accounts.");
            return;
        }

        try {
            Message message = Message.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setToken(fcmToken)
                    .build();
            String messageId = FirebaseMessaging.getInstance().send(message);
            log.debug("[FCM] Sent successfully — messageId={}", messageId);
        } catch (Exception e) {
            log.error("[FCM] Failed to send push to token ending in '...{}': {}",
                    fcmToken.length() > 8 ? fcmToken.substring(fcmToken.length() - 8) : fcmToken,
                    e.getMessage());
        }
    }
}

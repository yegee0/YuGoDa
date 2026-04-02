package yugoda.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Admin SDK initialization.
 *
 * Supports two initialization modes:
 *  1. Service account JSON file  → set FIREBASE_SERVICE_ACCOUNT_PATH env var
 *  2. Project ID only (no auth)  → set FIREBASE_PROJECT_ID env var
 *     (token verification falls back to JWT decode in JwtAuthFilter)
 *
 * The firebase/firebase-applet-config.json in this app is the frontend/web config —
 * it is NOT used here. For server-side verification you need a service account.
 * Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.project-id:yugoda-5b36a}")
    private String projectId;

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) return;

        try {
            FirebaseOptions options;

            if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                // Mode 1: Service account file provided
                try (InputStream serviceAccount = new FileInputStream(serviceAccountPath)) {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setProjectId(projectId)
                            .build();
                    log.info("[Firebase] Initialized with service account: {}", serviceAccountPath);
                }
            } else {
                // Mode 2: Application default credentials (Google Cloud environments)
                // or no credentials — JWT tokens will be decoded but not cryptographically verified
                try {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .setProjectId(projectId)
                            .build();
                    log.info("[Firebase] Initialized with application default credentials.");
                } catch (IOException e) {
                    log.warn("[Firebase] No service account configured. Token verification uses JWT decode only.");
                    log.warn("[Firebase] To enable full verification, set FIREBASE_SERVICE_ACCOUNT_PATH env var.");
                    return;
                }
            }

            FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            log.error("[Firebase] Initialization failed: {}", e.getMessage());
        }
    }
}

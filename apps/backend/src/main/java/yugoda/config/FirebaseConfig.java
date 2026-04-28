package yugoda.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ImpersonatedCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Firebase Admin SDK initialization.
 *
 * Credential resolution order (first match wins):
 *  1. FIREBASE_SERVICE_ACCOUNT_KEY env var — the full service account JSON pasted as a string.
 *     Ideal for local dev and CI: no file to manage, just set the env var.
 *  2. FIREBASE_SERVICE_ACCOUNT_PATH env var — path to a service account JSON file.
 *  3. GCP Application Default Credentials — works automatically on Cloud Run.
 *     Falls back to JWT-decode-only mode if ADC is also unavailable (pure local dev).
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-key:}")
    private String serviceAccountKey;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.project-id:yugoda-5b36a}")
    private String projectId;

    @Value("${firebase.customer-project-id:}")
    private String customerProjectId;

    @Value("${firebase.customer-impersonate-sa:}")
    private String customerImpersonateSa;

    @PostConstruct
    public void initialize() {
        initializeDefaultApp();
        initializeCustomerApp();
    }

    private void initializeDefaultApp() {
        if (!FirebaseApp.getApps().isEmpty()) return;

        try {
            GoogleCredentials credentials = resolveCredentials();
            if (credentials == null) return; // warning already logged

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .setProjectId(projectId)
                    .build();
            FirebaseApp.initializeApp(options);
        } catch (Exception e) {
            log.error("[Firebase] Initialization failed: {}", e.getMessage());
        }
    }

    private GoogleCredentials resolveCredentials() throws IOException {
        // 1. Inline JSON content from env var
        if (serviceAccountKey != null && !serviceAccountKey.isBlank()) {
            try (InputStream stream = new ByteArrayInputStream(
                    serviceAccountKey.getBytes(StandardCharsets.UTF_8))) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(stream);
                log.info("[Firebase] Initialized with inline service account key (FIREBASE_SERVICE_ACCOUNT_KEY).");
                return credentials;
            }
        }

        // 2. File path from env var
        if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
            try (InputStream stream = new FileInputStream(serviceAccountPath)) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(stream);
                log.info("[Firebase] Initialized with service account file: {}", serviceAccountPath);
                return credentials;
            }
        }

        // 3. GCP Application Default Credentials (Cloud Run, etc.)
        try {
            GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
            log.info("[Firebase] Initialized with application default credentials.");
            return credentials;
        } catch (IOException e) {
            log.warn("[Firebase] No credentials found. FCM push notifications will be disabled.");
            log.warn("[Firebase] To enable locally: run 'gcloud auth application-default login' and restart.");
            return null;
        }
    }

    /**
     * Initializes a second named FirebaseApp ("yugoda-customer") for the customer-facing
     * Firebase project using Service Account Impersonation.
     *
     * The Cloud Run service account (ADC) must have roles/iam.serviceAccountTokenCreator
     * on the impersonated SA in the yugoda-customer GCP project.
     * No JSON key file is required.
     */
    private void initializeCustomerApp() {
        if (customerProjectId == null || customerProjectId.isBlank()
                || customerImpersonateSa == null || customerImpersonateSa.isBlank()) {
            log.warn("[FIREBASE_CUSTOMER] Project ID or impersonate SA not configured — customer admin operations will be skipped");
            return;
        }

        // Guard: skip if already initialized (e.g. on context refresh in tests)
        boolean alreadyExists = FirebaseApp.getApps().stream()
                .anyMatch(app -> "yugoda-customer".equals(app.getName()));
        if (alreadyExists) return;

        try {
            GoogleCredentials baseCreds = GoogleCredentials.getApplicationDefault();
            ImpersonatedCredentials impCreds = ImpersonatedCredentials.create(
                    baseCreds,
                    customerImpersonateSa,
                    null,
                    Arrays.asList(
                            "https://www.googleapis.com/auth/cloud-platform",
                            "https://www.googleapis.com/auth/firebase"
                    ),
                    3600
            );
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(impCreds)
                    .setProjectId(customerProjectId)
                    .build();
            FirebaseApp.initializeApp(options, "yugoda-customer");
            log.info("[FIREBASE_CUSTOMER] Initialized via impersonation of {} for project {}",
                    customerImpersonateSa, customerProjectId);
        } catch (Exception e) {
            log.error("[FIREBASE_CUSTOMER] Failed to initialize: {}", e.getMessage());
        }
    }
}

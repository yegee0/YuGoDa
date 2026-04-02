package yugoda.payment;

import com.iyzipay.Options;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class IyzicoConfig {

    private static final Logger log = LoggerFactory.getLogger(IyzicoConfig.class);

    @Value("${iyzico.api-key:dummy}")
    private String apiKey;

    @Value("${iyzico.secret-key:dummy}")
    private String secretKey;

    @Value("${iyzico.base-url:https://sandbox-api.iyzipay.com}")
    private String baseUrl;

    @Bean
    public Options iyzicoOptions() {
        if ("dummy".equals(apiKey) || "dummy".equals(secretKey)) {
            log.warn("[iyzico] API anahtarları ayarlanmamış. Ödeme işlemleri devre dışı.");
        }
        Options options = new Options();
        options.setApiKey(apiKey);
        options.setSecretKey(secretKey);
        options.setBaseUrl(baseUrl);
        return options;
    }
}

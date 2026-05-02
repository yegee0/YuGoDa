package yugoda.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfig {

    /**
     * RestTemplate used by AiChatService to call the Gemini REST API.
     * 60s read timeout is generous for Flash models which usually answer
     * in under 5 seconds; the buffer protects against cold-start spikes
     * and the rare long generation.
     */
    @Bean("geminiRestTemplate")
    public RestTemplate geminiRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        return new RestTemplate(factory);
    }
}

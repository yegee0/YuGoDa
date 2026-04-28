package yugoda.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:}")
    private List<String> allowedOrigins;

    /**
     * Registers CorsFilter at HIGHEST_PRECEDENCE so it always runs before every
     * other filter in the chain — including JwtAuthFilter.
     *
     * This is critical: when JwtAuthFilter short-circuits a request (e.g. 401 for
     * deleted/banned accounts, 403 for suspended accounts) it writes the response
     * and returns WITHOUT calling filterChain.doFilter(). If CorsFilter had a lower
     * priority it would never execute, leaving the response with no CORS headers.
     * The browser then blocks the response before the frontend's fetch() can read
     * the status code, preventing the client-side sign-out logic from firing.
     *
     * By running first, CorsFilter adds Access-Control-Allow-Origin (and friends)
     * to the HttpServletResponse BEFORE handing off to the rest of the chain. Those
     * headers survive even when a downstream filter short-circuits the chain.
     */
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));

        List<String> origins = allowedOrigins.stream()
                .filter(o -> o != null && !o.isBlank())
                .toList();

        if (!origins.isEmpty()) {
            config.setAllowedOrigins(origins);
        } else {
            config.setAllowedOriginPatterns(List.of("http://localhost*", "http://localhost:*"));
        }

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> registration =
                new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}

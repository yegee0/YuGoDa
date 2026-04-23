package yugoda.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP-over-WebSocket configuration.
 *
 * Endpoint  : /ws   (native WebSocket — no SockJS required for modern browsers)
 * Topics    : /topic/chat.{conversationId}        — new ChatMessage pushed after sendMessage()
 *             /topic/chat.status.{conversationId} — conversation status change (active/archived/…)
 *             /topic/chat.queue                   — queue changed (admin re-fetches via REST)
 *
 * Clients connect to:
 *   dev  → ws://localhost:4000/ws
 *   prod → wss://backend-service-ey66bgcneq-ew.a.run.app/ws
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-process simple broker — no external broker needed
        config.enableSimpleBroker("/topic");
        // Prefix for messages routed to @MessageMapping controllers (not used yet)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // CORS handled separately in CorsConfig
    }
}

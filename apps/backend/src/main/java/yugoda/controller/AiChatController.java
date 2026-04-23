package yugoda.controller;

import yugoda.security.UserPrincipal;
import yugoda.service.AiChatService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class AiChatController extends BaseController {

    private final AiChatService aiChatService;

    /**
     * GET /api/chat/recommendations — Proactive AI recommendations for "YuGoDa Assistant".
     */
    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> recommendations(
            HttpServletRequest request,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        UserPrincipal user = getUser(request);
        String userId = user != null ? user.getUid() : "anonymous";

        AiChatService.ChatResult result = aiChatService.recommend(userId, lat, lng);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "reply", result.reply(),
                "recommendations", result.recommendations()
        ));
    }

    /**
     * POST /api/chat/message — Conversational AI turn.
     * Body: { message: string, history?: [{role, content}] }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> message(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        String userId = user != null ? user.getUid() : "anonymous";
        String message = body.getOrDefault("message", "").toString().trim();
        if (message.isEmpty()) return badRequest("message is required.");
        List<Map<String, String>> history = body.get("history") instanceof List<?> h
                ? (List<Map<String, String>>) h
                : List.of();

        AiChatService.ChatResult result = aiChatService.chatMessage(userId, message, history);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "reply", result.reply(),
                "recommendations", result.recommendations()
        ));
    }
}

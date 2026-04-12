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
     * POST /api/chat — Send a user message and get an AI response.
     * Auth is optional: logged-in users get personalised context,
     * anonymous users get generic bag recommendations.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> chat(HttpServletRequest request,
                                                     @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        String userId = user != null ? user.getUid() : "anonymous";

        String message = (String) body.get("message");
        if (message == null || message.isBlank()) {
            return badRequest("message alani zorunludur.");
        }

        Double lat = null;
        Double lng = null;
        Object location = body.get("location");
        if (location instanceof Map<?, ?> loc) {
            lat = toDouble(loc.get("lat"));
            lng = toDouble(loc.get("lng"));
        }

        AiChatService.ChatResult result = aiChatService.chat(userId, message, lat, lng);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "reply", result.reply(),
                "recommendations", result.recommendations()
        ));
    }

    /**
     * GET /api/chat/history — Retrieve chat history for the current user's session.
     */
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> history(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        String userId = user != null ? user.getUid() : "anonymous";

        List<Map<String, String>> messages = aiChatService.getHistory(userId);
        return ResponseEntity.ok(Map.of("success", true, "messages", messages));
    }

    /**
     * GET /api/chat/recommendations — Get proactive AI recommendations.
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

    private Double toDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }
}

package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import yugoda.model.Ticket;
import yugoda.security.UserPrincipal;
import yugoda.service.TicketService;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController extends BaseController {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    // POST /api/tickets
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTicket(HttpServletRequest request,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        try {
            Ticket ticket = ticketService.createTicket(
                    user.getUid(),
                    (String) body.get("category"),
                    (String) body.get("priority"),
                    (String) body.get("subject"),
                    (String) body.get("description"),
                    (String) body.get("orderRef")
            );
            return ResponseEntity.status(201).body(Map.of("success", true, "ticket", toMap(ticket)));
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (Exception e) {
            return serverError("Ticket could not be created.");
        }
    }

    // GET /api/tickets/my
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> listMyTickets(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        List<Map<String, Object>> tickets = ticketService.listMyTickets(user.getUid()).stream()
                .map(this::toMap).toList();
        return ResponseEntity.ok(Map.of("success", true, "tickets", tickets));
    }

    // GET /api/tickets (admin)
    @GetMapping
    public ResponseEntity<Map<String, Object>> listAllTickets(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "admin")) return forbidden("Admin role required.");
        List<Map<String, Object>> tickets = ticketService.listAllTickets().stream()
                .map(this::toMap).toList();
        return ResponseEntity.ok(Map.of("success", true, "tickets", tickets));
    }

    // PUT /api/tickets/{id}/status (admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(HttpServletRequest request,
                                                            @PathVariable String id,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "admin")) return forbidden("Admin role required.");
        try {
            Ticket ticket = ticketService.updateStatus(id, (String) body.get("status"));
            return ResponseEntity.ok(Map.of("success", true, "ticket", toMap(ticket)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Ticket ticket) {
        return objectMapper.convertValue(ticket, Map.class);
    }
}

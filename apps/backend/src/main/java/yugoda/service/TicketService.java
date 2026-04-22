package yugoda.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import yugoda.model.Ticket;
import yugoda.repository.TicketRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final List<String> VALID_STATUSES = List.of("open", "in_progress", "resolved", "closed");
    private static final List<String> VALID_PRIORITIES = List.of("Low", "Medium", "High", "Urgent");

    private final TicketRepository ticketRepository;

    @Transactional
    public Ticket createTicket(String userId, String category, String priority, String subject,
                               String description, String orderRef) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("category is required.");
        }
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("subject is required.");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("description is required.");
        }
        String resolvedPriority = priority != null && VALID_PRIORITIES.contains(priority) ? priority : "Medium";

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID().toString());
        ticket.setUserId(userId);
        ticket.setCategory(category);
        ticket.setPriority(resolvedPriority);
        ticket.setSubject(subject);
        ticket.setDescription(description);
        ticket.setOrderRef(orderRef);
        ticket.setStatus("open");
        return ticketRepository.save(ticket);
    }

    public List<Ticket> listMyTickets(String userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Ticket> listAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Ticket updateStatus(String ticketId, String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Invalid status.");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NoSuchElementException("Ticket not found."));
        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }
}

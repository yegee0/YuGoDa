package yugoda.service;

/**
 * Thrown when a customer tries to read messages from a conversation they have
 * soft-deleted (status = "customer_deleted"). Controllers map this to HTTP 410.
 */
public class ConversationArchivedException extends RuntimeException {
    public ConversationArchivedException(String message) {
        super(message);
    }
}

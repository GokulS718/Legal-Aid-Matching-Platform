package com.example.demo.controller;

import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.ChatSession;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ChatSessionRepository;
import com.example.demo.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://127.0.0.1:3000"})
public class ChatController {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtUtil jwtUtil;
    private final com.example.demo.service.MatchingService matchingService;
    private final com.example.demo.service.CloudinaryService cloudinaryService;
    private final com.example.demo.repository.LawyerRepository lawyerRepository;
    private final com.example.demo.repository.NGORepository ngoRepository;
    private final com.example.demo.repository.CitizenRepository citizenRepository;

    public ChatController(ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            SimpMessagingTemplate messagingTemplate,
            JwtUtil jwtUtil,
            com.example.demo.service.MatchingService matchingService,
            com.example.demo.service.CloudinaryService cloudinaryService,
            com.example.demo.repository.LawyerRepository lawyerRepository,
            com.example.demo.repository.NGORepository ngoRepository,
            com.example.demo.repository.CitizenRepository citizenRepository) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.messagingTemplate = messagingTemplate;
        this.jwtUtil = jwtUtil;
        this.matchingService = matchingService;
        this.cloudinaryService = cloudinaryService;
        this.lawyerRepository = lawyerRepository;
        this.ngoRepository = ngoRepository;
        this.citizenRepository = citizenRepository;
    }

    private Integer extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractClaim(token, claims -> claims.get("userId", Integer.class));
        } catch (Exception e) {
            return null;
        }
    }

    private String extractUserRole(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return null;
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }

    // Create a new chat session (matched or direct)
    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestData) {
        try {
            Integer userId = extractUserId(authHeader);
            String role = extractUserRole(authHeader);
            if (userId == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

            // Allow CITIZEN, LAWYER, and NGO to initiate
            
            // Handle optional caseId
            Long caseId = null;
            if (requestData.get("caseId") != null && !String.valueOf(requestData.get("caseId")).equals("null")) {
                caseId = Long.valueOf(requestData.get("caseId").toString());
            }

            Integer targetId = Integer.valueOf(requestData.get("providerId").toString()); // user sent as 'providerId'
            String targetRole = requestData.get("providerRole").toString(); // sent as 'providerRole'

            Integer citizenId;
            Integer providerId;
            String providerRole;

            // Determine who is who
            if ("CITIZEN".equalsIgnoreCase(role)) {
                citizenId = userId;
                providerId = targetId;
                providerRole = targetRole;
            } else {
                // Caller is Provider
                citizenId = targetId; // In this case provided ID is citizen ID
                providerId = userId;
                providerRole = role; 
                
                // Validate that targetRole was meant to be CITIZEN? 
                // Checks if frontend sent "CITIZEN" as providerRole when provider calls
                // or we can just ignore targetRole if we know caller is provider.
            }

            String foundProviderName = null;
            String foundCitizenName = null;

            // Only enforce matching if caseId is present
            if (caseId != null) {
                // Verify authorization via matching service
                Map<String, Object> matches = matchingService.findMatchesForCase(caseId);
                final boolean[] isAuthorized = {false};
                final String[] providerNameHolder = {null};

                if ("LAWYER".equalsIgnoreCase(providerRole)) {
                    List<com.example.demo.entity.Lawyer> lawyers = (List<com.example.demo.entity.Lawyer>) matches
                            .get("lawyers");
                    if (lawyers != null) {
                        Integer pid = providerId;
                        Optional<com.example.demo.entity.Lawyer> l = lawyers.stream()
                                .filter(law -> law.getId().equals(pid)).findFirst();
                        if (l.isPresent()) {
                            isAuthorized[0] = true;
                            providerNameHolder[0] = l.get().getFullName();
                        }
                    }
                } else if ("NGO".equalsIgnoreCase(providerRole)) {
                    List<com.example.demo.entity.NGO> ngos = (List<com.example.demo.entity.NGO>) matches.get("ngos");
                    if (ngos != null) {
                        Integer pid = providerId;
                        Optional<com.example.demo.entity.NGO> n = ngos.stream()
                                .filter(ngo -> ngo.getId().equals(pid)).findFirst();
                        if (n.isPresent()) {
                            isAuthorized[0] = true;
                            providerNameHolder[0] = n.get().getNgoName();
                        }
                    }
                }

                if (!isAuthorized[0]) {
                    // Check if already assigned (in case match is removed but assignment stays? Unlikely)
                    // Or if explicit assignment allows it. 
                    // For now, assume strict matching/assignment check.
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Chat can only be started with authorized legal parties for this case");
                }
                foundProviderName = providerNameHolder[0];
            } else {
                // No case ID -> General inquiry. 
                // If CITIZEN initiated: verify provider exists
                // If PROVIDER initiated: usually not allowed without case? 
                // But let's allow it if they desire (e.g. following up on old query).
                
                if ("LAWYER".equalsIgnoreCase(providerRole)) {
                    Optional<com.example.demo.entity.Lawyer> l = lawyerRepository.findById(providerId);
                    if (l.isPresent())
                        foundProviderName = l.get().getFullName();
                } else if ("NGO".equalsIgnoreCase(providerRole)) {
                    Optional<com.example.demo.entity.NGO> n = ngoRepository.findById(providerId);
                    if (n.isPresent())
                        foundProviderName = n.get().getNgoName();
                }
            }

            // Check if session already exists
            Optional<ChatSession> existing;
            if (caseId != null) {
                existing = chatSessionRepository
                        .findByCaseIdAndCitizenIdAndProviderIdAndProviderRole(caseId, citizenId, providerId, providerRole);
            } else {
                existing = chatSessionRepository
                        .findByCitizenIdAndProviderIdAndProviderRoleAndCaseIdIsNull(citizenId, providerId, providerRole);
            }

            if (existing.isPresent()) {
                return ResponseEntity.ok(existing.get());
            }

            // Create new session
            ChatSession session = new ChatSession();
            session.setCaseId(caseId);
            session.setCitizenId(citizenId);
            session.setProviderId(providerId);
            session.setProviderRole(providerRole);
            session.setProviderName(foundProviderName);

            // Populate citizen Name
            citizenRepository.findById(citizenId).ifPresent(c -> session.setCitizenName(c.getFullName()));

            return ResponseEntity.ok(chatSessionRepository.save(session));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating session: " + e.getMessage());
        }
    }

    // Get all sessions for current user (with name population workaround for legacy
    // data)
    @GetMapping("/my-sessions")
    public ResponseEntity<?> getMySessions(@RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        String role = extractUserRole(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        List<ChatSession> sessions;
        if ("CITIZEN".equalsIgnoreCase(role)) {
            sessions = chatSessionRepository.findByCitizenId(userId);
            // Workaround: Populate missing provider names
            for (ChatSession s : sessions) {
                if (s.getProviderName() == null || s.getProviderName().isEmpty()) {
                    if ("LAWYER".equalsIgnoreCase(s.getProviderRole())) {
                        lawyerRepository.findById(s.getProviderId())
                                .ifPresent(l -> {
                                    s.setProviderName(l.getFullName());
                                    chatSessionRepository.save(s);
                                });
                    } else if ("NGO".equalsIgnoreCase(s.getProviderRole())) {
                        ngoRepository.findById(s.getProviderId())
                                .ifPresent(n -> {
                                    s.setProviderName(n.getNgoName());
                                    chatSessionRepository.save(s);
                                });
                    }
                }
            }
        } else {
            sessions = chatSessionRepository.findByProviderIdAndProviderRole(userId, role.toUpperCase());
            // Workaround: Populate missing citizen names
            for (ChatSession s : sessions) {
                if (s.getCitizenName() == null || s.getCitizenName().isEmpty()) {
                    citizenRepository.findById(s.getCitizenId())
                            .ifPresent(c -> {
                                s.setCitizenName(c.getFullName());
                                chatSessionRepository.save(s);
                            });
                }
            }
        }
        return ResponseEntity.ok(sessions);
    }

    // Get message history for a session
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long sessionId) {
        return ResponseEntity.ok(chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId));
    }

    // Upload attachment
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            // Determine folder based on file type roughly, or just use generic
            // 'chat-attachments'
            String url;
            if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
                url = cloudinaryService.uploadImage(file, "chat/images");
            } else {
                url = cloudinaryService.uploadFile(file, "chat/documents");
            }
            return ResponseEntity.ok(java.util.Collections.singletonMap("url", url));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
        }
    }

    // WebSocket Message Handling
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);
        chatMessage.setEdited(false);
        chatMessage.setDeleted(false);
        ChatMessage saved = chatMessageRepository.save(chatMessage);

        // Update session with last message
        Optional<ChatSession> sessionOpt = chatSessionRepository.findById(chatMessage.getSessionId());
        if (sessionOpt.isPresent()) {
            ChatSession session = sessionOpt.get();
            session.setLastMessageId(saved.getId());
            String preview = saved.getContent();
            if (preview != null && preview.length() > 50) {
                preview = preview.substring(0, 47) + "...";
            }
            if (saved.getAttachmentUrl() != null) {
                preview = saved.getAttachmentType() != null && saved.getAttachmentType().equals("IMAGE") ? "📷 Photo" : "📎 Document";
            }
            session.setLastMessagePreview(preview);
            session.setLastMessageTime(saved.getTimestamp());
            session.setUpdatedAt(LocalDateTime.now());
            
            // Increment unread count for the other user (not the sender)
            // The unread count will be reset when the other user marks messages as read
            boolean isFromCitizen = String.valueOf(saved.getSenderId()).equals(String.valueOf(session.getCitizenId()));
            if (isFromCitizen) {
                // Message from citizen, increment unread for provider
                session.setUnreadCount((session.getUnreadCount() != null ? session.getUnreadCount() : 0) + 1);
            } else {
                // Message from provider, increment unread for citizen
                session.setUnreadCount((session.getUnreadCount() != null ? session.getUnreadCount() : 0) + 1);
            }
            chatSessionRepository.save(session);
        }

        // Broadcast to the specific session topic
        messagingTemplate.convertAndSend("/topic/session." + chatMessage.getSessionId(), saved);
    }

    @MessageMapping("/chat.editMessage")
    public void editMessage(@Payload ChatMessage chatMessage) {
        Optional<ChatMessage> existing = chatMessageRepository.findById(chatMessage.getId());
        if (existing.isPresent()) {
            ChatMessage msg = existing.get();
            msg.setContent(chatMessage.getContent());
            msg.setEdited(true);
            msg.setEditedAt(LocalDateTime.now());
            ChatMessage saved = chatMessageRepository.save(msg);

            // Broadcast the update (frontend will identify by ID)
            messagingTemplate.convertAndSend("/topic/session." + saved.getSessionId(), saved);
        }
    }

    @MessageMapping("/chat.markAsRead")
    public void markAsRead(@Payload Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Integer readerId = Integer.valueOf(payload.get("readerId").toString());

        List<ChatMessage> unread = chatMessageRepository.findBySessionIdAndSenderIdNotAndIsReadFalse(sessionId,
                readerId);
        if (!unread.isEmpty()) {
            for (ChatMessage m : unread) {
                m.setRead(true);
            }
            chatMessageRepository.saveAll(unread);

            // Broadcast a "READ_RECEIPT" signal
            Map<String, Object> receipt = Map.of(
                    "type", "READ_RECEIPT",
                    "sessionId", sessionId,
                    "readerId", readerId);
            messagingTemplate.convertAndSend("/topic/session." + sessionId, receipt);
        }
    }

    // REST endpoint to mark messages as read (useful when first opening a chat)
    @PatchMapping("/sessions/{sessionId}/read")
    public ResponseEntity<?> markMessagesRead(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<ChatMessage> unread = chatMessageRepository.findBySessionIdAndSenderIdNotAndIsReadFalse(sessionId, userId);
        if (!unread.isEmpty()) {
            unread.forEach(m -> m.setRead(true));
            chatMessageRepository.saveAll(unread);

            // Reset unread count for the session
            Optional<ChatSession> sessionOpt = chatSessionRepository.findById(sessionId);
            if (sessionOpt.isPresent()) {
                ChatSession session = sessionOpt.get();
                session.setUnreadCount(0);
                chatSessionRepository.save(session);
            }

            // Also notify via socket if possible
            Map<String, Object> receipt = Map.of(
                    "type", "READ_RECEIPT",
                    "sessionId", sessionId,
                    "readerId", userId);
            messagingTemplate.convertAndSend("/topic/session." + sessionId, receipt);
        }
        return ResponseEntity.ok().build();
    }

    // Delete message
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long messageId,
            @RequestHeader("Authorization") String authHeader) {
        Integer userId = extractUserId(authHeader);
        if (userId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<ChatMessage> msgOpt = chatMessageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChatMessage msg = msgOpt.get();
        // Only allow sender to delete
        if (!msg.getSenderId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own messages");
        }

        msg.setDeleted(true);
        msg.setDeletedAt(LocalDateTime.now());
        msg.setContent("This message was deleted");
        ChatMessage saved = chatMessageRepository.save(msg);

        // Broadcast the update
        messagingTemplate.convertAndSend("/topic/session." + msg.getSessionId(), saved);
        return ResponseEntity.ok(saved);
    }

    // Typing indicator
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Integer userId = Integer.valueOf(payload.get("userId").toString());
        Boolean isTyping = Boolean.valueOf(payload.get("isTyping").toString());

        Map<String, Object> typingEvent = Map.of(
                "type", "TYPING",
                "sessionId", sessionId,
                "userId", userId,
                "isTyping", isTyping
        );
        messagingTemplate.convertAndSend("/topic/session." + sessionId, typingEvent);
    }

    // Presence status (online/offline)
    @MessageMapping("/chat.presence")
    public void handlePresence(@Payload Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Integer userId = Integer.valueOf(payload.get("userId").toString());
        Boolean isOnline = Boolean.valueOf(payload.get("isOnline").toString());

        Map<String, Object> presenceEvent = Map.of(
                "type", "PRESENCE",
                "sessionId", sessionId,
                "userId", userId,
                "isOnline", isOnline
        );
        messagingTemplate.convertAndSend("/topic/session." + sessionId, presenceEvent);
    }
}

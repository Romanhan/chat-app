package com.romanhan.chatapp.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.romanhan.chatapp.service.UserService;

@Component
public class WebSocketEventListener {

    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(UserService userService, SimpMessagingTemplate messagingTemplate) {
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // Read username from STOMP CONNECT frame headers
        String username = headerAccessor.getFirstNativeHeader("username");
        String sessionId = headerAccessor.getSessionId();

        System.out.println("🔍 Session ID: " + sessionId);
        System.out.println("🔍 Username from STOMP header: " + username);

        if (username == null || username.trim().isEmpty()) {
            System.out.println("❌ Username not found in STOMP headers");
            return;
        }

        System.out.println("✅ User connected: " + username + " (session: " + sessionId + ")");

        // Store username in session attributes for later use
        headerAccessor.getSessionAttributes().put("username", username);

        // Add user and broadcast updated online users list
        userService.addUser(sessionId, username);
        messagingTemplate.convertAndSend("/topic/onlineUsers", userService.getOnlineUsernames());
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (sessionId != null) {
            // Retrieve username from session attributes
            String username = (String) headerAccessor.getSessionAttributes().get("username");

            System.out.println("🔌 User disconnected: " + username + " (session: " + sessionId + ")");

            // Remove user from online list
            userService.removeUser(sessionId);

            // Broadcast updated online users list
            messagingTemplate.convertAndSend("/topic/onlineUsers", userService.getOnlineUsernames());
        }
    }

}

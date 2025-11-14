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

        String username = headerAccessor.getFirstNativeHeader("username");
        String sessionId = headerAccessor.getSessionId();

        if (username == null || username.trim().isEmpty()) {
            return;
        }

        headerAccessor.getSessionAttributes().put("username", username);

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

            userService.removeUser(sessionId);

            // Broadcast updated online users list
            messagingTemplate.convertAndSend("/topic/onlineUsers", userService.getOnlineUsernames());
        }
    }

}

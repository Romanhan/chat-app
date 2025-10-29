package com.romanhan.chatapp.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
        SimpMessageHeaderAccessor header = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = header.getFirstNativeHeader("username");
        String sessionId = header.getSessionId();

        if (username != null) {
            userService.addUser(sessionId, username);
            messagingTemplate.convertAndSend("/topic/onlineUsers", userService.getOnlineUsernames());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor header = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = header.getSessionId();

        if (sessionId != null) {
            userService.removeUser(sessionId);
            messagingTemplate.convertAndSend("/topic/onlineUsers", userService.getOnlineUsernames());
        }
    }

}

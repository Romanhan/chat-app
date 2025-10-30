package com.romanhan.chatapp.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final Map<String, String> onlineUsers = new ConcurrentHashMap<>();

    public void addUser(String sessionId, String username) {
        onlineUsers.put(sessionId, username);
    }

    public void removeUser(String sessionId) {
        onlineUsers.remove(sessionId);
    }

    public List<String> getOnlineUsernames() {
        return onlineUsers.values().stream().distinct().toList();
    }

    public boolean isUserOnline(String username) {
        return onlineUsers.containsValue(username);
    }
}

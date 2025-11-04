package com.romanhan.chatapp.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.service.MessageService;
import com.romanhan.chatapp.service.UserService;

@RestController
@RequestMapping("/api")
public class ChatRestController {

    private final MessageService messageService;
    private final UserService userService;

    public ChatRestController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }

    @GetMapping("/messages")
    public Iterable<Message> getMessages() {
        return messageService.getAllMessages();
    }

    @GetMapping("/online-users")
    public List<String> getOnlineUsers() {
        return userService.getOnlineUsernames();
    }

    @PutMapping("/messages/{id}")
    public ResponseEntity<?> editMessage(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newText = payload.get("text");
        String sender = payload.get("sender");

        Message message = messageService.findById(id).orElse(null);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }

        if (!message.getSender().equals(sender)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (message.isDeleted()) {
            return ResponseEntity.badRequest().body("Cannot edit a deleted message.");
        }

        message.setText(newText);
        message.setEdited(true);
        message.setEditedAt(LocalDateTime.now());

        Message savedMessage = messageService.saveMessage(message);

        return ResponseEntity.ok(savedMessage);

    }
}
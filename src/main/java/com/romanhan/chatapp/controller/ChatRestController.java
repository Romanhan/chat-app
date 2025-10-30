package com.romanhan.chatapp.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
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
}
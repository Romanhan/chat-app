package com.romanhan.chatapp.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.service.MessageService;

@RestController
@RequestMapping("/api")
public class ChatRestController {

    private final MessageService messageService;

    public ChatRestController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/messages")
    public Iterable<Message> getMessages() {
        return messageService.getAllMessages();
    }
}
package com.romanhan.chatapp.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.RestController;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.service.MessageService;

import jakarta.validation.Valid;

@RestController
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public Message sendMessage(@Valid Message message) {
        messageService.saveMessage(message);
        return message;
    }

    @MessageMapping("/typing")
    @SendTo("/topic/typing")
    public String handleTyping(@Valid String username) {
        return username;
    }
}

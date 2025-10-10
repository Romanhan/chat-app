package com.romanhan.chatapp.service;

import org.springframework.stereotype.Service;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.repository.MessageRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public void saveMessage(Message message) {
        messageRepository.save(message);
    }

    public Iterable<Message> getAllMessages() {
        return messageRepository.findAll();
    }
}

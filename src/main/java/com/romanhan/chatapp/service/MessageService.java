package com.romanhan.chatapp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.repository.MessageRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    public Iterable<Message> getAllMessages() {
        return messageRepository.findAll();
    }

    public Optional<Message> findById(Long id) {
        return messageRepository.findById(id);
    }
}

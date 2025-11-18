package com.romanhan.chatapp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.repository.MessageRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public @NonNull Message saveMessage(@NonNull Message message) {
        return messageRepository.save(message);
    }

    public Iterable<Message> getRecentMessages() {
        return messageRepository.findTop50ByOrderByTimestampDesc();
    }

    public Optional<Message> findById(@NonNull Long id) {
        return messageRepository.findById(id);
    }
}

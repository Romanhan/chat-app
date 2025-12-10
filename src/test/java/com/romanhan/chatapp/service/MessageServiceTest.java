package com.romanhan.chatapp.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.repository.MessageRepository;

@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

    @Mock
    MessageRepository messageRepository;
    @InjectMocks
    MessageService messageService;
    Message message;
    Message message2;
    Message message3;
    List<Message> messages;

    @BeforeEach
    public void setUp() {
        message = new Message();
        message.setId(1L);
        message.setSender("Roman");
        message.setText("Hello, World!");

        message2 = new Message();
        message2.setId(2L);
        message2.setSender("Alice");
        message2.setText("Hi, Roman!");

        message3 = new Message();
        message3.setId(3L);
        message3.setSender("Bob");
        message3.setText("Good morning!");

        messages = new ArrayList<>();
        messages.add(message);
        messages.add(message2);
        messages.add(message3);
    }

    @Test
    public void testSaveMessage() {
        // Given
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        // When
        Message savedMessage = messageService.saveMessage(message);

        // Then
        assertEquals(message.getId(), savedMessage.getId());
        assertEquals(message.getSender(), savedMessage.getSender());
        assertEquals(message.getText(), savedMessage.getText());
        verify(messageRepository).save(message);
    }

    @Test
    public void testGetRecentMessages() {
        // When
        when(messageRepository.findTop50ByOrderByTimestampDesc()).thenReturn(messages);
        Iterable<Message> result = messageService.getRecentMessages();
        List<Message> recentMessages = StreamSupport.stream(result.spliterator(), false).toList();

        // Then
        assertNotNull(recentMessages);
        assertEquals(3, recentMessages.size());
        assertEquals("Hello, World!", recentMessages.get(0).getText());
        assertEquals("Hi, Roman!", recentMessages.get(1).getText());
        assertEquals("Good morning!", recentMessages.get(2).getText());
    }

    @Test
    public void testFindById() {
        // Given
        when(messageRepository.findById(1L)).thenReturn(Optional.of(message));
        // When
        Optional<Message> foundMessage = messageService.findById(1L);
        // Then
        assertTrue(foundMessage.isPresent());
        assertEquals(message.getId(), foundMessage.get().getId());

    }

    @Test
    public void testFindById_NotExists() {
        // Given
        when(messageRepository.findById(20L)).thenReturn(Optional.empty());
        // When
        Optional<Message> foundMessage = messageService.findById(20L);
        // Then
        assertTrue(foundMessage.isEmpty());
    }
}

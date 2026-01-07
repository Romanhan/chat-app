package com.romanhan.chatapp.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.romanhan.chatapp.model.Message;
import com.romanhan.chatapp.service.MessageService;
import com.romanhan.chatapp.service.UserService;

@WebMvcTest(ChatRestController.class)
public class ChatRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MessageService messageService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    private Message message;
    private Message otherUserMessage;

    @BeforeEach
    public void setUp() {
        message = new Message();
        message.setId(1L);
        message.setSender("Roman");
        message.setText("Hello, World!");
        message.setDeleted(false);
        message.setEdited(false);

        otherUserMessage = new Message();
        otherUserMessage.setId(2L);
        otherUserMessage.setSender("Alice");
        otherUserMessage.setText("Other's message");
        otherUserMessage.setDeleted(false);
    }

    @Test
    public void testEditMessage_Success() throws Exception {
        when(messageService.findById(1L)).thenReturn(Optional.of(message));
        when(messageService.saveMessage(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/messages/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"Updated\",\"sender\":\"Roman\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated"))
                .andExpect(jsonPath("$.edited").value(true));
    }

    @Test
    public void testEditMessage_Forbidden() throws Exception {
        when(messageService.findById(2L)).thenReturn(Optional.of(otherUserMessage));

        mockMvc.perform(put("/api/messages/2")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"Hacked\",\"sender\":\"Roman\"}"))
                .andExpect(status().isForbidden());

        verify(messageService, never()).saveMessage(any(Message.class));
    }

    @Test
    public void testDeleteMessage_Success() throws Exception {
        when(messageService.findById(1L)).thenReturn(Optional.of(message));
        when(messageService.saveMessage(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/messages/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sender\":\"Roman\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true));
    }

    @Test
    public void testDeleteMessage_Forbidden() throws Exception {
        when(messageService.findById(2L)).thenReturn(Optional.of(otherUserMessage));

        mockMvc.perform(delete("/api/messages/2")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sender\":\"Roman\"}"))
                .andExpect(status().isForbidden());

        verify(messageService, never()).saveMessage(any(Message.class));
    }

}

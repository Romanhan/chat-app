package com.romanhan.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.romanhan.chatapp.model.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
}

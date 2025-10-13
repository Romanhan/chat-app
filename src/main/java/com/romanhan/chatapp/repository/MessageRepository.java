package com.romanhan.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.romanhan.chatapp.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
}

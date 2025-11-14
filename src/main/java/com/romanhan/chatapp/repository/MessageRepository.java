package com.romanhan.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.romanhan.chatapp.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    public List<Message> findTop50ByOrderByTimestampDesc();
}

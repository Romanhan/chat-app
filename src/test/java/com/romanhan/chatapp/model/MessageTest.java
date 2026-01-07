package com.romanhan.chatapp.model;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import static org.assertj.core.api.Assertions.assertThat;

public class MessageTest {
    private Validator validator;

    @BeforeEach
    public void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    public void testValidMessage() {
        // Given
        Message message = new Message();
        message.setSender("Roman");
        message.setText("Hello, World!");

        // When
        Set<ConstraintViolation<Message>> violations = validator.validate(message);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    void testValidateMessage_TextTooLong() {
        // Given
        Message message = new Message();
        message.setSender("Roman");
        message.setText("A".repeat(301));

        // When
        Set<ConstraintViolation<Message>> violations = validator.validate(message);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("text");
        assertThat(violations.iterator().next().getMessage()).contains("must be between");
    }

    @Test
    void testValidateMessage_TextBlank() {
        // Given
        Message message = new Message();
        message.setSender("Roman");
        message.setText(""); // Empty

        // When
        Set<ConstraintViolation<Message>> violations = validator.validate(message);

        // Then
        assertThat(violations).hasSizeGreaterThanOrEqualTo(1);
        violations.forEach(v -> {
            if (v.getPropertyPath().toString().equals("text")) {
                assertThat(v.getMessage()).matches("(must not be blank|size must be between .*?)");
            }
        });
    }

    @Test
    void testValidateMessage_SenderTooLong() {
        // Given
        Message message = new Message();
        message.setSender("A".repeat(21)); // Exceeds max 20
        message.setText("Hello");

        // When
        Set<ConstraintViolation<Message>> violations = validator.validate(message);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("sender");
    }

    @Test
    void testValidateMessage_SenderBlank() {
        // Given
        Message message = new Message();
        message.setSender(""); // Empty
        message.setText("Hello");

        // When
        Set<ConstraintViolation<Message>> violations = validator.validate(message);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("sender");
    }
}

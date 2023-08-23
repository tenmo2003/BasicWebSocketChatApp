package com.example.demo.chat;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {
    @Autowired
    private SimpMessagingTemplate messageTemplate;
    public static List<String> users = new ArrayList<>();
    
    @MessageMapping("/chat.sendMessage")
    @SendTo("/global/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        return chatMessage;
    }
    
    @MessageMapping("/private-message")
    public ChatMessage privateMessage(@Payload ChatMessage chatMessage) {
        messageTemplate.convertAndSendToUser(chatMessage.getReceiver(), "/private", chatMessage);

        return chatMessage;
    }
    
    @MessageMapping("/chat.addUser")
    @SendTo("/global/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        users.add(chatMessage.getSender() + users.size() + 1);
        var tmpChatMessage = ChatMessage.builder().type(MessageType.JOIN).sender(chatMessage.getSender()).build();
        messageTemplate.convertAndSend("/onlineUsers", tmpChatMessage);
        return chatMessage;
    }


}

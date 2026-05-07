"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import * as types from "@/lib/types";
import * as api from "@/lib/api";
import * as crypto from "@/lib/crypto";

interface ConversationViewProps {
  selectedUserId: string;
}

interface DisplayedMessage extends types.DecryptedMessage {}

export function ConversationView({ selectedUserId }: ConversationViewProps) {
  const { user, token, logout } = useAuth();
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipientUser, setRecipientUser] = useState<types.User | null>(null);
  const [usersCache, setUsersCache] = useState<Map<string, types.User>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessagesRef = useRef<DisplayedMessage[]>([]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    const loadUsersAndRecipient = async () => {
      try {
        const allUsers = await api.listUsers(token);
        const cache = new Map(allUsers.map((u) => [u.id, u]));
        setUsersCache(cache);

        const recipient = cache.get(selectedUserId);
        setRecipientUser(recipient || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load users";
        console.error("Failed to load users:", err);
        if (errorMessage.includes("Invalid token")) {
          logout();
        }
      }
    };

    loadUsersAndRecipient();
  }, [selectedUserId, token, logout]);

  useEffect(() => {
    if (!token || !user) return;

    const loadMessages = async () => {
      try {
        const encryptedMessages = await api.getConversation(token, selectedUserId);
        const privateKey = await crypto.getPrivateKey();

        if (!privateKey) {
          setError("Private key not found. Cannot decrypt messages.");
          return;
        }

        const decrypted: DisplayedMessage[] = [];

        for (const msg of encryptedMessages) {
          try {
            let decryptedContent: string;
            let senderUsername: string;

            const senderInfo = usersCache.get(msg.senderId);
            senderUsername = senderInfo?.username || "Unknown";

            if (msg.senderId === user.id) {
              const existingMessage = latestMessagesRef.current.find((m) => m.id === msg.id);
              if (
                existingMessage &&
                existingMessage.content !== "[Failed to decrypt]" &&
                existingMessage.content !== "[Sent message - content not available]"
              ) {
                decryptedContent = existingMessage.content;
              } else {
                decryptedContent = "[Sent message - content not available]";
              }
            } else {
              const decryptedSymKeyBuffer = await crypto.decryptWithPrivateKey(
                crypto.base64ToArrayBuffer(msg.encryptedSymmetricKey),
                privateKey
              );
              const symmetricKey = await crypto.importSymmetricKey(decryptedSymKeyBuffer);
              decryptedContent = await crypto.decryptMessage(
                msg.encryptedContent,
                msg.encryptedContentIv,
                symmetricKey
              );
            }

            decrypted.push({
              id: msg.id,
              senderId: msg.senderId,
              senderUsername,
              content: decryptedContent,
              timestamp: msg.timestamp,
              read: msg.read,
            });
          } catch (err) {
            console.error("Failed to decrypt message:", err);
            const senderInfo = usersCache.get(msg.senderId);
            decrypted.push({
              id: msg.id,
              senderId: msg.senderId,
              senderUsername: senderInfo?.username || "Unknown",
              content: "[Failed to decrypt]",
              timestamp: msg.timestamp,
              read: msg.read,
            });
          }
        }

        const mergedMessages = new Map<string, DisplayedMessage>();
        latestMessagesRef.current.forEach((msg) => mergedMessages.set(msg.id, msg));
        decrypted.forEach((msg) => {
          if (!mergedMessages.has(msg.id)) {
            mergedMessages.set(msg.id, msg);
          }
        });

        setMessages(
          Array.from(mergedMessages.values()).sort((a, b) => a.timestamp - b.timestamp)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load messages";
        setError(errorMessage);
        if (errorMessage.includes("Invalid token")) {
          logout();
        }
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [token, selectedUserId, usersCache, user, logout]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !token || !user) return;

    setError("");
    setIsLoading(true);

    try {
      const recipientPublicKey = await api.getUserPublicKey(selectedUserId);
      const symmetricKey = await crypto.generateSymmetricKey();
      const { ciphertext, iv } = await crypto.encryptMessage(messageText, symmetricKey);
      const symmetricKeyBuffer = await crypto.exportSymmetricKey(symmetricKey);
      const encryptedSymKey = await crypto.encryptWithPublicKey(symmetricKeyBuffer, recipientPublicKey);

      const sendResponse = await api.sendMessage(
        token,
        selectedUserId,
        crypto.arrayBufferToBase64(encryptedSymKey),
        ciphertext,
        iv
      );

      if (!sendResponse.message) {
        throw new Error("Failed to send message");
      }

      const newMessage: DisplayedMessage = {
        id: sendResponse.message.id,
        senderId: user.id,
        senderUsername: user.username,
        content: messageText,
        timestamp: sendResponse.message.timestamp,
        read: true,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage].sort((a, b) => a.timestamp - b.timestamp));
      setMessageText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-main">
      <div className="chat-main-header">
        <div className="chat-avatar small">
          {recipientUser?.username?.charAt(0).toUpperCase() || selectedUserId?.charAt(0).toUpperCase()}
        </div>
        <div className="chat-info">
          <div className="chat-name">
            <span>{recipientUser?.username || selectedUserId}</span>
          </div>
          <div className="online-status">End-to-End Encrypted</div>
        </div>
      </div>

      {error && <div className="auth-message error mx-4 mt-4">{error}</div>}

      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="no-chat-selected">
            <div className="icon">💬</div>
            <h2>No messages yet</h2>
            <p>Start the conversation by sending a secure message.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`message-row ${isSent ? "sent" : "received"}`}>
                <div className="message-bubble">
                  {!isSent && <div className="message-sender">{msg.senderUsername}</div>}
                  <div className="message-text">{msg.content}</div>
                  <div className="message-meta">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isSent && <span className="message-status">✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write a message..."
          disabled={isLoading}
          className="message-input"
        />
        <button type="submit" disabled={isLoading || !messageText.trim()} className="send-btn">
          ➤
        </button>
      </form>
    </div>
  );
}

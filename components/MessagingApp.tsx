"use client";

import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AdminPanel } from "./AdminPanel";
import * as types from "@/lib/types";
import * as api from "@/lib/api";
import { ConversationView } from "./ConversationView";

export function MessagingApp() {
  const { user, token, logout } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<types.User[]>([]);
  const [conversations, setConversations] = useState<types.Conversation[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const fetchedUsers = await api.listUsers(token);
        setUsers(fetchedUsers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load users";
        setError(errorMessage);
        if (errorMessage.includes("Invalid token")) {
          logout();
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    const loadConversations = async () => {
      try {
        const convs = await api.getConversations(token);
        setConversations(convs);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load conversations";
        setError(errorMessage);
        if (errorMessage.includes("Invalid token")) {
          logout();
        }
      }
    };

    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [token, logout]);

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUsername = (userId: string) => {
    return users.find((u) => u.id === userId)?.username || userId;
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search chats or users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="chat-list">
          {error && <div className="auth-message error mx-4 my-3">{error}</div>}

          {conversations.length > 0 && (
            <>
              <div className="chat-section-title">Recent chats</div>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`chat-item ${selectedUserId === conv.otherUserId ? "active" : ""}`}
                  onClick={() => setSelectedUserId(conv.otherUserId)}
                >
                  <div className="chat-avatar">{getUsername(conv.otherUserId).charAt(0).toUpperCase()}</div>
                  <div className="chat-info">
                    <div className="chat-name">
                      <span>{getUsername(conv.otherUserId)}</span>
                      <span className="chat-time">
                        {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="chat-preview">
                      {conv.lastMessage ? `${conv.lastMessage.encryptedContent.substring(0, 30)}...` : "No messages yet"}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="chat-section-title">Contacts</div>
          {isLoadingUsers ? (
            <div className="text-white/70 p-4">Loading users...</div>
          ) : (
            filteredUsers.map((u) => {
              if (u.id === user.id) return null;
              return (
                <div
                  key={u.id}
                  className={`chat-item ${selectedUserId === u.id ? "active" : ""}`}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <div className="chat-avatar">{u.username.charAt(0).toUpperCase()}</div>
                  <div className="chat-info">
                    <div className="chat-name">
                      <span>{u.username}</span>
                      <span className="chat-time">{u.email}</span>
                    </div>
                    <div className="chat-preview private">Private chat</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-main">
        {user.isAdmin && <AdminPanel />}
        {selectedUserId ? (
          <ConversationView selectedUserId={selectedUserId} />
        ) : (
          <div className="no-chat-selected">
            <div className="icon">💬</div>
            <h2>Monarchs Messenger</h2>
            <p>Select a contact to start messaging securely.</p>
          </div>
        )}
      </div>
    </div>
  );
}

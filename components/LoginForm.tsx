"use client";

import React, { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Welcome Back</h2>

      {error && <div className="auth-message error">{error}</div>}

      <label>
        <span className="auth-label">
          <Mail className="auth-icon" /> Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
          placeholder="Enter your email"
          disabled={isLoading}
        />
      </label>

      <label>
        <span className="auth-label">
          <Lock className="auth-icon" /> Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
          placeholder="Enter your password"
          disabled={isLoading}
        />
      </label>

      <button type="submit" disabled={isLoading} className="auth-btn">
        <LogIn className="auth-icon" />
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <button
        type="button"
        className="auth-btn secondary"
        onClick={onSwitchToRegister}
      >
        Create Account
      </button>
    </form>
  );
}

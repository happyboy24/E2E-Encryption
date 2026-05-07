"use client";

import React, { useState } from "react";
import { Mail, Lock, UserPlus } from "lucide-react";
import { useAuth } from "./AuthContext";
import { generateKeyPair } from "@/lib/crypto";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  isAdmin?: boolean;
}

export function RegisterForm({ onSwitchToLogin, isAdmin = false }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, registerAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { publicKey } = await generateKeyPair();
      if (isAdmin) {
        await registerAdmin(username, email, password, publicKey);
      } else {
        await register(username, email, password, publicKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{isAdmin ? "🔐 Create Admin Account" : "Create Your Account"}</h2>

      {error && <div className="auth-message error">{error}</div>}

      <label>
        <span className="auth-label">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="auth-input"
          placeholder="Choose a username"
          disabled={isLoading}
        />
      </label>

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
          placeholder="Enter a password"
          disabled={isLoading}
        />
      </label>

      <label>
        <span className="auth-label">
          <Lock className="auth-icon" /> Confirm Password
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="auth-input"
          placeholder="Confirm your password"
          disabled={isLoading}
        />
      </label>

      <button type="submit" disabled={isLoading} className="auth-btn">
        <UserPlus className="auth-icon" />
        {isLoading ? "Creating account..." : "Create Account"}
      </button>

      <button
        type="button"
        className="auth-btn secondary"
        onClick={onSwitchToLogin}
      >
        Back to Login
      </button>
    </form>
  );
}

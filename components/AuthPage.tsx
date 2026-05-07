"use client";

import React, { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="icon">👑</div>
          <h1>Monarchs</h1>
          <p>Secure Chat Messenger</p>
        </div>

        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <>
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={isAdminRegister}
                  onChange={(e) => setIsAdminRegister(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Register as Admin</span>
              </label>
            </div>
            <RegisterForm 
              onSwitchToLogin={() => setIsLogin(true)} 
              isAdmin={isAdminRegister}
            />
          </>
        )}
      </div>
    </div>
  );
}

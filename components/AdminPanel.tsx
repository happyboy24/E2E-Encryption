'use client';

import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";


interface AdminUser {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  isAdmin?: boolean;
}

export function AdminPanel() {
  const { user, token } = useAuth();


  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.isAdmin]);


  async function fetchUsers() {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setSuccess('User deleted successfully');
      await fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting user');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllUsers() {
    if (!token) return;
    if (!confirm('Are you sure you want to delete ALL users? This cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all users');
      }

      const data = await response.json();
      setSuccess(`${data.deletedCount} users deleted`);
      setUsers([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting users');
    } finally {
      setLoading(false);
    }
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div style={{ 
      padding: '20px', 

      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '2px solid #ff6b6b'
    }}>
      <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>🔐 Admin Panel</h2>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px',
          backgroundColor: '#efe',
          color: '#060',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Users Management</h3>
        <p>Total users: <strong>{users.length}</strong></p>

        {loading && <p>Loading...</p>}

        {users.length === 0 ? (
          <p style={{ color: '#666' }}>No users registered</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Username</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Role</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Registered</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>
                      <strong>{u.username}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: u.isAdmin ? '#ff6b6b' : '#4ecdc4',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {user?.id !== u.id && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ff6b6b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        marginTop: '20px'
      }}>
        <button
          onClick={deleteAllUsers}
          disabled={loading || users.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🗑️ Delete All Users
        </button>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          Warning: This action deletes all users and their messages permanently.
        </p>
      </div>
    </div>
  );
}

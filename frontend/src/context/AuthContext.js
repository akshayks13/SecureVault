'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingUsername, setPendingUsernameState] = useState(null);

    // Wrapper to persist pendingUsername to sessionStorage
    const setPendingUsername = (username) => {
        if (username) {
            sessionStorage.setItem('pendingUsername', username);
        } else {
            sessionStorage.removeItem('pendingUsername');
        }
        setPendingUsernameState(username);
    };

    useEffect(() => {
        // Restore pendingUsername from sessionStorage on mount
        const storedUsername = sessionStorage.getItem('pendingUsername');
        if (storedUsername) {
            setPendingUsernameState(storedUsername);
        }

        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data);
            setPendingUsername(null);
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await authAPI.login(username, password);
        localStorage.setItem('token', response.data.access_token);
        await fetchUser();
        return response.data;
    };

    const register = async (username, password) => {
        const response = await authAPI.register(username, password);
        setPendingUsername(username);
        return response.data;
    };

    const verifyOTP = async (otp) => {
        const username = pendingUsername || sessionStorage.getItem('pendingUsername');
        if (!username) {
            throw new Error('No pending registration');
        }
        const response = await authAPI.verifyOTP(username, otp);
        localStorage.setItem('token', response.data.access_token);
        setPendingUsername(null);
        await fetchUser();
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setPendingUsername(null);
    };

    const value = {
        user,
        loading,
        pendingUsername: pendingUsername || (typeof window !== 'undefined' ? sessionStorage.getItem('pendingUsername') : null),
        login,
        verifyOTP,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

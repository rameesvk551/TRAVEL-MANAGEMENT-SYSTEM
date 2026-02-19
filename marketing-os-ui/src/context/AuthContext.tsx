import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenantName: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true
    });

    useEffect(() => {
        // Initialize from local storage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setState({
                    token: storedToken,
                    user: JSON.parse(storedUser),
                    isAuthenticated: true,
                    isLoading: false
                });
            } catch (e) {
                console.error('Failed to parse user from local storage', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setState(s => ({ ...s, isLoading: false }));
            }
        } else {
            setState(s => ({ ...s, isLoading: false }));
        }
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setState({
            token,
            user,
            isAuthenticated: true,
            isLoading: false
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false
        });
        // Optional: Redirect to login page or reload
        window.location.href = '/login';
    };

    const updateUser = (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        setState(prev => ({ ...prev, user }));
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

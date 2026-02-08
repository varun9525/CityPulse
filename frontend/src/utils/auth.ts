export const auth = {
    getToken: () => localStorage.getItem('citypulse_token'),
    setToken: (token: string) => localStorage.setItem('citypulse_token', token),
    clearToken: () => {
        localStorage.removeItem('citypulse_token');
        localStorage.removeItem('citypulse_user');
    },
    getUser: () => {
        const userStr = localStorage.getItem('citypulse_user');
        return userStr ? JSON.parse(userStr) : null;
    },
    setUser: (user: any) => localStorage.setItem('citypulse_user', JSON.stringify(user)),
    isAuthenticated: () => !!localStorage.getItem('citypulse_token')
};

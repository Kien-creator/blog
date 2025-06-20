import { defineStore } from 'pinia';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.role === 'admin',
    isLocked: (state) => state.profile?.isLocked || false
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        await this.fetchProfile();
        return userCredential;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.profile = null;
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    async fetchProfile() {
      if (!this.user) return;
      try {
        const token = await this.user.getIdToken();
        const response = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.profile = response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to basic profile if API fails
        this.profile = {
          uid: this.user.uid,
          email: this.user.email,
          displayName: this.user.displayName || this.user.email.split('@')[0],
          role: 'user'
        };
      }
    },

    initAuthListener() {
      onAuthStateChanged(auth, async (user) => {
        this.user = user;
        if (user) {
          await this.fetchProfile();
        } else {
          this.profile = null;
        }
      });
    }
  }
});

// Setup axios interceptor
axios.interceptors.request.use(async (config) => {
  const authStore = useAuthStore();
  if (authStore.user) {
    const token = await authStore.user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
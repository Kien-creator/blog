<template>
  <div class="col-md-6 mx-auto mt-5">
    <div class="card shadow">
      <div class="card-body">
        <h2 class="card-title text-center mb-4">Login</h2>
        <form @submit.prevent="login">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" v-model.trim="form.email" id="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" v-model="form.password" id="password" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="authStore.loading">
            {{ authStore.loading ? 'Logging in...' : 'Login' }}
          </button>
          <div v-if="authStore.error" class="alert alert-danger mt-3">{{ authStore.error }}</div>
        </form>
        <div class="text-center mt-3">
          <router-link to="/forgotten-password" class="text-decoration-none">Forgot Password?</router-link>
          <span class="mx-2">|</span>
          <router-link to="/register" class="text-decoration-none">Create an Account</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();
const form = ref({
  email: '',
  password: '',
});

const login = async () => {
  try {
    await authStore.login(form.value.email, form.value.password);
    router.push('/');
  } catch (error) {
    console.error('Login error:', error);
  }
};
</script>
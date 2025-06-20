<template>
  <div class="col-md-6 mx-auto mt-5">
    <h2>Register</h2>
    <form @submit.prevent="register">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" v-model.trim="form.email" id="email" class="form-control" required />
      </div>
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" v-model.trim="form.username" id="username" class="form-control" required minlength="3" />
      </div>
      <div class="mb-3">
        <label for="displayName" class="form-label">Display Name</label>
        <input type="text" v-model.trim="form.displayName" id="displayName" class="form-control" required minlength="3" />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" v-model="form.password" id="password" class="form-control" required minlength="6" />
      </div>
      <div class="mb-3">
        <label for="confirmPassword" class="form-label">Confirm Password</label>
        <input type="password" v-model="form.confirmPassword" id="confirmPassword" class="form-control" required minlength="6" />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>
      <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
    </form>
    <p class="mt-3">
      Already have an account? <router-link to="/login">Login</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({
  email: '',
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
});
const loading = ref(false);
const error = ref(null);

const register = async () => {
  if (!form.value.email || !form.value.username || !form.value.displayName || !form.value.password) {
    error.value = 'All fields are required';
    return;
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }
  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters';
    return;
  }
  if (form.value.username.length < 3 || form.value.displayName.length < 3) {
    error.value = 'Username and Display Name must be at least 3 characters';
    return;
  }

  loading.value = true;
  error.value = null;
  const payload = {
    email: form.value.email,
    username: form.value.username,
    displayName: form.value.displayName,
    password: form.value.password,
  };
  console.log('Sending registration data:', payload);
  try {
    const response = await axios.post('/api/auth/register', payload, {
      timeout: 5000,
    });
    console.log('Registration response:', response.data);
    alert('Registration successful! Please login.');
    router.push('/login');
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
    error.value = errorMessage;
    console.error('Registration error:', err.message, 'Response:', err.response?.data, 'Code:', err.code);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.mt-5 {
  margin-top: 3rem;
}
</style>
<template>
  <div class="col-md-6 mx-auto">
    <h2>Forgot Password</h2>
    <form @submit.prevent="resetPassword">
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" v-model="email" id="email" class="form-control" required />
      </div>
      <button type="submit" class="btn btn-primary">Send Reset Link</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const email = ref('');

const resetPassword = async () => {
  try {
    await axios.post('/api/auth/forgot-password', { email: email.value });
    alert('Password reset link sent to your email.');
  } catch (error) {
    alert(error.response?.data?.message || 'Error sending reset link');
  }
};
</script>
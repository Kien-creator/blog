<template>
  <div class="container">
    <h2>{{ isEditing ? 'Edit Post' : 'Create Post' }}</h2>
    <form @submit.prevent="submitPost">
      <div class="mb-3">
        <label for="title" class="form-label">Title</label>
        <input v-model="form.title" type="text" class="form-control" id="title" required>
      </div>
      <div class="mb-3">
        <label for="content" class="form-label">Content</label>
        <textarea v-model="form.content" class="form-control" id="content" rows="6" required></textarea>
      </div>
      <div class="mb-3">
        <label for="excerpt" class="form-label">Excerpt</label>
        <input v-model="form.excerpt" type="text" class="form-control" id="excerpt" required>
      </div>
      <div class="mb-3">
        <label for="category" class="form-label">Category</label>
        <input v-model="form.category" type="text" class="form-control" id="category" required>
      </div>
      <div class="mb-3">
        <label for="tags" class="form-label">Tags (comma-separated)</label>
        <input v-model="tagsInput" type="text" class="form-control" id="tags">
      </div>
      <button type="submit" class="btn btn-primary" :disabled="loading">Submit</button>
      <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from '@/store/index';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const store = useStore();
const user = computed(() => store.user);

const form = ref({
  title: '',
  content: '',
  excerpt: '',
  category: '',
  tags: [],
});
const tagsInput = ref('');
const loading = ref(false);
const error = ref(null);
const isEditing = computed(() => !!route.params.id);

onMounted(async () => {
  if (isEditing.value && route.params.id !== 'new') {
    try {
      const response = await axios.get(`/api/posts/${route.params.id}`, {
        headers: { Authorization: `Bearer ${await user.value?.getIdToken()}` },
      });
      form.value = {
        title: response.data.title,
        content: response.data.content,
        excerpt: response.data.excerpt,
        category: response.data.category,
        tags: response.data.tags || [],
      };
      tagsInput.value = form.value.tags.join(', ');
    } catch (err) {
      error.value = 'Failed to load post';
      console.error('Error loading post:', err);
    }
  }
});

const submitPost = async () => {
  if (!user.value) return alert('Please login to submit a post');
  loading.value = true;
  error.value = null;

  try {
    form.value.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const postData = { ...form.value };
    let response;

    if (isEditing.value && route.params.id !== 'new') {
      response = await axios.put(`/api/posts/${route.params.id}`, postData, {
        headers: { Authorization: `Bearer ${await user.value.getIdToken()}` },
      });
    } else {
      response = await axios.post('/api/posts', postData, {
        headers: { Authorization: `Bearer ${await user.value.getIdToken()}` },
      });
    }

    router.push({ name: 'PostDetail', params: { id: response.data.id } });
  } catch (err) {
    error.value = 'Failed to submit post: ' + err.message;
    console.error('Error submitting post:', err);
  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <div class="modal fade" id="quickPostModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Quick Post</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form @submit.prevent="createPost">
          <div class="modal-body">
            <div class="mb-3">
              <input v-model="form.title" type="text" class="form-control" placeholder="Post title..." required>
            </div>
            <div class="mb-3">
              <textarea v-model="form.content" class="form-control" rows="8" placeholder="What's on your mind?" required></textarea>
            </div>
            <div class="row">
              <div class="col-md-6">
                <select v-model="form.category" class="form-select">
                  <option value="">Category</option>
                  <option value="Technology">Technology</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>
              <div class="col-md-6">
                <input v-model="form.image" type="url" class="form-control" placeholder="Image URL (optional)">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="saveDraft" class="btn btn-outline-secondary">Save Draft</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Publishing...' : 'Publish' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const loading = ref(false);
const form = ref({
  title: '',
  content: '',
  category: '',
  image: ''
});

const createPost = async () => {
  loading.value = true;
  try {
    await axios.post('/api/posts', {
      ...form.value,
      status: 'published',
      excerpt: form.value.content.substring(0, 150) + '...'
    });
    
    // Reset form and close modal
    form.value = { title: '', content: '', category: '', image: '' };
    const modal = bootstrap.Modal.getInstance(document.getElementById('quickPostModal'));
    modal.hide();
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Failed to create post');
  } finally {
    loading.value = false;
  }
};

const saveDraft = async () => {
  loading.value = true;
  try {
    await axios.post('/api/posts', {
      ...form.value,
      status: 'draft',
      excerpt: form.value.content.substring(0, 150) + '...'
    });
    
    form.value = { title: '', content: '', category: '', image: '' };
    const modal = bootstrap.Modal.getInstance(document.getElementById('quickPostModal'));
    modal.hide();
  } catch (error) {
    console.error('Error saving draft:', error);
    alert('Failed to save draft');
  } finally {
    loading.value = false;
  }
};
</script>
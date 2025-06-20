<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>{{ isEditing ? 'Edit Post' : 'Create New Post' }}</h2>
          <router-link to="/post-manager" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back to Posts
          </router-link>
        </div>

        <form @submit.prevent="savePost">
          <div class="card">
            <div class="card-body">
              <!-- Title -->
              <div class="mb-3">
                <label for="title" class="form-label">Title *</label>
                <input 
                  v-model="form.title" 
                  type="text" 
                  class="form-control" 
                  id="title" 
                  required 
                  placeholder="Enter post title..."
                >
              </div>

              <!-- Excerpt -->
              <div class="mb-3">
                <label for="excerpt" class="form-label">Excerpt</label>
                <textarea 
                  v-model="form.excerpt" 
                  class="form-control" 
                  id="excerpt" 
                  rows="2"
                  placeholder="Brief description of your post..."
                ></textarea>
              </div>

              <!-- Featured Image -->
              <div class="mb-3">
                <label for="image" class="form-label">Featured Image URL</label>
                <input 
                  v-model="form.image" 
                  type="url" 
                  class="form-control" 
                  id="image"
                  placeholder="https://example.com/image.jpg"
                >
                <div v-if="form.image" class="mt-2">
                  <img :src="form.image" class="img-thumbnail" style="max-height: 200px;" alt="Preview">
                </div>
              </div>

              <!-- Category -->
              <div class="mb-3">
                <label for="category" class="form-label">Category</label>
                <select v-model="form.category" class="form-select" id="category">
                  <option value="">Select category</option>
                  <option value="Technology">Technology</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Health">Health</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <!-- Content Editor -->
              <div class="mb-3">
                <label for="content" class="form-label">Content *</label>
                <QuillEditor
                  v-model:content="form.content"
                  content-type="html"
                  :options="editorOptions"
                  style="height: 400px;"
                />
              </div>

              <!-- Tags -->
              <div class="mb-3">
                <label for="tags" class="form-label">Tags</label>
                <input 
                  v-model="tagsInput" 
                  type="text" 
                  class="form-control" 
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  @blur="updateTags"
                >
                <div v-if="form.tags.length" class="mt-2">
                  <span v-for="tag in form.tags" :key="tag" class="badge bg-secondary me-1">
                    {{ tag }}
                    <button type="button" class="btn-close btn-close-white ms-1" @click="removeTag(tag)"></button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex justify-content-between mt-4">
            <div>
              <button type="button" @click="saveAsDraft" class="btn btn-outline-secondary me-2" :disabled="loading">
                <i class="bi bi-save me-2"></i>Save as Draft
              </button>
            </div>
            <div>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i class="bi bi-send me-2"></i>{{ isEditing ? 'Update Post' : 'Publish Post' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const tagsInput = ref('');

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  image: '',
  category: '',
  tags: [],
  status: 'published'
});

const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  }
};

const isEditing = computed(() => route.params.id && route.params.id !== 'new');

onMounted(async () => {
  if (isEditing.value) {
    try {
      const response = await axios.get(`/api/posts/${route.params.id}`);
      const post = response.data;
      form.value = {
        title: post.title,
        excerpt: post.excerpt || '',
        content: post.content,
        image: post.image || '',
        category: post.category || '',
        tags: post.tags || [],
        status: post.status
      };
      tagsInput.value = post.tags?.join(', ') || '';
    } catch (error) {
      console.error('Error loading post:', error);
      router.push('/post-manager');
    }
  }
});

const updateTags = () => {
  if (tagsInput.value.trim()) {
    form.value.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
};

const removeTag = (tagToRemove) => {
  form.value.tags = form.value.tags.filter(tag => tag !== tagToRemove);
  tagsInput.value = form.value.tags.join(', ');
};

const savePost = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    alert('Title and content are required');
    return;
  }

  loading.value = true;
  try {
    const postData = {
      ...form.value,
      excerpt: form.value.excerpt || form.value.content.substring(0, 150) + '...',
      readingTime: Math.ceil(form.value.content.split(' ').length / 200)
    };

    if (isEditing.value) {
      await axios.put(`/api/posts/${route.params.id}`, postData);
    } else {
      await axios.post('/api/posts', postData);
    }

    router.push('/post-manager');
  } catch (error) {
    console.error('Error saving post:', error);
    alert('Failed to save post');
  } finally {
    loading.value = false;
  }
};

const saveAsDraft = async () => {
  if (!form.value.title.trim()) {
    alert('Title is required even for drafts');
    return;
  }

  loading.value = true;
  try {
    const postData = {
      ...form.value,
      status: 'draft',
      excerpt: form.value.excerpt || form.value.content.substring(0, 150) + '...',
      readingTime: Math.ceil(form.value.content.split(' ').length / 200)
    };

    if (isEditing.value) {
      await axios.put(`/api/posts/${route.params.id}`, postData);
    } else {
      await axios.post('/api/posts', postData);
    }

    router.push('/post-manager');
  } catch (error) {
    console.error('Error saving draft:', error);
    alert('Failed to save draft');
  } finally {
    loading.value = false;
  }
};
</script>
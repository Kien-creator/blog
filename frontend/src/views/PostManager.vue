<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>My Posts</h2>
      <router-link to="/post/new" class="btn btn-primary">
        <i class="bi bi-plus-circle me-2"></i>Create New Post
      </router-link>
    </div>

    <!-- Search and Filter -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="searchQuery" class="form-control" placeholder="Search posts by title or content..." />
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="sortBy" class="form-select">
              <option value="createdAt">Sort by Date</option>
              <option value="views">Sort by Views</option>
              <option value="likes">Sort by Likes</option>
              <option value="comments">Sort by Comments</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="statusFilter" class="form-select">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-primary">{{ posts.length }}</h5>
            <p class="card-text">Total Posts</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-success">{{ publishedCount }}</h5>
            <p class="card-text">Published</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-warning">{{ draftCount }}</h5>
            <p class="card-text">Drafts</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-info">{{ totalViews }}</h5>
            <p class="card-text">Total Views</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts List -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>
    
    <div v-else-if="filteredPosts.length === 0" class="text-center py-5">
      <i class="bi bi-file-text display-1 text-muted"></i>
      <h4 class="mt-3">No posts found</h4>
      <p class="text-muted">{{ searchQuery ? 'Try adjusting your search criteria' : 'Create your first post to get started' }}</p>
    </div>
    
    <div v-else class="row g-4">
      <div v-for="post in filteredPosts" :key="post.id" class="col-md-6 col-lg-4">
        <div class="card h-100">
          <img v-if="post.image" :src="post.image" class="card-img-top" style="height: 150px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge" :class="{
                'bg-success': post.status === 'published',
                'bg-warning': post.status === 'draft',
                'bg-info': post.status === 'pending'
              }">{{ post.status }}</span>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><router-link :to="`/post/${post.id}`" class="dropdown-item">View</router-link></li>
                  <li><router-link :to="`/post/${post.id}/edit`" class="dropdown-item">Edit</router-link></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button @click="deletePost(post.id)" class="dropdown-item text-danger">Delete</button></li>
                </ul>
              </div>
            </div>
            
            <h5 class="card-title">{{ post.title }}</h5>
            <p class="card-text flex-grow-1">{{ post.excerpt }}</p>
            
            <div class="mt-auto">
              <div class="d-flex justify-content-between text-muted small">
                <span><i class="bi bi-eye"></i> {{ post.views || 0 }}</span>
                <span><i class="bi bi-heart"></i> {{ post.likes || 0 }}</span>
                <span><i class="bi bi-chat"></i> {{ post.comments || 0 }}</span>
              </div>
              <div class="text-muted small mt-1">
                {{ formatDate(post.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import axios from 'axios';

const authStore = useAuthStore();
const posts = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const sortBy = ref('createdAt');
const statusFilter = ref('');

const publishedCount = computed(() => posts.value.filter(p => p.status === 'published').length);
const draftCount = computed(() => posts.value.filter(p => p.status === 'draft').length);
const totalViews = computed(() => posts.value.reduce((sum, p) => sum + (p.views || 0), 0));

const filteredPosts = computed(() => {
  let result = posts.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.content.toLowerCase().includes(query)
    );
  }
  
  if (statusFilter.value) {
    result = result.filter(post => post.status === statusFilter.value);
  }
  
  return result.sort((a, b) => {
    switch (sortBy.value) {
      case 'views': return (b.views || 0) - (a.views || 0);
      case 'likes': return (b.likes || 0) - (a.likes || 0);
      case 'comments': return (b.comments || 0) - (a.comments || 0);
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const deletePost = async (postId) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await axios.delete(`/api/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc')
    );
    onSnapshot(q, (snapshot) => {
      posts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loading.value = false;
    });
  }
});
</script>
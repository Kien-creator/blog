<template>
  <div>
    <!-- Hero Section -->
    <div class="hero-section bg-primary text-white rounded mb-5 p-5 text-center">
      <h1 class="display-4 fw-bold">Welcome to MyBlog</h1>
      <p class="lead">Discover amazing stories and share your thoughts</p>
      <router-link v-if="!authStore.isAuthenticated" to="/register" class="btn btn-light btn-lg">
        Get Started
      </router-link>
    </div>

    <div class="row">
      <!-- Main Content -->
      <div class="col-lg-8">
        <!-- Featured Posts -->
        <section class="mb-5">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h4 fw-bold">Featured Posts</h2>
            <div class="d-flex gap-2">
              <select v-model="postsPerPage" @change="updatePagination" class="form-select form-select-sm" style="width: auto;">
                <option value="6">6 per page</option>
                <option value="12">12 per page</option>
                <option value="24">24 per page</option>
              </select>
            </div>
          </div>
          
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status"></div>
          </div>
          
          <div v-else class="row g-4">
            <div v-for="post in paginatedPosts" :key="post.id" class="col-md-6 col-lg-4">
              <PostCard :post="post" />
            </div>
          </div>
          
          <!-- Pagination -->
          <nav v-if="totalPages > 1" class="mt-4">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">First</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">Previous</button>
              </li>
              <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                <button class="page-link" @click="currentPage = page">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">Next</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">Last</button>
              </li>
            </ul>
          </nav>
        </section>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <!-- Popular Posts -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-fire text-danger me-2"></i>Popular Posts
            </h5>
          </div>
          <div class="card-body">
            <div v-for="post in popularPosts.slice(0, 5)" :key="post.id" class="d-flex mb-3">
              <img :src="post.image || '/default-post.jpg'" class="rounded me-3" width="60" height="60" style="object-fit: cover;">
              <div>
                <router-link :to="`/post/${post.id}`" class="text-decoration-none">
                  <h6 class="mb-1">{{ post.title }}</h6>
                </router-link>
                <small class="text-muted">
                  <i class="bi bi-eye"></i> {{ post.views || 0 }} views
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories -->
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-tags me-2"></i>Categories
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex flex-wrap gap-2">
              <span v-for="category in categories" :key="category" class="badge bg-secondary">
                {{ category }}
              </span>
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
import { db, collection, query, where, orderBy, onSnapshot, limit } from '@/firebase';
import PostCard from '@/components/PostCard.vue';

const authStore = useAuthStore();
const posts = ref([]);
const popularPosts = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const postsPerPage = ref(6);
const categories = ref(['Technology', 'Lifestyle', 'Travel', 'Food', 'Health']);

const totalPages = computed(() => Math.ceil(posts.value.length / postsPerPage.value));
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage.value;
  return posts.value.slice(start, start + postsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const updatePagination = () => {
  currentPage.value = 1;
};

onMounted(() => {
  const postsQuery = query(
    collection(db, 'posts'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(postsQuery, (snapshot) => {
    posts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    loading.value = false;
  });

  const popularQuery = query(
    collection(db, 'posts'),
    where('status', '==', 'published'),
    orderBy('views', 'desc'),
    limit(5)
  );
  
  onSnapshot(popularQuery, (snapshot) => {
    popularPosts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
});
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
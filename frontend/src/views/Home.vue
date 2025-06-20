<template>
  <div>
    <!-- Hero Section -->
    <div class="hero-section rounded mb-4 p-4 text-center">
      <h1 class="fw-bold">Welcome to MyBlog</h1>
      <p>Discover amazing stories and share your thoughts</p>
      <router-link v-if="!authStore.isAuthenticated" to="/register" class="btn btn-primary">
        Get Started
      </router-link>
    </div>

    <div class="row">
      <!-- Sidebar - Now on the left -->
      <div class="col-lg-4 order-lg-1 order-2">
        <!-- Search -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h5 class="card-title h6 mb-0">
              <i class="bi bi-search me-1"></i>Search
            </h5>
          </div>
          <div class="card-body p-3">
            <div class="input-group">
              <input 
                type="text" 
                v-model="searchInput" 
                @input="searchRealTime"
                class="form-control form-control-sm" 
                placeholder="Search posts..."
                aria-label="Search posts"
              >
              <button class="btn btn-sm btn-primary" @click="searchRealTime">
                <i class="bi bi-search"></i>
              </button>
            </div>
            <div v-if="searchSuggestions.length > 0 && searchInput" class="search-suggestions mt-2">
              <div class="small fw-medium mb-1">Related searches:</div>
              <div class="d-flex flex-wrap gap-1">
                <button 
                  v-for="suggestion in searchSuggestions" 
                  :key="suggestion" 
                  @click="selectSuggestion(suggestion)"
                  class="suggestion-badge">
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h5 class="card-title h6 mb-0">
              <i class="bi bi-tags me-1"></i>Categories
            </h5>
          </div>
          <div class="card-body p-3">
            <div class="d-flex flex-wrap gap-2">
              <button v-for="category in categories" 
                     :key="category" 
                     @click="filterByCategory(category)"
                     class="category-badge"
                     :class="{ 'active': selectedCategory === category }">
                {{ category }}
              </button>
            </div>
          </div>
        </div>

        <!-- Popular Posts -->
        <div class="card mb-3">
          <div class="card-header bg-light">
            <h5 class="card-title h6 mb-0">
              <i class="bi bi-fire me-1"></i>Popular Posts
            </h5>
          </div>
          <div class="card-body p-3">
            <div v-for="post in popularPosts.slice(0, 5)" :key="post.id" class="d-flex mb-2">
              <img :src="post.image || '/default-post.jpg'" class="rounded me-2" width="50" height="50" style="object-fit: cover;">
              <div>
                <router-link :to="`/post/${post.id}`" class="text-decoration-none">
                  <h6 class="mb-1 small fw-medium">{{ post.title }}</h6>
                </router-link>
                <small class="text-muted">
                  <i class="bi bi-eye"></i> {{ post.views || 0 }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content - Now on the right -->
      <div class="col-lg-8 order-lg-2 order-1">
        <!-- Featured Posts -->
        <section class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h5 fw-bold">
              <span v-if="searchInput">Search results for "{{ searchInput }}"</span>
              <span v-else-if="selectedCategory">Posts in {{ selectedCategory }}</span>
              <span v-else>Featured Posts</span>
              <button v-if="searchInput || selectedCategory" 
                     @click="clearFilters" 
                     class="btn btn-sm btn-link text-decoration-none p-0 ms-2">
                <i class="bi bi-x-circle"></i> Clear filters
              </button>
            </h2>
            <div class="d-flex gap-2">
              <select v-model="postsPerPage" @change="updatePagination" class="form-select form-select-sm" style="width: auto;">
                <option value="6">6 per page</option>
                <option value="12">12 per page</option>
                <option value="24">24 per page</option>
              </select>
            </div>
          </div>
          
          <div v-if="loading" class="text-center py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </div>
          
          <div v-else-if="filteredPosts.length === 0" class="text-center py-3">
            <p class="text-muted">No posts found.</p>
          </div>
          
          <div v-else class="row g-3">
            <div v-for="post in paginatedPosts" :key="post.id" class="col-md-6 col-lg-4">
              <PostCard :post="post" />
            </div>
          </div>
          
          <!-- Pagination -->
          <nav v-if="totalPages > 1" class="mt-3">
            <ul class="pagination pagination-sm justify-content-center">
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
const selectedCategory = ref(null);
const searchInput = ref('');
const searchSuggestions = ref([]);

// Từ khóa liên quan cho các chủ đề phổ biến
const relatedKeywords = {
  'tech': ['Technology', 'Programming', 'Software', 'Hardware', 'AI', 'Coding'],
  'food': ['Cooking', 'Recipe', 'Cuisine', 'Meal', 'Restaurant', 'Diet'],
  'travel': ['Vacation', 'Tourism', 'Adventure', 'Destination', 'Journey', 'Trip'],
  'health': ['Fitness', 'Wellness', 'Exercise', 'Nutrition', 'Medical', 'Diet'],
  'lifestyle': ['Fashion', 'Home', 'Decor', 'Hobby', 'Self-care', 'Minimalism']
};

const filteredPosts = computed(() => {
  let result = posts.value;
  
  // Filter by category if selected
  if (selectedCategory.value) {
    result = result.filter(post => post.category === selectedCategory.value);
  }
  
  // Filter by search query if present
  if (searchInput.value) {
    const query = searchInput.value.toLowerCase();
    result = result.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.content.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.category?.toLowerCase().includes(query) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }
  
  return result;
});

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / postsPerPage.value));

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage.value;
  return filteredPosts.value.slice(start, start + postsPerPage.value);
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

const filterByCategory = (category) => {
  selectedCategory.value = category;
  currentPage.value = 1;
};

const searchRealTime = () => {
  currentPage.value = 1;
  updateSearchSuggestions();
};

const updateSearchSuggestions = () => {
  if (!searchInput.value) {
    searchSuggestions.value = [];
    return;
  }
  
  const query = searchInput.value.toLowerCase();
  
  // Tìm từ khóa liên quan
  let suggestions = [];
  
  // Kiểm tra từ khóa trong danh sách từ khóa liên quan
  Object.keys(relatedKeywords).forEach(key => {
    if (key.includes(query)) {
      suggestions = [...suggestions, ...relatedKeywords[key]];
    }
  });
  
  // Thêm categories liên quan
  categories.value.forEach(category => {
    if (category.toLowerCase().includes(query) && !suggestions.includes(category)) {
      suggestions.push(category);
    }
  });
  
  // Thêm tags từ các bài viết
  posts.value.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query) && !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      });
    }
  });
  
  // Giới hạn số lượng gợi ý
  searchSuggestions.value = suggestions.slice(0, 5);
};

const selectSuggestion = (suggestion) => {
  searchInput.value = suggestion;
  searchRealTime();
};

const clearFilters = () => {
  selectedCategory.value = null;
  searchInput.value = '';
  searchSuggestions.value = [];
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
  background: linear-gradient(to right,#ff346a,#aefbb2);
  border: 1px solid #e9ecef;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-badge:hover {
  background-color: #e9ecef;
}

.category-badge.active {
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.suggestion-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-badge:hover {
  background-color: rgba(13, 110, 253, 0.2);
}

.search-suggestions {
  border-top: 1px solid #e9ecef;
  padding-top: 0.5rem;
}

/* Responsive order for mobile */
@media (max-width: 991.98px) {
  .order-1 {
    margin-bottom: 1.5rem;
  }
}
</style>
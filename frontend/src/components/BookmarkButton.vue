<template>
  <button 
    class="bookmark-btn" 
    :class="{ 'active': isBookmarked }" 
    @click="toggleBookmark" 
    :disabled="!authStore.isAuthenticated"
    :title="isBookmarked ? 'Remove bookmark' : 'Add bookmark'"
  >
    <i :class="['bi', isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark']"></i>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const props = defineProps({
  postId: String,
});

const authStore = useAuthStore();
const isBookmarked = ref(false);
const bookmarkId = ref(null);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      const response = await axios.get(`/api/bookmarks?userId=${authStore.user.uid}&postId=${props.postId}`);
      if (response.data.length) {
        isBookmarked.value = true;
        bookmarkId.value = response.data[0].id;
      }
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  }
});

const toggleBookmark = async () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to bookmark');
    return;
  }
  
  try {
    if (isBookmarked.value) {
      await axios.delete(`/api/bookmarks/${bookmarkId.value}`);
      isBookmarked.value = false;
      bookmarkId.value = null;
    } else {
      const response = await axios.post('/api/bookmarks', { postId: props.postId });
      isBookmarked.value = true;
      bookmarkId.value = response.data.id;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
  }
};
</script>

<style scoped>
.bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background-color: #f8f9fa;
  color: #6c757d;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.bookmark-btn:hover {
  background-color: #e9ecef;
}

.bookmark-btn.active {
  color: #ffc107;
}

.bookmark-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
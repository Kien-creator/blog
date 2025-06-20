<template>
  <button 
    class="btn btn-sm" 
    :class="{ 'btn-warning': isBookmarked, 'btn-outline-secondary': !isBookmarked }" 
    @click="toggleBookmark" 
    :disabled="!authStore.isAuthenticated"
  >
    <i :class="['bi', isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark']"></i>
  </button>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
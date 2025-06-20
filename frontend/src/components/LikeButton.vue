<template>
  <div class="reaction-buttons">
    <button 
      class="reaction-btn" 
      :class="{ 'active': userReaction === 'like' }"
      @click="toggleLike"
      :disabled="!authStore.isAuthenticated"
      title="Like"
    >
      <i class="bi bi-hand-thumbs-up"></i>
      <span>{{ likes }}</span>
    </button>
    
    <button 
      class="reaction-btn" 
      :class="{ 'active': userReaction === 'dislike' }"
      @click="toggleDislike"
      :disabled="!authStore.isAuthenticated"
      title="Dislike"
    >
      <i class="bi bi-hand-thumbs-down"></i>
      <span>{{ dislikes }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const props = defineProps({
  postId: String,
  initialLikes: { type: Number, default: 0 },
  initialDislikes: { type: Number, default: 0 }
});

const authStore = useAuthStore();
const likes = ref(props.initialLikes);
const dislikes = ref(props.initialDislikes);
const userReaction = ref(null); // 'like', 'dislike', or null

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      const response = await axios.get(`/api/posts/${props.postId}/reaction`);
      userReaction.value = response.data.reaction;
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  }
});

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to like posts');
    return;
  }
  
  try {
    const newReaction = userReaction.value === 'like' ? null : 'like';
    await axios.post(`/api/posts/${props.postId}/react`, { reaction: newReaction });
    
    if (userReaction.value === 'like') {
      likes.value--;
    } else if (userReaction.value === 'dislike') {
      dislikes.value--;
      likes.value++;
    } else {
      likes.value++;
    }
    
    userReaction.value = newReaction;
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};

const toggleDislike = async () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to dislike posts');
    return;
  }
  
  try {
    const newReaction = userReaction.value === 'dislike' ? null : 'dislike';
    await axios.post(`/api/posts/${props.postId}/react`, { reaction: newReaction });
    
    if (userReaction.value === 'dislike') {
      dislikes.value--;
    } else if (userReaction.value === 'like') {
      likes.value--;
      dislikes.value++;
    } else {
      dislikes.value++;
    }
    
    userReaction.value = newReaction;
  } catch (error) {
    console.error('Error toggling dislike:', error);
  }
};
</script>

<style scoped>
.reaction-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reaction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #6c757d;
  transition: all 0.2s;
  background-color: #f8f9fa;
}

.reaction-btn:hover {
  background-color: #e9ecef;
}

.reaction-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reaction-btn.active {
  color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.1);
}
</style>
<template>
  <div class="d-flex align-items-center gap-2">
    <button 
      class="btn btn-sm" 
      :class="{ 'btn-success': userReaction === 'like', 'btn-outline-success': userReaction !== 'like' }"
      @click="toggleLike"
      :disabled="!authStore.isAuthenticated"
    >
      <i class="bi bi-hand-thumbs-up"></i>
      <span class="ms-1">{{ likes }}</span>
    </button>
    
    <button 
      class="btn btn-sm" 
      :class="{ 'btn-danger': userReaction === 'dislike', 'btn-outline-danger': userReaction !== 'dislike' }"
      @click="toggleDislike"
      :disabled="!authStore.isAuthenticated"
    >
      <i class="bi bi-hand-thumbs-down"></i>
      <span class="ms-1">{{ dislikes }}</span>
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
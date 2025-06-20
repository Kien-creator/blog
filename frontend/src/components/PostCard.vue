<template>
  <div class="card h-100 shadow-sm">
    <img v-if="post.image" :src="post.image" class="card-img-top" style="height: 200px; object-fit: cover;" alt="Post image">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">{{ post.title }}</h5>
      <p class="card-text flex-grow-1">{{ post.excerpt }}</p>
      
      <div class="mt-auto">
        <div class="d-flex align-items-center mb-2">
          <img :src="post.authorAvatar || '/default-avatar.png'" 
               class="rounded-circle me-2" width="24" height="24">
          <small class="text-muted">
            By {{ post.authorName }} • {{ formatDate(post.createdAt) }}
          </small>
        </div>
        
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex gap-2">
            <LikeButton 
              :post-id="post.id" 
              :initial-likes="post.likes || 0"
              :initial-dislikes="post.dislikes || 0" 
            />
            <BookmarkButton :post-id="post.id" />
          </div>
          
          <div class="d-flex gap-2">
            <small class="text-muted">
              <i class="bi bi-eye"></i> {{ post.views || 0 }}
            </small>
            <router-link :to="`/post/${post.id}`" class="btn btn-outline-primary btn-sm">
              Read More
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import LikeButton from './LikeButton.vue';
import BookmarkButton from './BookmarkButton.vue';

defineProps({
  post: Object,
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};
</script>
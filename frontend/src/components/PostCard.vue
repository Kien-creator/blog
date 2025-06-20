<template>
  <div class="post-card">
    <div class="post-image-container">
      <img v-if="post.image" :src="post.image" class="post-image" alt="Post image">
      <div v-else class="post-image-placeholder">
        <i class="bi bi-image"></i>
      </div>
      <div class="post-category" v-if="post.category">{{ post.category }}</div>
    </div>
    
    <div class="post-content">
      <div class="author-info">
        <img :src="authorAvatar" class="author-avatar" alt="Author">
        <div class="author-details">
          <span class="author-name">{{ post.authorName }}</span>
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
        </div>
      </div>
      
      <h5 class="post-title">{{ post.title }}</h5>
      <p class="post-excerpt">{{ post.excerpt }}</p>
      
      <div class="post-footer">
        <div class="post-stats">
          <span class="post-stat"><i class="bi bi-eye"></i> {{ post.views || 0 }}</span>
          <span class="post-stat"><i class="bi bi-chat"></i> {{ post.comments || 0 }}</span>
        </div>
        
        <div class="post-actions">
          <LikeButton 
            :post-id="post.id" 
            :initial-likes="post.likes || 0"
            :initial-dislikes="post.dislikes || 0" 
          />
          <BookmarkButton :post-id="post.id" />
          <router-link :to="`/post/${post.id}`" class="read-btn">
            Read <i class="bi bi-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LikeButton from './LikeButton.vue';
import BookmarkButton from './BookmarkButton.vue';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const props = defineProps({
  post: Object,
});

const authorAvatar = ref(props.post.authorAvatar || '/default-avatar.png');

onMounted(async () => {
  // Nếu không có avatar của tác giả, lấy từ collection users
  if (!props.post.authorAvatar && props.post.authorId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', props.post.authorId));
      if (userDoc.exists() && userDoc.data().avatar) {
        authorAvatar.value = userDoc.data().avatar;
      }
    } catch (error) {
      console.error('Error fetching author avatar:', error);
    }
  }
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  background-color: #fff;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.post-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f8f9fa;
  font-size: 2rem;
  color: #adb5bd;
}

.post-category {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: #0d6efd;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.post-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 1.25rem;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  color: #343a40;
  font-size: 0.85rem;
}

.post-date {
  color: #6c757d;
  font-size: 0.75rem;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  color: #212529;
}

.post-excerpt {
  color: #6c757d;
  margin-bottom: 1rem;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  font-size: 0.9rem;
}

.post-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f1f1;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
  font-size: 0.8rem;
}

.post-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.read-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0d6efd;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.read-btn:hover {
  color: #0a58ca;
}

.read-btn i {
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.read-btn:hover i {
  transform: translateX(2px);
}
</style>
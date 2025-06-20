<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-bookmark-fill me-2"></i>My Bookmarks</h2>
      <span class="badge bg-primary">{{ bookmarkedPosts.length }} saved</span>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <div v-else-if="bookmarkedPosts.length === 0" class="text-center py-5">
      <i class="bi bi-bookmark display-1 text-muted"></i>
      <h4 class="mt-3">No bookmarks yet</h4>
      <p class="text-muted">Save posts you want to read later</p>
      <router-link to="/" class="btn btn-primary">Browse Posts</router-link>
    </div>

    <div v-else class="row g-4">
      <div v-for="post in bookmarkedPosts" :key="post.id" class="col-md-6 col-lg-4">
        <PostCard :post="post" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import PostCard from '@/components/PostCard.vue';

const authStore = useAuthStore();
const bookmarkedPosts = ref([]);
const loading = ref(true);

onMounted(() => {
  if (authStore.isAuthenticated) {
    const q = query(
      collection(db, 'bookmarks'), 
      where('userId', '==', authStore.user.uid)
    );
    
    onSnapshot(q, async (snapshot) => {
      const postPromises = snapshot.docs.map(async (bookmarkDoc) => {
        const postId = bookmarkDoc.data().postId;
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          return { id: postDoc.id, ...postDoc.data() };
        }
        return null;
      });
      
      const posts = await Promise.all(postPromises);
      bookmarkedPosts.value = posts.filter(post => post !== null);
      loading.value = false;
    });
  }
});
</script>
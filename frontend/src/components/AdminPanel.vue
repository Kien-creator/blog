<template>
  <div>
    <h2>Admin Panel</h2>
    <h3>Pending Posts</h3>
    <div v-for="post in pendingPosts" :key="post.id" class="card mb-2">
      <div class="card-body">
        <h5 class="card-title">{{ post.title }}</h5>
        <p class="card-text">By {{ post.authorName }}</p>
        <button class="btn btn-success btn-sm" @click="approvePost(post.id)">Approve</button>
        <button class="btn btn-danger btn-sm ms-2" @click="deletePost(post.id)">Delete</button>
        <button class="btn btn-info btn-sm ms-2" @click="toggleFeature(post.id, !post.isFeatured)">
          {{ post.isFeatured ? 'Unfeature' : 'Feature' }}
        </button>
      </div>
    </div>
    <h3>Users</h3>
    <div v-for="user in users" :key="user.id" class="card mb-2">
      <div class="card-body">
        <p>{{ user.username }} ({{ user.email }})</p>
        <button class="btn btn-danger btn-sm" @click="toggleLock(user.id, !user.isLocked)">
          {{ user.isLocked ? 'Unlock' : 'Lock' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '@/store/index';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import axios from 'axios';

const store = useStore();
const pendingPosts = ref([]);
const users = ref([]);

onMounted(() => {
  const postsQuery = query(collection(db, 'posts'), where('status', '==', 'pending'));
  onSnapshot(postsQuery, (snapshot) => {
    pendingPosts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  onSnapshot(collection(db, 'users'), (snapshot) => {
    users.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
});

const approvePost = async (postId) => {
  try {
    await axios.put(`/api/posts/${postId}/approve`, {}, {
      headers: { Authorization: `Bearer ${await store.user.getIdToken()}` },
    });
  } catch (error) {
    console.error('Error approving post:', error);
  }
};

const deletePost = async (postId) => {
  try {
    await axios.delete(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${await store.user.getIdToken()}` },
    });
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};

const toggleFeature = async (postId, isFeatured) => {
  try {
    await axios.put(`/api/posts/${postId}/feature`, { isFeatured }, {
      headers: { Authorization: `Bearer ${await store.user.getIdToken()}` },
    });
  } catch (error) {
    console.error('Error toggling feature:', error);
  }
};

const toggleLock = async (userId, isLocked) => {
  try {
    await axios.put(`/api/users/${userId}/lock`, { isLocked }, {
      headers: { Authorization: `Bearer ${await store.user.getIdToken()}` },
    });
  } catch (error) {
    console.error('Error toggling lock:', error);
  }
};
</script>
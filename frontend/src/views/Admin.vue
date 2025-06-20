<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-gear me-2"></i>Admin Panel</h2>
      <div class="badge bg-primary fs-6">Administrator</div>
    </div>

    <!-- Dashboard Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-center bg-primary text-white">
          <div class="card-body">
            <i class="bi bi-file-text display-4"></i>
            <h4>{{ stats.totalPosts }}</h4>
            <p>Total Posts</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center bg-warning text-white">
          <div class="card-body">
            <i class="bi bi-clock display-4"></i>
            <h4>{{ stats.pendingPosts }}</h4>
            <p>Pending Posts</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center bg-success text-white">
          <div class="card-body">
            <i class="bi bi-people display-4"></i>
            <h4>{{ stats.totalUsers }}</h4>
            <p>Total Users</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center bg-info text-white">
          <div class="card-body">
            <i class="bi bi-chat display-4"></i>
            <h4>{{ stats.totalComments }}</h4>
            <p>Total Comments</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
          Pending Posts <span class="badge bg-warning ms-1">{{ pendingPosts.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          Users Management
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">
          Comments
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
          Reports
        </button>
      </li>
    </ul>

    <!-- Pending Posts Tab -->
    <div v-if="activeTab === 'posts'">
      <div v-if="loadingPosts" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
      <div v-else-if="pendingPosts.length === 0" class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>No pending posts to review.
      </div>
      <div v-else>
        <div v-for="post in pendingPosts" :key="post.id" class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h5 class="card-title">{{ post.title }}</h5>
                <p class="card-text">{{ post.excerpt }}</p>
                <div class="text-muted small">
                  <i class="bi bi-person me-1"></i>By {{ post.authorName }} • 
                  <i class="bi bi-calendar me-1"></i>{{ formatDate(post.createdAt) }}
                </div>
              </div>
              <img v-if="post.image" :src="post.image" class="ms-3 rounded" width="100" height="80" style="object-fit: cover;">
            </div>
            <div class="mt-3">
              <button class="btn btn-success btn-sm me-2" @click="approvePost(post.id)">
                <i class="bi bi-check-circle me-1"></i>Approve
              </button>
              <button class="btn btn-danger btn-sm me-2" @click="rejectPost(post.id)">
                <i class="bi bi-x-circle me-1"></i>Reject
              </button>
              <button class="btn btn-info btn-sm me-2" @click="toggleFeature(post.id, !post.isFeatured)">
                <i class="bi bi-star me-1"></i>{{ post.isFeatured ? 'Unfeature' : 'Feature' }}
              </button>
              <router-link :to="`/post/${post.id}`" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-eye me-1"></i>Preview
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Management Tab -->
    <div v-if="activeTab === 'users'">
      <div class="card">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Users Management</h5>
            <input v-model="userSearch" class="form-control" style="width: 300px;" placeholder="Search users...">
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <img :src="user.avatar || '/default-avatar.png'" class="rounded-circle me-2" width="32" height="32">
                      <span>{{ user.username }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-secondary'">
                      {{ user.role || 'user' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="user.isLocked ? 'bg-danger' : 'bg-success'">
                      {{ user.isLocked ? 'Locked' : 'Active' }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" @click="toggleLock(user.id, !user.isLocked)">
                        <i :class="user.isLocked ? 'bi bi-unlock' : 'bi bi-lock'"></i>
                      </button>
                      <button class="btn btn-outline-info" @click="viewUserProfile(user.id)">
                        <i class="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments Tab -->
    <div v-if="activeTab === 'comments'">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Recent Comments</h5>
        </div>
        <div class="card-body">
          <div v-for="comment in recentComments" :key="comment.id" class="border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                  <img :src="comment.userAvatar || '/default-avatar.png'" class="rounded-circle me-2" width="24" height="24">
                  <strong>{{ comment.username }}</strong>
                  <small class="text-muted ms-2">{{ formatDate(comment.createdAt) }}</small>
                </div>
                <p class="mb-1">{{ comment.content }}</p>
                <small class="text-muted">On: {{ comment.postTitle }}</small>
              </div>
              <button class="btn btn-sm btn-outline-danger" @click="deleteComment(comment.id)">
                <i class="bi bi-trash"></i>
              </button>
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
import { db, collection, query, where, orderBy, limit, onSnapshot } from '@/firebase';
import { useRouter } from 'vue-router';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();
const activeTab = ref('posts');
const pendingPosts = ref([]);
const users = ref([]);
const recentComments = ref([]);
const loadingPosts = ref(true);
const userSearch = ref('');

const stats = ref({
  totalPosts: 0,
  pendingPosts: 0,
  totalUsers: 0,
  totalComments: 0
});

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value;
  const search = userSearch.value.toLowerCase();
  return users.value.filter(user => 
    user.username?.toLowerCase().includes(search) || 
    user.email?.toLowerCase().includes(search)
  );
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

onMounted(() => {
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }

  // Pending posts
  const postsQuery = query(collection(db, 'posts'), where('status', '==', 'pending'));
  onSnapshot(postsQuery, (snapshot) => {
    pendingPosts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.pendingPosts = pendingPosts.value.length;
    loadingPosts.value = false;
  });

  // Users
  onSnapshot(collection(db, 'users'), (snapshot) => {
    users.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.totalUsers = users.value.length;
  });

  // Recent comments
  const commentsQuery = query(
    collection(db, 'comments'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  onSnapshot(commentsQuery, (snapshot) => {
    recentComments.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.totalComments = snapshot.docs.length;
  });

  // Total posts
  onSnapshot(collection(db, 'posts'), (snapshot) => {
    stats.value.totalPosts = snapshot.docs.length;
  });
});

const approvePost = async (postId) => {
  try {
    await axios.put(`/api/posts/${postId}/approve`);
  } catch (error) {
    console.error('Error approving post:', error);
  }
};

const rejectPost = async (postId) => {
  if (confirm('Are you sure you want to reject this post?')) {
    try {
      await axios.delete(`/api/posts/${postId}`);
    } catch (error) {
      console.error('Error rejecting post:', error);
    }
  }
};

const toggleFeature = async (postId, isFeatured) => {
  try {
    await axios.put(`/api/posts/${postId}/feature`, { isFeatured });
  } catch (error) {
    console.error('Error toggling feature:', error);
  }
};

const toggleLock = async (userId, isLocked) => {
  try {
    await axios.put(`/api/users/${userId}/lock`, { isLocked });
  } catch (error) {
    console.error('Error toggling lock:', error);
  }
};

const viewUserProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

const deleteComment = async (commentId) => {
  if (confirm('Are you sure you want to delete this comment?')) {
    try {
      await axios.delete(`/api/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }
};
</script>
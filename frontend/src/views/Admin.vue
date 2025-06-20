<template>
  <div class="container-fluid py-4">
    <!-- Admin Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</h2>
      <div class="d-flex gap-2">
        <router-link to="/" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i>Back to Site
        </router-link>
      </div>
    </div>

    <!-- Dashboard Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title">Total Posts</h6>
                <h3 class="mb-0">{{ stats.totalPosts }}</h3>
              </div>
              <i class="bi bi-file-earmark-text fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title">Pending Posts</h6>
                <h3 class="mb-0">{{ stats.pendingPosts }}</h3>
              </div>
              <i class="bi bi-clock fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title">Active Users</h6>
                <h3 class="mb-0">{{ stats.activeUsers }}</h3>
              </div>
              <i class="bi bi-people fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title">Reports</h6>
                <h3 class="mb-0">{{ stats.reports }}</h3>
              </div>
              <i class="bi bi-flag fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
          <i class="bi bi-clock me-1"></i>Pending Posts
          <span class="badge bg-warning ms-1">{{ pendingPosts.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
          <i class="bi bi-flag me-1"></i>Reports
          <span class="badge bg-danger ms-1">{{ reports.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">
          <i class="bi bi-chat me-1"></i>Flagged Comments
          <span class="badge bg-danger ms-1">{{ flaggedComments.length }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          <i class="bi bi-people me-1"></i>User Management
        </button>
      </li>
    </ul>

    <!-- Pending Posts Tab -->
    <div v-if="activeTab === 'pending'" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">Posts Awaiting Approval</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="loading.posts" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>
        <div v-else-if="pendingPosts.length === 0" class="text-center py-5">
          <i class="bi bi-check-circle text-success fs-1"></i>
          <p class="mt-3">No pending posts to review</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in pendingPosts" :key="post.id">
                <td>
                  <div class="d-flex align-items-center">
                    <img v-if="post.image" :src="post.image" class="rounded me-2" width="50" height="40" style="object-fit: cover;">
                    <div>
                      <div class="fw-medium">{{ post.title }}</div>
                      <div class="small text-muted">{{ post.excerpt?.substring(0, 60) }}...</div>
                    </div>
                  </div>
                </td>
                <td>{{ post.authorName }}</td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button @click="approvePost(post.id)" class="btn btn-success">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button @click="rejectPost(post.id)" class="btn btn-danger">
                      <i class="bi bi-x-lg"></i>
                    </button>
                    <router-link :to="`/post/${post.id}`" class="btn btn-primary">
                      <i class="bi bi-eye"></i>
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Reports Tab -->
    <div v-if="activeTab === 'reports'" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">Content Reports</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="loading.reports" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>
        <div v-else-if="reports.length === 0" class="text-center py-5">
          <i class="bi bi-check-circle text-success fs-1"></i>
          <p class="mt-3">No reports to review</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Reported Content</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report.id">
                <td>
                  <div class="d-flex align-items-center">
                    <div>
                      <div class="fw-medium">{{ report.contentType === 'post' ? 'Post' : 'Comment' }}</div>
                      <div class="small text-muted">{{ report.contentExcerpt }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ report.reason }}</td>
                <td>{{ report.reporterName }}</td>
                <td>{{ formatDate(report.createdAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button @click="viewReportedContent(report)" class="btn btn-primary">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button @click="dismissReport(report.id)" class="btn btn-secondary">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button @click="removeReportedContent(report)" class="btn btn-danger">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Flagged Comments Tab -->
    <div v-if="activeTab === 'comments'" class="card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Flagged Comments</h5>
          <div class="d-flex gap-2">
            <button @click="updateBadWordsList" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-pencil me-1"></i>Edit Bad Words List
            </button>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <div v-if="loading.comments" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>
        <div v-else-if="flaggedComments.length === 0" class="text-center py-5">
          <i class="bi bi-check-circle text-success fs-1"></i>
          <p class="mt-3">No flagged comments to review</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Comment</th>
                <th>Author</th>
                <th>Post</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="comment in flaggedComments" :key="comment.id">
                <td>
                  <div class="fw-medium">{{ highlightBadWords(comment.content) }}</div>
                </td>
                <td>{{ comment.authorName }}</td>
                <td>
                  <router-link :to="`/post/${comment.postId}`">
                    {{ comment.postTitle || 'View Post' }}
                  </router-link>
                </td>
                <td>{{ formatDate(comment.createdAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button @click="approveComment(comment.id)" class="btn btn-success">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button @click="deleteComment(comment.id)" class="btn btn-danger">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="card">
      <div class="card-header bg-light">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">User Management</h5>
          <input v-model="userSearch" type="text" class="form-control form-control-sm" 
                 placeholder="Search users..." style="max-width: 200px;">
        </div>
      </div>
      <div class="card-body p-0">
        <div v-if="loading.users" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
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
                    <span>{{ user.username || user.displayName }}</span>
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
                    <button @click="toggleLock(user.id, !user.isLocked)" class="btn" 
                            :class="user.isLocked ? 'btn-success' : 'btn-warning'">
                      <i :class="user.isLocked ? 'bi bi-unlock' : 'bi bi-lock'"></i>
                    </button>
                    <button v-if="user.role !== 'admin'" @click="promoteToAdmin(user.id)" class="btn btn-info">
                      <i class="bi bi-arrow-up-circle"></i>
                    </button>
                    <router-link :to="`/profile/${user.id}`" class="btn btn-primary">
                      <i class="bi bi-eye"></i>
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bad Words Modal -->
    <div class="modal fade" id="badWordsModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Bad Words List</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted">Add words that should be flagged in comments (one per line)</p>
            <textarea v-model="badWordsText" class="form-control" rows="10"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveBadWordsList">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const activeTab = ref('pending');
const userSearch = ref('');
const badWordsText = ref('');
const badWords = ref([]);

// Data
const pendingPosts = ref([]);
const reports = ref([]);
const flaggedComments = ref([]);
const users = ref([]);

// Loading states
const loading = ref({
  posts: true,
  reports: true,
  comments: true,
  users: true
});

// Stats
const stats = ref({
  totalPosts: 0,
  pendingPosts: 0,
  activeUsers: 0,
  reports: 0
});

// Computed
const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value;
  const search = userSearch.value.toLowerCase();
  return users.value.filter(user => 
    (user.username?.toLowerCase().includes(search)) || 
    (user.email?.toLowerCase().includes(search)) ||
    (user.displayName?.toLowerCase().includes(search))
  );
});

// Methods
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

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

const toggleLock = async (userId, isLocked) => {
  try {
    await axios.put(`/api/users/${userId}/lock`, { isLocked });
  } catch (error) {
    console.error('Error toggling lock:', error);
  }
};

const promoteToAdmin = async (userId) => {
  if (confirm('Are you sure you want to promote this user to admin?')) {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: 'admin' });
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  }
};

const viewReportedContent = (report) => {
  if (report.contentType === 'post') {
    router.push(`/post/${report.contentId}`);
  } else {
    router.push(`/post/${report.postId}#comment-${report.contentId}`);
  }
};

const dismissReport = async (reportId) => {
  try {
    await axios.put(`/api/reports/${reportId}/dismiss`);
  } catch (error) {
    console.error('Error dismissing report:', error);
  }
};

const removeReportedContent = async (report) => {
  if (confirm('Are you sure you want to remove this content?')) {
    try {
      if (report.contentType === 'post') {
        await axios.delete(`/api/posts/${report.contentId}`);
      } else {
        await axios.delete(`/api/comments/${report.contentId}`);
      }
      await axios.delete(`/api/reports/${report.id}`);
    } catch (error) {
      console.error('Error removing content:', error);
    }
  }
};

const approveComment = async (commentId) => {
  try {
    await axios.put(`/api/comments/${commentId}/approve`);
  } catch (error) {
    console.error('Error approving comment:', error);
  }
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

const updateBadWordsList = () => {
  badWordsText.value = badWords.value.join('\n');
  const modal = new bootstrap.Modal(document.getElementById('badWordsModal'));
  modal.show();
};

const saveBadWordsList = async () => {
  try {
    const newBadWords = badWordsText.value
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    await axios.put('/api/settings/bad-words', { words: newBadWords });
    badWords.value = newBadWords;
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('badWordsModal'));
    modal.hide();
  } catch (error) {
    console.error('Error saving bad words list:', error);
  }
};

const highlightBadWords = (text) => {
  if (!text) return '';
  let result = text;
  badWords.value.forEach(word => {
    const regex = new RegExp(word, 'gi');
    result = result.replace(regex, match => `<span class="text-danger fw-bold">${match}</span>`);
  });
  return result;
};

// Lifecycle
onMounted(async () => {
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }

  // Load bad words list
  try {
    const response = await axios.get('/api/settings/bad-words');
    badWords.value = response.data.words || [];
  } catch (error) {
    console.error('Error loading bad words list:', error);
    badWords.value = [];
  }

  // Load pending posts
  const postsQuery = query(
    collection(db, 'posts'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(postsQuery, (snapshot) => {
    pendingPosts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.pendingPosts = pendingPosts.value.length;
    loading.value.posts = false;
  });

  // Load reports
  const reportsQuery = query(
    collection(db, 'reports'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(reportsQuery, (snapshot) => {
    reports.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.reports = reports.value.length;
    loading.value.reports = false;
  });

  // Load flagged comments
  const commentsQuery = query(
    collection(db, 'comments'),
    where('flagged', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(commentsQuery, (snapshot) => {
    flaggedComments.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    loading.value.comments = false;
  });

  // Load users
  const usersQuery = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc')
  );
  
  onSnapshot(usersQuery, (snapshot) => {
    users.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    stats.value.activeUsers = users.value.filter(user => !user.isLocked).length;
    loading.value.users = false;
  });

  // Get total posts count
  const totalPostsQuery = query(collection(db, 'posts'));
  const totalPostsSnapshot = await totalPostsQuery.get();
  stats.value.totalPosts = totalPostsSnapshot.size;
});
</script>

<style scoped>
.table th, .table td {
  padding: 1rem;
}
</style>
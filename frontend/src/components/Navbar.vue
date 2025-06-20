<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold" to="/">MyBlog</RouterLink>

      <ul class="navbar-nav ms-auto align-items-center">
        <li v-if="!authStore.isAuthenticated" class="nav-item">
          <RouterLink class="nav-link" to="/login">Login</RouterLink>
        </li>
        <li v-if="!authStore.isAuthenticated" class="nav-item">
          <RouterLink class="btn btn-primary ms-2" to="/register">Sign Up</RouterLink>
        </li>

        <template v-else>
          <li class="nav-item me-3">
            <RouterLink to="/post/new" class="btn btn-success btn-sm">
              <i class="bi bi-pencil-square me-1"></i>Write
            </RouterLink>
          </li>
          
          <li class="nav-item dropdown me-3">
            <button class="btn position-relative" data-bs-toggle="dropdown">
              <i class="bi bi-bell fs-5"></i>
              <span v-if="unread" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{{ unread }}</span>
            </button>
            <NotificationDropdown />
          </li>

          <li class="nav-item dropdown">
            <button class="btn d-flex align-items-center" data-bs-toggle="dropdown">
              <img :src="authStore.profile?.avatar || '/default-avatar.png'"
                   class="rounded-circle me-2" width="32" height="32" />
              <span class="fw-medium">{{ authStore.profile?.username || 'User' }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><RouterLink class="dropdown-item" :to="`/profile/${authStore.user.uid}`">
                <i class="bi bi-person me-2"></i>My Profile
              </RouterLink></li>
              <li><RouterLink class="dropdown-item" to="/bookmarks">
                <i class="bi bi-bookmark me-2"></i>Bookmarks
              </RouterLink></li>
              <li><RouterLink class="dropdown-item" to="/post-manager">
                <i class="bi bi-file-text me-2"></i>My Posts
              </RouterLink></li>
              <li v-if="authStore.isAdmin">
                <RouterLink class="dropdown-item" to="/admin">
                  <i class="bi bi-gear me-2"></i>Admin Panel
                </RouterLink>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item" @click="logout">
                <i class="bi bi-box-arrow-right me-2"></i>Logout
              </button></li>
            </ul>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import NotificationDropdown from './NotificationDropdown.vue';

const authStore = useAuthStore();
const router = useRouter();

const unread = ref(0);

onMounted(() => {
  if (authStore.isAuthenticated) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', authStore.user.uid),
      where('isRead', '==', false)
    );
    
    onSnapshot(q, (snapshot) => {
      unread.value = snapshot.docs.length;
    });
  }
});

const logout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>
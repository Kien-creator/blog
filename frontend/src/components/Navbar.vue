<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary shadow-sm">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold" to="/">
        <img src="../../public/skibidibooklogo.png" alt="" style="width: 50px; height: 50px; border-radius: 50%;" />
      </RouterLink>
      <ul class="navbar-nav ms-auto align-items-center">
        <li v-if="!authStore.isAuthenticated" class="nav-item">
          <RouterLink class="nav-btn nav-btn-outline" to="/login">Login</RouterLink>
        </li>
        <li v-if="!authStore.isAuthenticated" class="nav-item ms-2">
          <RouterLink class="nav-btn nav-btn-primary" to="/register">Sign Up</RouterLink>
        </li>

        <template v-else>
          <li class="nav-item me-3">
            <RouterLink to="/post/new" class="nav-btn nav-btn-success">
              <i class="bi bi-plus-lg"></i>
              <span>Write</span>
            </RouterLink>
          </li>
          
          <li class="nav-item me-3">
            <button class="nav-btn nav-btn-icon position-relative" data-bs-toggle="dropdown">
              <i class="bi bi-bell"></i>
              <span v-if="unread" class="notification-badge">{{ unread }}</span>
            </button>
            <NotificationDropdown />
          </li>

          <li class="nav-item dropdown">
            <button class="nav-btn nav-btn-user" data-bs-toggle="dropdown">
              <img :src="authStore.profile?.avatar || '/default-avatar.png'"
                   class="user-avatar" />
              <span class="user-name">{{ getUserName() }}</span>
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
import { db, auth, onAuthStateChanged } from '@/firebase';
import NotificationDropdown from './NotificationDropdown.vue';

const authStore = useAuthStore();
const router = useRouter();

const unread = ref(0);

// Hàm lấy tên người dùng từ profile
const getUserName = () => {
  if (!authStore.profile) return 'User';
  
  // Ưu tiên theo thứ tự: username > displayName > name > email
  return authStore.profile.username || 
         authStore.profile.displayName || 
         authStore.profile.name || 
         (authStore.user?.email ? authStore.user.email.split('@')[0] : 'User');
};

onMounted(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('isRead', '==', false)
      );
      
      try {
        onSnapshot(q, (snapshot) => {
          unread.value = snapshot.docs.length;
        }, (error) => {
          console.error('Error in notifications snapshot:', error);
        });
      } catch (error) {
        console.error('Error setting up notifications listener:', error);
      }
    }
  });
  
  return () => unsubscribe();
});

const logout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<style scoped>
/* Base button style */
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

/* Button variants */
.nav-btn-outline {
  color: #0d6efd;
  background-color: transparent;
  border: 1px solid #0d6efd;
}

.nav-btn-outline:hover {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.nav-btn-primary {
  background-color: #0d6efd;
  color: white;
}

.nav-btn-primary:hover {
  background-color: #0b5ed7;
  color: white;
}

.nav-btn-success {
  background-color: #198754;
  color: white;
}

.nav-btn-success:hover {
  background-color: #157347;
  color: white;
}

/* Icon button */
.nav-btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  background-color: #f8f9fa;
  color: #495057;
}

.nav-btn-icon:hover {
  background-color: #e9ecef;
  color: #212529;
}

.nav-btn-icon i {
  font-size: 1.2rem;
}

/* User button */
.nav-btn-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 30px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.nav-btn-user:hover {
  background-color: #e9ecef;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: #212529;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Notification badge */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
}
</style>
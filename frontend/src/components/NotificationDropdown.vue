<template>
  <ul class="dropdown-menu dropdown-menu-end" style="width: 300px; max-height: 400px; overflow-y: auto;">
    <li class="dropdown-header d-flex justify-content-between">
      <span>Notifications</span>
      <button v-if="unreadCount > 0" @click="markAllAsRead" class="btn btn-sm btn-link p-0">Mark all read</button>
    </li>
    <li><hr class="dropdown-divider"></li>
    
    <div v-if="loading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm" role="status"></div>
    </div>
    
    <li v-else-if="notifications.length === 0" class="dropdown-item-text text-center text-muted py-3">
      No notifications
    </li>
    
    <template v-else>
      <li v-for="notification in notifications" :key="notification.id" 
          class="dropdown-item-text p-3 border-bottom" 
          :class="{ 'bg-light': !notification.isRead }"
          @click="viewNotification(notification)">
        <div class="d-flex">
          <img :src="notification.senderAvatar || '/default-avatar.png'" 
               class="rounded-circle me-2" width="32" height="32">
          <div class="flex-grow-1">
            <div class="fw-medium">{{ notification.senderName }}</div>
            <div class="text-muted small">{{ notification.message }}</div>
            <div class="text-muted small">{{ formatTime(notification.createdAt) }}</div>
          </div>
          <div v-if="!notification.isRead" class="badge bg-primary rounded-pill ms-2" style="width: 8px; height: 8px;"></div>
        </div>
      </li>
    </template>
  </ul>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/firebase';

const authStore = useAuthStore();
const router = useRouter();
const notifications = ref([]);
const loading = ref(true);

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.isRead).length
);

onMounted(() => {
  if (authStore.isAuthenticated) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loading.value = false;
    }, (error) => {
      console.error('Error fetching notifications:', error);
      loading.value = false;
    });
  }
});

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const viewNotification = async (notification) => {
  try {
    if (!notification.isRead) {
      await axios.put(`/api/notifications/${notification.id}/read`);
    }
    
    // Navigate based on notification type
    if (notification.type === 'comment' || notification.type === 'reply' || 
        notification.type === 'like' || notification.type === 'dislike') {
      router.push(`/post/${notification.postId}`);
    }
    
    // Close dropdown
    const dropdownEl = document.querySelector('.dropdown-menu.show');
    if (dropdownEl) {
      const dropdown = bootstrap.Dropdown.getInstance(dropdownEl);
      if (dropdown) dropdown.hide();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await axios.put('/api/notifications/mark-all-read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};
</script>
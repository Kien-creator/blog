<template>
  <div class="comment mb-2" :style="{ 'margin-left': `${level * 20}px` }">
    <div class="card" :class="{ 'border-start border-primary border-2': level > 0 }">
      <div class="card-body p-3">
        <div class="d-flex align-items-start">
          <img :src="commentAvatar" 
               class="rounded-circle me-2" width="32" height="32" alt="Avatar">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <div>
                <span class="fw-medium small">{{ comment.authorName }}</span>
                <small class="text-muted ms-2">{{ formatTime(comment.createdAt) }}</small>
              </div>
              <div class="dropdown" v-if="authStore.isAdmin || comment.authorId === authStore.user?.uid">
                <button class="btn btn-sm p-0 text-muted" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><button @click="editComment" class="dropdown-item">Edit</button></li>
                  <li><button @click="deleteComment" class="dropdown-item text-danger">Delete</button></li>
                </ul>
              </div>
            </div>
            
            <div v-if="!isEditing">
              <p class="mb-2 small">{{ comment.content }}</p>
              <div class="d-flex gap-2">
                <button class="btn btn-sm p-0 text-muted small" @click="toggleReplyForm">
                  <i class="bi bi-reply"></i> Reply
                </button>
                <button class="btn btn-sm p-0 text-muted small" @click="toggleLike">
                  <i :class="['bi', isLiked ? 'bi-heart-fill text-danger' : 'bi-heart']"></i>
                  {{ comment.likes || 0 }}
                </button>
              </div>
            </div>
            
            <!-- Edit Form -->
            <div v-else>
              <form @submit.prevent="updateComment">
                <textarea v-model="editContent" class="form-control form-control-sm mb-2" rows="3" required></textarea>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-sm btn-primary">Save</button>
                  <button type="button" @click="cancelEdit" class="btn btn-sm btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <!-- Reply Form -->
        <div v-if="showReplyForm" class="mt-2 ms-4">
          <form @submit.prevent="submitReply">
            <div class="d-flex gap-2">
              <img :src="authStore.profile?.avatar || '/default-avatar.png'" 
                   class="rounded-circle" width="24" height="24">
              <div class="flex-grow-1">
                <textarea v-model="replyContent" class="form-control form-control-sm mb-2" 
                         rows="2" placeholder="Write a reply..." required></textarea>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-sm btn-primary" :disabled="!authStore.isAuthenticated">
                    Reply
                  </button>
                  <button type="button" @click="showReplyForm = false" class="btn btn-sm btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Replies Toggle -->
    <div v-if="comment.replies && comment.replies.length > 0" class="mt-1">
      <button v-if="!showReplies" 
              @click="showReplies = true" 
              class="btn btn-sm p-0 text-muted small">
        <i class="bi bi-chat-square-text me-1"></i>
        Show {{ comment.replies.length }} {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
      </button>
      <div v-if="showReplies">
        <button @click="showReplies = false" class="btn btn-sm p-0 text-muted small mb-1">
          <i class="bi bi-chevron-up me-1"></i>Hide replies
        </button>
        <Comment v-for="reply in comment.replies" :key="reply.id" 
                :comment="reply" :level="level + 1" :post-id="postId" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const props = defineProps({
  comment: Object,
  level: { type: Number, default: 0 },
  postId: String
});

const authStore = useAuthStore();
const showReplyForm = ref(false);
const showReplies = ref(false);
const replyContent = ref('');
const isEditing = ref(false);
const editContent = ref('');
const isLiked = ref(false);
const commentAvatar = ref(props.comment.authorAvatar || '/default-avatar.png');

// Fetch user avatar if not available
const fetchUserAvatar = async () => {
  if (!props.comment.authorAvatar && props.comment.authorId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', props.comment.authorId));
      if (userDoc.exists() && userDoc.data().avatar) {
        commentAvatar.value = userDoc.data().avatar;
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
  }
};

// Check if user has liked this comment
const checkLikeStatus = async () => {
  if (!authStore.isAuthenticated) return;
  
  try {
    const response = await axios.get(`/api/comments/${props.comment.id}/like`);
    isLiked.value = response.data.liked;
  } catch (error) {
    console.error('Error checking like status:', error);
  }
};

// Call on component mount
onMounted(() => {
  checkLikeStatus();
  fetchUserAvatar();
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

const toggleReplyForm = () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to reply');
    return;
  }
  showReplyForm.value = !showReplyForm.value;
};

const submitReply = async () => {
  try {
    const response = await axios.post('/api/comments', {
      postId: props.postId,
      content: replyContent.value,
      parentId: props.comment.id,
    });
    
    // Add the new reply to the parent comment's replies array
    if (!props.comment.replies) props.comment.replies = [];
    props.comment.replies.push(response.data);
    
    // Show replies after adding a new one
    showReplies.value = true;
    
    replyContent.value = '';
    showReplyForm.value = false;
  } catch (error) {
    console.error('Error submitting reply:', error);
  }
};

const editComment = () => {
  isEditing.value = true;
  editContent.value = props.comment.content;
};

const updateComment = async () => {
  try {
    await axios.put(`/api/comments/${props.comment.id}`, {
      content: editContent.value
    });
    props.comment.content = editContent.value;
    isEditing.value = false;
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = '';
};

const deleteComment = async () => {
  if (confirm('Are you sure you want to delete this comment?')) {
    try {
      await axios.delete(`/api/comments/${props.comment.id}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }
};

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to like comments');
    return;
  }
  
  try {
    const response = await axios.post(`/api/comments/${props.comment.id}/like`);
    isLiked.value = !isLiked.value;
    
    // Update the likes count in the comment object
    if (props.comment.likes === undefined) props.comment.likes = 0;
    props.comment.likes = response.data.likes;
  } catch (error) {
    console.error('Error toggling like:', error);
  }
};
</script>
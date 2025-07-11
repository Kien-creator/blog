<template>
  <div v-if="post">
    <div class="card mb-3">
      <img v-if="post.image" :src="post.image" class="card-img-top" alt="Post image">
      <div class="card-body">
        <h1 class="h2">{{ post.title }}</h1>
        <p class="text-muted small">
          By {{ post.authorName }} on {{ formatDate(post.createdAt) }} | 
          {{ post.readingTime || 5 }} min read | <i class="bi bi-eye"></i> {{ post.views || 0 }}
        </p>
        <div class="mb-3">
          <span v-for="tag in post.tags" :key="tag" class="badge bg-light text-dark me-1">{{ tag }}</span>
          <span v-if="post.category" class="badge bg-light text-primary">{{ post.category }}</span>
        </div>
        <div class="post-content" v-html="post.content"></div>
        <div class="mt-3 d-flex justify-content-between">
          <div class="d-flex gap-2">
            <LikeButton 
              :post-id="post.id" 
              :initial-likes="post.likes || 0"
              :initial-dislikes="post.dislikes || 0" 
            />
            <BookmarkButton :post-id="post.id" />
          </div>
          <ShareButtons :post="post" />
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header bg-light">
        <h3 class="h5 mb-0">Comments ({{ comments.length }})</h3>
      </div>
      <div class="card-body">
        <form @submit.prevent="submitComment" class="mb-3">
          <div class="d-flex gap-2">
            <img :src="authStore.profile?.avatar || '/default-avatar.png'" 
                 class="rounded-circle" width="32" height="32">
            <div class="flex-grow-1">
              <textarea v-model="commentForm.content" class="form-control mb-2" 
                       rows="3" placeholder="Write a comment..." required></textarea>
              <button type="submit" class="btn btn-sm btn-primary" :disabled="!authStore.isAuthenticated || submitting">
                {{ submitting ? 'Posting...' : 'Post Comment' }}
              </button>
              <div v-if="!authStore.isAuthenticated" class="text-muted mt-2 small">
                Please <router-link to="/login">login</router-link> to comment
              </div>
            </div>
          </div>
        </form>

        <div v-if="commentsError" class="alert alert-warning small">{{ commentsError }}</div>
        <div v-if="loadingComments" class="text-center py-2">
          <div class="spinner-border spinner-border-sm" role="status"></div>
        </div>
        <div v-else-if="comments.length === 0" class="text-center py-2 text-muted small">
          No comments yet. Be the first to comment!
        </div>
        <div v-else>
          <Comment v-for="comment in comments" :key="comment.id" 
                  :comment="comment" :level="0" :post-id="post.id" />
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="text-center py-3">
    <div class="spinner-border spinner-border-sm" role="status"></div>
  </div>
  <div v-else class="alert alert-danger">Post not found</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { db, doc, getDoc, collection, query, where, onSnapshot, getDocs, orderBy } from '@/firebase';
import axios from 'axios';
import Comment from '@/components/Comment.vue';
import ShareButtons from '@/components/ShareButtons.vue';
import BookmarkButton from '@/components/BookmarkButton.vue';
import LikeButton from '@/components/LikeButton.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const post = ref(null);
const comments = ref([]);
const commentForm = ref({ content: '' });
const loading = ref(true);
const loadingComments = ref(true);
const commentsError = ref(null);
const submitting = ref(false);

// Sử dụng localStorage để theo dõi lượt xem
const viewKey = `post_viewed_${route.params.id}`;
const hasViewed = localStorage.getItem(viewKey);

onMounted(async () => {
  // Fetch post
  try {
    const postDoc = await getDoc(doc(db, 'posts', route.params.id));
    if (postDoc.exists()) {
      post.value = { id: postDoc.id, ...postDoc.data() };
      
      // Chỉ tăng lượt xem nếu chưa xem trong phiên này
      if (!hasViewed) {
        try {
          await axios.post(`/api/posts/${route.params.id}/view`);
          // Lưu trạng thái đã xem vào localStorage
          localStorage.setItem(viewKey, 'true');
          // Cập nhật lượt xem trong state để hiển thị ngay
          post.value.views = (post.value.views || 0) + 1;
        } catch (error) {
          console.error('Error incrementing view count:', error);
        }
      }
    } else {
      console.error('Post not found for ID:', route.params.id);
      router.push('/');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    router.push('/');
  } finally {
    loading.value = false;
  }

  // Fetch comments
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', route.params.id),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc')
    );
    
    // Use a separate function to fetch replies for a comment
    const fetchReplies = async (commentId) => {
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId),
        orderBy('createdAt', 'asc')
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      return repliesSnapshot.docs.map(reply => ({ id: reply.id, ...reply.data() }));
    };
    
    onSnapshot(commentsQuery, async (snapshot) => {
      const commentPromises = snapshot.docs.map(async (doc) => {
        const commentData = { id: doc.id, ...doc.data() };
        commentData.replies = await fetchReplies(doc.id);
        return commentData;
      });
      
      comments.value = await Promise.all(commentPromises);
      loadingComments.value = false;
      commentsError.value = null;
    }, (error) => {
      console.error('Error fetching comments:', error);
      commentsError.value = 'Failed to load comments';
      loadingComments.value = false;
    });
  } catch (error) {
    console.error('Error setting up comments listener:', error);
    commentsError.value = 'Failed to load comments';
    loadingComments.value = false;
  }
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const submitComment = async () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to comment');
    return;
  }
  
  submitting.value = true;
  try {
    const response = await axios.post('/api/comments', {
      postId: route.params.id,
      content: commentForm.value.content,
    });
    
    // Add the new comment to the top of the comments list
    comments.value.unshift({
      ...response.data,
      replies: []
    });
    
    commentForm.value.content = '';
  } catch (error) {
    console.error('Error submitting comment:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.post-content {
  font-size: 1rem;
  line-height: 1.6;
}

.post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.post-content h1, 
.post-content h2, 
.post-content h3, 
.post-content h4, 
.post-content h5, 
.post-content h6 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.post-content p {
  margin-bottom: 1rem;
}

.post-content blockquote {
  border-left: 4px solid #e9ecef;
  padding-left: 1rem;
  color: #6c757d;
  margin: 1rem 0;
}
</style>
<template>
  <div v-if="user">
    <div class="row">
      <!-- Profile Card -->
      <div class="col-md-4">
        <div class="card shadow">
          <div class="card-body text-center">
            <div class="position-relative mb-3">
              <img :src="user.avatar || '/default-avatar.png'" 
                   class="rounded-circle mx-auto" 
                   style="width: 150px; height: 150px; object-fit: cover;" 
                   alt="Avatar">
              
              <div v-if="isOwnProfile" class="position-absolute bottom-0 end-0">
                <button class="btn btn-sm btn-primary rounded-circle" 
                        data-bs-toggle="modal" data-bs-target="#avatarModal">
                  <i class="bi bi-camera"></i>
                </button>
              </div>
            </div>
            
            <h4 class="mb-1">{{ user.displayName || user.username }}</h4>
            <p class="text-muted">{{ user.email }}</p>
            
            <div class="d-flex justify-content-center gap-3 mb-3">
              <div class="text-center">
                <div class="fw-bold">{{ posts.length }}</div>
                <div class="small text-muted">Posts</div>
              </div>
              <div class="text-center">
                <div class="fw-bold">{{ totalLikes }}</div>
                <div class="small text-muted">Likes</div>
              </div>
              <div class="text-center">
                <div class="fw-bold">{{ totalViews }}</div>
                <div class="small text-muted">Views</div>
              </div>
            </div>
            
            <div class="mb-3">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title">About</h6>
                  <p class="card-text">{{ user.bio || 'No bio provided' }}</p>
                </div>
              </div>
            </div>
            
            <button v-if="isOwnProfile" 
                    class="btn btn-outline-primary w-100" 
                    data-bs-toggle="modal" 
                    data-bs-target="#editProfileModal">
              <i class="bi bi-pencil me-2"></i>Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      <!-- Posts Section -->
      <div class="col-md-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3>{{ user.displayName || user.username }}'s Posts</h3>
          <div class="btn-group">
            <button class="btn btn-outline-secondary" :class="{ active: sortBy === 'date' }" @click="sortBy = 'date'">
              <i class="bi bi-calendar"></i> Latest
            </button>
            <button class="btn btn-outline-secondary" :class="{ active: sortBy === 'popular' }" @click="sortBy = 'popular'">
              <i class="bi bi-graph-up"></i> Popular
            </button>
          </div>
        </div>
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>
        
        <div v-else-if="posts.length === 0" class="text-center py-5">
          <i class="bi bi-file-earmark-text display-1 text-muted"></i>
          <h4 class="mt-3">No posts yet</h4>
          <p class="text-muted">This user hasn't published any posts</p>
        </div>
        
        <div v-else class="row g-4">
          <div v-for="post in sortedPosts" :key="post.id" class="col-md-6">
            <PostCard :post="post" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Profile Modal -->
    <div class="modal fade" id="editProfileModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateProfile">
              <div class="mb-3">
                <label for="displayName" class="form-label">Display Name</label>
                <input v-model="form.displayName" type="text" class="form-control" id="displayName">
              </div>
              <div class="mb-3">
                <label for="bio" class="form-label">Bio</label>
                <textarea v-model="form.bio" class="form-control" id="bio" rows="4"></textarea>
              </div>
              <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="updating">
                  {{ updating ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Avatar Upload Modal -->
    <div class="modal fade" id="avatarModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Update Profile Picture</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="avatarUrl" class="form-label">Image URL</label>
              <input v-model="form.avatar" type="url" class="form-control" id="avatarUrl">
            </div>
            <div v-if="form.avatar" class="text-center mb-3">
              <img :src="form.avatar" class="img-thumbnail" style="max-height: 200px;">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="updateAvatar" :disabled="updating">
              {{ updating ? 'Saving...' : 'Update Picture' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-5">
    <div class="spinner-border" role="status"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { db, collection, query, where, onSnapshot, getDocs, doc, getDoc } from '@/firebase';
import axios from 'axios';
import PostCard from '@/components/PostCard.vue';

const route = useRoute();
const authStore = useAuthStore();
const user = ref(null);
const posts = ref([]);
const loading = ref(true);
const updating = ref(false);
const sortBy = ref('date');

const form = ref({
  displayName: '',
  bio: '',
  avatar: ''
});

const isOwnProfile = computed(() => 
  authStore.isAuthenticated && authStore.user.uid === route.params.id
);

const totalLikes = computed(() => 
  posts.value.reduce((sum, post) => sum + (post.likes || 0), 0)
);

const totalViews = computed(() => 
  posts.value.reduce((sum, post) => sum + (post.views || 0), 0)
);

const sortedPosts = computed(() => {
  if (sortBy.value === 'popular') {
    return [...posts.value].sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  return [...posts.value].sort((a, b) => 
    new Date(b.createdAt?.toDate?.() || b.createdAt) - 
    new Date(a.createdAt?.toDate?.() || a.createdAt)
  );
});

onMounted(async () => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', route.params.id));
    if (userDoc.exists()) {
      user.value = { id: userDoc.id, ...userDoc.data() };
      form.value = {
        displayName: user.value.displayName || '',
        bio: user.value.bio || '',
        avatar: user.value.avatar || ''
      };
    }
    
    // Get user's posts
    const postsQuery = query(
      collection(db, 'posts'), 
      where('authorId', '==', route.params.id),
      where('status', '==', 'published')
    );
    
    onSnapshot(postsQuery, (snapshot) => {
      posts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loading.value = false;
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    loading.value = false;
  }
});

const updateProfile = async () => {
  if (!isOwnProfile.value) return;
  
  updating.value = true;
  try {
    await axios.put(`/api/users/${authStore.user.uid}/profile`, {
      displayName: form.value.displayName,
      bio: form.value.bio
    });
    
    // Update local user data
    user.value = {
      ...user.value,
      displayName: form.value.displayName,
      bio: form.value.bio
    };
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  } finally {
    updating.value = false;
  }
};

const updateAvatar = async () => {
  if (!isOwnProfile.value || !form.value.avatar) return;
  
  updating.value = true;
  try {
    await axios.put(`/api/users/${authStore.user.uid}/avatar`, {
      avatar: form.value.avatar
    });
    
    // Update local user data
    user.value = {
      ...user.value,
      avatar: form.value.avatar
    };
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error updating avatar:', error);
    alert('Failed to update profile picture');
  } finally {
    updating.value = false;
  }
};
</script>
<template>
  <div class="container py-4">
    <div class="row">
      <!-- Profile Sidebar -->
      <div class="col-md-4 mb-4">
        <div class="card">
          <div class="card-body text-center">
            <div class="position-relative d-inline-block mb-3">
              <img :src="profile.avatar || '/default-avatar.png'" class="rounded-circle" width="120" height="120" style="object-fit: cover;">
              <label v-if="isOwnProfile" for="avatar-upload" class="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm" style="cursor: pointer;">
                <i class="bi bi-camera"></i>
                <input id="avatar-upload" type="file" accept="image/*" class="d-none" @change="uploadAvatar">
              </label>
            </div>
            <h5 class="mb-1">{{ profile.username || profile.displayName || 'User' }}</h5>
            <p class="text-muted small">{{ profile.email }}</p>
            <div class="d-flex justify-content-center gap-2 mb-3">
              <span class="badge bg-primary">{{ profile.role || 'user' }}</span>
              <span v-if="profile.isVerified" class="badge bg-success">Verified</span>
            </div>
            <div v-if="isOwnProfile" class="d-grid">
              <button class="btn btn-outline-primary btn-sm" @click="editMode = !editMode">
                <i class="bi" :class="editMode ? 'bi-x-lg' : 'bi-pencil'"></i>
                {{ editMode ? 'Cancel Edit' : 'Edit Profile' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-header bg-light">
            <h5 class="card-title mb-0">{{ editMode ? 'Edit Profile' : 'Profile Information' }}</h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status"></div>
            </div>
            <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
            
            <!-- View Mode -->
            <div v-if="!editMode">
              <div class="row mb-3">
                <div class="col-sm-3 text-muted">Username</div>
                <div class="col-sm-9">{{ profile.username || 'Not set' }}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3 text-muted">Full Name</div>
                <div class="col-sm-9">{{ profile.displayName || 'Not set' }}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3 text-muted">Email</div>
                <div class="col-sm-9">{{ profile.email }}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3 text-muted">Bio</div>
                <div class="col-sm-9">{{ profile.bio || 'No bio provided' }}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-3 text-muted">Joined</div>
                <div class="col-sm-9">{{ formatDate(profile.createdAt) }}</div>
              </div>
            </div>
            
            <!-- Edit Mode -->
            <form v-else @submit.prevent="saveProfile">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input type="text" class="form-control" id="username" v-model="form.username">
              </div>
              <div class="mb-3">
                <label for="displayName" class="form-label">Full Name</label>
                <input type="text" class="form-control" id="displayName" v-model="form.displayName">
              </div>
              <div class="mb-3">
                <label for="bio" class="form-label">Bio</label>
                <textarea class="form-control" id="bio" rows="3" v-model="form.bio"></textarea>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="editMode = false">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { db, storage } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const profile = ref({});
const loading = ref(true);
const error = ref(null);
const editMode = ref(false);
const saving = ref(false);

const form = ref({
  username: '',
  displayName: '',
  bio: ''
});

const isOwnProfile = computed(() => {
  return authStore.user && authStore.user.uid === route.params.id;
});

const fetchProfile = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', route.params.id));
    if (userDoc.exists()) {
      profile.value = { id: userDoc.id, ...userDoc.data() };
      
      // Initialize form with current values
      form.value = {
        username: profile.value.username || '',
        displayName: profile.value.displayName || '',
        bio: profile.value.bio || ''
      };
    } else {
      error.value = 'User not found';
      router.push('/');
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    error.value = 'Failed to load profile';
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  if (!isOwnProfile.value) return;
  
  saving.value = true;
  try {
    await updateDoc(doc(db, 'users', authStore.user.uid), {
      username: form.value.username,
      displayName: form.value.displayName,
      bio: form.value.bio,
      updatedAt: new Date()
    });
    
    // Update local profile
    profile.value = {
      ...profile.value,
      ...form.value
    };
    
    // Update auth store profile
    await authStore.fetchProfile();
    
    editMode.value = false;
  } catch (err) {
    console.error('Error updating profile:', err);
    error.value = 'Failed to update profile';
  } finally {
    saving.value = false;
  }
};

const uploadAvatar = async (event) => {
  if (!isOwnProfile.value) return;
  
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file type and size
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
  }
  
  loading.value = true;
  try {
    // Upload to Firebase Storage
    const avatarRef = storageRef(storage, `avatars/${authStore.user.uid}`);
    await uploadBytes(avatarRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(avatarRef);
    
    // Update user document
    await updateDoc(doc(db, 'users', authStore.user.uid), {
      avatar: downloadURL,
      updatedAt: new Date()
    });
    
    // Update local profile
    profile.value.avatar = downloadURL;
    
    // Update auth store profile
    await authStore.fetchProfile();
  } catch (err) {
    console.error('Error uploading avatar:', err);
    error.value = 'Failed to upload avatar';
  } finally {
    loading.value = false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

onMounted(() => {
  fetchProfile();
});
</script>
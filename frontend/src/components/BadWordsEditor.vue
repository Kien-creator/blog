<template>
  <div>
    <button @click="openEditor" class="btn btn-primary">
      <i class="bi bi-pencil me-1"></i>Edit Bad Words List
    </button>

    <!-- Bad Words Modal -->
    <div class="modal fade" id="badWordsEditorModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Bad Words List</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted">Add words that should be flagged in comments and posts (one per line)</p>
            <textarea v-model="badWordsText" class="form-control" rows="10" placeholder="Enter bad words here, one per line"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveList" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const authStore = useAuthStore();
const badWordsText = ref('');
const badWords = ref([]);
const saving = ref(false);

onMounted(async () => {
  await loadBadWords();
});

const loadBadWords = async () => {
  try {
    const response = await axios.get('/api/settings/bad-words');
    badWords.value = response.data.words || [];
    badWordsText.value = badWords.value.join('\n');
  } catch (error) {
    console.error('Error loading bad words list:', error);
    badWords.value = [];
    badWordsText.value = '';
  }
};

const openEditor = async () => {
  if (!authStore.isAdmin) {
    alert('You need admin privileges to edit bad words list');
    return;
  }
  
  // Reload the list to ensure it's up to date
  await loadBadWords();
  
  // Open modal using dynamic import
  import('bootstrap').then(bootstrap => {
    const modal = new bootstrap.Modal(document.getElementById('badWordsEditorModal'));
    modal.show();
  }).catch(error => {
    console.error('Error loading Bootstrap:', error);
    alert('Could not open editor. Please try again.');
  });
};

const saveList = async () => {
  if (!authStore.isAdmin) {
    alert('You need admin privileges to save bad words list');
    return;
  }
  
  saving.value = true;
  try {
    const newBadWords = badWordsText.value
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    await axios.put('/api/settings/bad-words', { words: newBadWords });
    badWords.value = newBadWords;
    
    // Close modal
    import('bootstrap').then(bootstrap => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('badWordsEditorModal'));
      if (modal) modal.hide();
    }).catch(() => {
      // Manual fallback if Bootstrap fails
      document.getElementById('badWordsEditorModal').classList.remove('show');
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    });
    
    alert('Bad words list updated successfully');
  } catch (error) {
    console.error('Error saving bad words list:', error);
    alert('Failed to update bad words list: ' + error.message);
  } finally {
    saving.value = false;
  }
};
</script>
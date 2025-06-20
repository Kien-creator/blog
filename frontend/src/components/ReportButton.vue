<template>
  <div>
    <button @click="showReportModal" class="btn btn-sm btn-outline-danger">
      <i class="bi bi-flag me-1"></i>Report
    </button>

    <!-- Report Modal -->
    <div class="modal fade" id="reportModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Report Content</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitReport">
              <div class="mb-3">
                <label class="form-label">Reason for reporting</label>
                <select v-model="reportForm.reason" class="form-select" required>
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Misinformation">Misinformation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="mb-3" v-if="reportForm.reason === 'Other'">
                <label class="form-label">Please specify</label>
                <textarea v-model="reportForm.details" class="form-control" rows="3" required></textarea>
              </div>
              <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-danger" :disabled="submitting">
                  {{ submitting ? 'Submitting...' : 'Submit Report' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

const props = defineProps({
  contentType: {
    type: String,
    required: true,
    validator: (value) => ['post', 'comment'].includes(value)
  },
  contentId: {
    type: String,
    required: true
  },
  contentExcerpt: {
    type: String,
    default: ''
  },
  postId: {
    type: String,
    default: null
  }
});

const authStore = useAuthStore();
const submitting = ref(false);
const reportForm = ref({
  reason: '',
  details: ''
});

const showReportModal = () => {
  if (!authStore.isAuthenticated) {
    alert('Please login to report content');
    return;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('reportModal'));
  modal.show();
};

const submitReport = async () => {
  if (!authStore.isAuthenticated) return;
  
  submitting.value = true;
  try {
    const reason = reportForm.reason === 'Other' 
      ? `Other: ${reportForm.details}` 
      : reportForm.reason;
    
    await axios.post('/api/reports', {
      contentType: props.contentType,
      contentId: props.contentId,
      postId: props.postId || props.contentId,
      reason,
      contentExcerpt: props.contentExcerpt
    });
    
    // Reset form
    reportForm.value = {
      reason: '',
      details: ''
    };
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
    if (modal) modal.hide();
    
    alert('Thank you for your report. Our moderators will review it shortly.');
  } catch (error) {
    console.error('Error submitting report:', error);
    alert('Failed to submit report. Please try again.');
  } finally {
    submitting.value = false;
  }
};
</script>
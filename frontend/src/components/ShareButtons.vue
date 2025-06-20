<template>
  <div class="share-buttons">
    <button class="share-btn" @click="share('facebook')" title="Share on Facebook">
      <i class="bi bi-facebook"></i>
    </button>
    <button class="share-btn" @click="share('twitter')" title="Share on Twitter">
      <i class="bi bi-twitter-x"></i>
    </button>
    <button class="share-btn" @click="copyLink" title="Copy link">
      <i class="bi bi-link-45deg"></i>
    </button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  post: Object,
});

const share = (platform) => {
  const url = encodeURIComponent(window.location.origin + `/post/${props.post.id}`);
  const title = encodeURIComponent(props.post.title);
  let shareUrl;
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'twitter':
      shareUrl = `https://x.com/intent/tweet?url=${url}&text=${title}`;
      break;
  }
  window.open(shareUrl, '_blank');
};

const copyLink = () => {
  navigator.clipboard.writeText(window.location.origin + `/post/${props.post.id}`);
  alert('Link copied to clipboard!');
};
</script>

<style scoped>
.share-buttons {
  display: flex;
  gap: 8px;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background-color: #f8f9fa;
  color: #6c757d;
  transition: all 0.2s;
  font-size: 1rem;
}

.share-btn:hover {
  background-color: #e9ecef;
}

.share-btn:first-child:hover {
  color: #3b5998;
}

.share-btn:nth-child(2):hover {
  color: #1da1f2;
}
</style>
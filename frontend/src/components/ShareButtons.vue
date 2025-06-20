<template>
  <div class="btn-group">
    <button class="btn btn-sm btn-outline-primary" @click="share('facebook')">
      <i class="bi bi-facebook"></i>
    </button>
    <button class="btn btn-sm btn-outline-primary" @click="share('twitter')">
      <i class="bi bi-x"></i>
    </button>
    <button class="btn btn-sm btn-outline-primary" @click="copyLink">
      <i class="bi bi-link"></i>
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
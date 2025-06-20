import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/store/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/styles.css';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component('QuillEditor', QuillEditor);

const authStore = useAuthStore();
authStore.initAuthListener();

app.mount('#app');
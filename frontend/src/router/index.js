import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

const Home = () => import('@/views/Home.vue');
const Login = () => import('@/views/Login.vue');
const Register = () => import('@/views/Register.vue');
const ForgotPwd = () => import('@/views/ForgottenPassword.vue');
const Bookmarks = () => import('@/views/Bookmarks.vue');
const PostManager = () => import('@/views/PostManager.vue');
const PostDetail = () => import('@/views/PostDetail.vue');
const Profile = () => import('@/views/Profile.vue');
const Admin = () => import('@/views/Admin.vue');

const PostEditor = () => import('@/views/PostEditor.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/forgotten-password', name: 'ForgotPwd', component: ForgotPwd },
  { path: '/bookmarks', name: 'Bookmarks', component: Bookmarks, meta: { requiresAuth: true } },
  { path: '/post-manager', name: 'PostManager', component: PostManager, meta: { requiresAuth: true } },
  { path: '/post/new', name: 'PostEditor', component: PostEditor, meta: { requiresAuth: true } },
  { path: '/post/:id/edit', name: 'PostEdit', component: PostEditor, meta: { requiresAuth: true } },
  { path: '/post/:id', name: 'PostDetail', component: PostDetail },
  { path: '/profile/:id', name: 'Profile', component: Profile },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAdmin: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (authStore.user === null) {
    await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          authStore.user = user;
          await authStore.fetchProfile();
        }
        unsubscribe();
        resolve();
      });
    });
  }

  if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) return '/';
  if (to.meta.requiresAuth && !authStore.isAuthenticated) return '/login';
  if (to.meta.requiresAdmin && !authStore.isAdmin) return '/';

  return true;
});

export default router;

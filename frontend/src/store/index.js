import { defineStore } from 'pinia';
import { db, collection, query, where, getDocs, onSnapshot } from '@/firebase';
import axios from 'axios';

export const useStore = defineStore('main', {
  state: () => ({
    posts: [],
    bookmarks: [],
  }),

  actions: {
    async fetchPosts() {
      try {
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, where('status', '==', 'published'));
        onSnapshot(postsQuery, (snapshot) => {
          this.posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
      } catch (error) {
        console.error('Error setting up posts listener:', error);
      }
    },

    async fetchBookmarks(userId) {
      if (!userId) return;
      try {
        const bookmarksRef = collection(db, 'bookmarks');
        const bookmarksQuery = query(bookmarksRef, where('userId', '==', userId));
        onSnapshot(bookmarksQuery, (snapshot) => {
          this.bookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
      } catch (error) {
        console.error('Error setting up bookmarks listener:', error);
      }
    },

    async toggleBookmark(postId) {
      try {
        const bookmarksRef = collection(db, 'bookmarks');
        const bookmarkQuery = query(
          bookmarksRef,
          where('userId', '==', this.user?.uid),
          where('postId', '==', postId)
        );
        const bookmarkSnapshot = await getDocs(bookmarkQuery);
        if (bookmarkSnapshot.empty) {
          await axios.post('/api/bookmarks', { postId });
        } else {
          await axios.delete(`/api/bookmarks/${bookmarkSnapshot.docs[0].id}`);
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
      }
    },
  },
});
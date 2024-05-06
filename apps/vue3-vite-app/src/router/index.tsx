import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'List',
      component: import('../views/List.vue'),
    },
    {
      path: '/detail',
      name: 'Detail',
      component: import('../views/Detail.vue'),
    },
    {
      path: '/editor',
      name: 'Editor',
      component: import('../views/Editor.vue'),
    }
  ],
});

export default router;

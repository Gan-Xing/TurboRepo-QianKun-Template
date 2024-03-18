<template>
  <div class="grid-container">
    <div class="grid-item" v-for="item in items" :key="item">
      {{ item }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const generateItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => `格子 ${i + 1}`);
};

const items = ref<string[]>(generateItems(15));
</script>

<style>
/* 基本格子样式 */
.grid-container {
  display: flex;
  flex-wrap: wrap;
  gap: 32px; /* 设置格子之间的间隔 */
}

.grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2); /* 设置为更不透明的白色背景 */
  backdrop-filter: blur(10px); /* 应用毛玻璃效果 */
  text-align: center;
  box-sizing: border-box;
  transition: transform 0.3s ease; /* 平滑过渡效果 */
}

/* 鼠标悬停效果 */
.grid-item:hover {
  transform: scale(1.05); /* 缩放效果 */
  background-color: rgba(0, 0, 0, 0.1); /* 设置为更不透明的白色背景 */
}

/* 响应式布局 */
@media (min-width: 1200px) {
  /* 大屏幕：一行5个 */
  .grid-item {
    flex: 1 0 calc(20% - 32px);
    height: calc((100vw - 200px) / 5); /* 使格子成为正方形 */
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  /* 中等屏幕：一行4个 */
  .grid-item {
    flex: 1 0 calc(25% - 32px);
    height: calc((100vw - 160px) / 4);
  }
}

@media (max-width: 767px) {
  /* 小屏幕：一行3个 */
  .grid-item {
    flex: 1 0 calc(33.3333% - 32px);
    height: calc((100vw - 120px) / 3);
  }
}
</style>

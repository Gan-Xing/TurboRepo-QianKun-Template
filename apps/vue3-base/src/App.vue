<template>
  <a-layout id="app">
    <a-sider collapsed-width="0" theme="dark">
      <div class="logo">
        <img src="http://www.fline88.com/public/img/footerLogo.2cb844a3.png" alt="" class="page-logo" />
      </div>
      <a-menu theme="dark" mode="inline" :selectedKeys="[selectedPath]">
        <a-menu-item v-for="item in menuItems" :key="item.path">
          <router-link :to="item.path">{{ item.title }}</router-link>
        </a-menu-item>
      </a-menu>
    </a-sider>
    <a-layout>
      <a-header style="padding: 0"></a-header>
      <a-content style="margin: 24px 16px 0; height: 100%; background: #fff; padding: 24px;">
        <router-view />
        <div id="sub-app"></div>
      </a-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { Layout, Menu } from 'ant-design-vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'App',
  components: {
    'a-layout': Layout,
    'a-header': Layout.Header,
    'a-content': Layout.Content,
    'a-sider': Layout.Sider,
    'a-menu': Menu,
    'a-menu-item': Menu.Item,
  },
  setup() {
    function extractPathSegment(path:string) {
      // 从路径中提取一级路由部分
      const segments = path.split('/').filter(Boolean);
      return segments.length ? `/${segments[0]}` : '/';
    }
    const route = useRoute();
    const selectedPath = ref(extractPathSegment(route.path));

    // 菜单项配置
    const menuItems = [
      { title: 'Home', path: '/' },
      { title: 'React子项目', path: '/sub-react' },
      { title: 'Vue3子项目', path: '/sub-vue' },
    ];

    // 监听路由变化，更新选中的菜单项
    watch(() => route.path, (newPath) => {
      selectedPath.value = extractPathSegment(newPath);
    });

    // 重写history.pushState方法
    const _wr = () => {
      const origPushState = history.pushState;
      history.pushState = function (...args) {
        const result = origPushState.apply(this, args);
        const event = new Event('pushState');
        window.dispatchEvent(event);
        return result;
      };
    };

    // 在pushState事件中进行额外的逻辑处理
    const bindHistory = () => {
      selectedPath.value = extractPathSegment(window.location.pathname);
    };

    onMounted(() => {
      _wr();
      window.addEventListener('pushState', bindHistory);
    });

    onUnmounted(() => {
      window.removeEventListener('pushState', bindHistory);
    });

    return { selectedPath, menuItems };
  },
});
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.logo img {
  height: 100%;
}
</style>

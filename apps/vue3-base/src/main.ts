import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { registerMicroApps, start } from 'qiankun';
import HelloWorld from './components/HelloWorld.vue';

import './style.css';
// 定义子应用列表
const microApps = [
	{
		name: 'sub-react', // 子应用的名称
		entry: '//localhost:3001', // 默认会加载这个路径下的html，解析里面的js
		activeRule: '/sub-react', // 匹配的路由
		container: '#sub-app' // 加载的容器
	},
	{
		name: 'sub-vue', // 子应用的名称
		entry: '//localhost:3002', // 默认会加载这个路径下的html，解析里面的js
		activeRule: '/sub-vue', // 匹配的路由
		container: '#sub-app' // 加载的容器
	},
];

// 注册子应用
registerMicroApps(microApps, {
	beforeLoad: [async (app) => console.log(`before load ${app.name}`)],
	beforeMount: [async (app) => console.log(`before mount ${app.name}`)],
	afterMount: [async (app) => console.log(`after mount ${app.name}`)]
});

// 启动乾坤
start();

// 初始化Vue应用
const app = createApp(App);

// 配置路由
const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', component: HelloWorld }
		// 乾坤子应用的路由将自动处理，无需在此注册
	]
});

app.use(router);
app.mount('#app');

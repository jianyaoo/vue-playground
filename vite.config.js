import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path'
import { glob } from "glob";
import history from 'connect-history-api-fallback'
import path from 'path';
import fs from 'fs';
import { normalizePath } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import htmlTemplate from 'vite-plugin-html-template-mpa';

const pageEntry = {};
const multiPage = {};
const pages = {};
let defaultPage = '';
async function getInput() {
  const allEntry = await glob('./src/pages/**/**/index.html');

  defaultPage = `/${allEntry[0].split('/').slice(2).join('/')}`;

  allEntry.forEach((entry) => {
    const pathArr = entry.split('/')
    const name = `${pathArr.at(-3)}/${pathArr.at(-2)}`
    pages[pathArr.at(-2)] = {};
    multiPage[name] = {
      name,
      rootPage: `/${entry}`,
    };
    pageEntry[name] = resolve(__dirname, `/${entry}`)
  })
}

await getInput();


function pathRewritePlugin() {
  const rules = [];
  Reflect.ownKeys(multiPage).forEach((key) => {
    rules.push({
      from: `/${multiPage[key].name}`,
      to: `${multiPage[key].rootPage}`,
    });
  });
  return {
    name: "path-rewrite-plugin",
    configureServer(server) {
      server.middlewares.use(
        history({
          htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
          disableDotRule: false,
          rewrites: rules,
        })
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    pathRewritePlugin()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build:{
    rollupOptions:{
      input: pageEntry,
      // output: {
      //   entryFileNames: 'js/[name].js',        // 输出的 JS 文件名格式
      //   chunkFileNames: 'assets/[name].js', // 共享 chunk 的 JS 文件放在 assets 文件夹下
      //   assetFileNames: 'assets/[name].[ext]', // 其他静态资源的输出文件格式
      // }
    },
  },
  server:{
    open: defaultPage, // 设置启动后自动打开浏览器
    setupMiddlewares: (middlewares, server) => { // 开发状态下路由重定向，访问跟目录时重定向到某个路径
      middlewares.push(
        history({
          rewrites: [
            { from: /^\/$/, to: defaultPage }
          ]
        })
      )
      return middlewares
    }
  }
})

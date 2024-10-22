import path from 'path';
import fs from 'fs';
import { normalizePath  } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default function myHtmlPagesPlugin() {
  return {
    name: 'vite-plugin-html-pages',
    apply: 'build',
    // configResolved(config) {
    //   console.log(this)
    //   this.resolvedConfig = config;
    // },
    async generateBundle(_, bundle) {
      console.log("=============")
      console.log(this)
      const srcDir = path.resolve(__dirname, 'src/pages');
      const destDir = path.resolve(__dirname, 'dist');

      const htmlFiles = [];

      // 遍历 src/pages 目录并找到所有的 index.html 文件
      const traversePages = (dir) => {
        fs.readdirSync(dir).forEach((file) => {
          const absolutePath = path.join(dir, file);
          const relativePath = path.relative(srcDir, absolutePath);
          const stats = fs.statSync(absolutePath);

          if (stats.isDirectory()) {
            traversePages(absolutePath);
          } else if (stats.isFile() && file === 'index.html') {
            htmlFiles.push({ absolutePath, relativePath });
          }
        });
      };

      // 开始遍历 src/pages 目录
      traversePages(srcDir);

      for (const { absolutePath, relativePath } of htmlFiles) {
        // 使用 Vite 的 transformIndexHtml 来处理 HTML 文件
        const htmlContent = await transformIndexHtml(
          normalizePath(absolutePath),
          fs.readFileSync(absolutePath, 'utf-8')
        );

        // 构建后的输出路径
        const outputFilePath = path.join(
          destDir,
          relativePath.replace(/\/index\.html$/, '.html')
        );

        // 将处理后的 HTML 文件 emit 到构建输出中
        this.emitFile({
          type: 'asset',
          fileName: path.relative(destDir, outputFilePath),
          source: htmlContent,
        });
      }
    },
  };
}

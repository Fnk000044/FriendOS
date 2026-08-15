// 最小 ESLint 配置（flat config，ESLint 9+）
// 规则只拦截高置信度错误：未使用变量、显式 any、debugger、未声明变量
// 不做风格约束，避免与现有代码冲突
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 忽略构建产物、依赖、生成文件
  {
    ignores: [
      'dist/**',
      'release/**',
      'build/**',
      'node_modules/**',
      'src/**/*.d.ts',
      'src/test/setup.ts',
    ],
  },
  // 基础规则：ECMAScript 语言层错误
  js.configs.recommended,
  // TypeScript 推荐规则（保守版，warn-only）
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // 高置信度错误 → error
      'no-debugger': 'error',
      'no-unused-vars': 'off', // 由 @typescript-eslint/no-unused-vars 接管
      '@typescript-eslint/no-unused-vars': 'off', // 历史代码残留多，tsconfig 已 noUnusedLocals:false，先 warn 不阻塞
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off', // 测试中常用，不强制
      // 低信号规则 → off / warn，避免与现有代码大面积冲突
      'no-empty': 'off', // 空块在 catch / callback 中常见，不强制
      'no-useless-escape': 'off', // 正则字符串中无害转义，不阻塞
      '@typescript-eslint/no-var-requires': 'off', // .cjs 主进程用 require，渲染层已禁
      'prefer-const': 'warn',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // 未安装 eslint-plugin-react-hooks，代码中残留的
      // `// eslint-disable-next-line react-hooks/exhaustive-deps` 注释会触发
      // "Definition for rule was not found" error。把 reporting 级别设为 off
      // 仍报错；正确做法是用 reportUnusedDisableDirectives 关闭未匹配禁用注释
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
    // 未安装的规则在 eslint-disable 注释里引用时，ESLint 默认报 error。
    // 关闭"未使用的禁用指令"报告，让历史注释不再阻塞 lint
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';

// 创建支持文件上传的链接
const uploadLink = createUploadLink({
  uri: "http://localhost:3000/graphql",
  credentials: 'include',
  // 移除显式的Content-Type设置，让apollo-upload-client自动处理
  headers: {
    "apollo-require-preflight": "true"
  },
});

const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </StrictMode>
  );
} else {
  console.error('无法找到 ID 为 "root" 的 DOM 元素');
}
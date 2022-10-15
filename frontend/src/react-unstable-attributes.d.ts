import React from 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> extends React.HTMLAttributes<T> {
    loading?: 'auto' | 'eager' | 'lazy';
  }
}

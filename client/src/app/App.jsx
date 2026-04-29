// src/app/App.jsx
import React from 'react';
import Providers from './Providers';
import AppRouter from './Router';

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

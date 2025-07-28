import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthContextProvider from './context/AuthContextProvider.tsx';
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    ),
    errorElement: <div>Page not found</div>,
  }
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)

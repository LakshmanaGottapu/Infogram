import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthContextProvider from './context/AuthProvider.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Feed from './components/Feed.tsx';
import RegisterLogin from './components/RegisterLogin.tsx';
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    ),
    children: [
      {
        index: true,
        element: <ProtectedRoute redirectIfSuccess="/feed" ><RegisterLogin /></ProtectedRoute>
      },
      {
        path: 'feed',
        element: <ProtectedRoute redirectIfFailure="/"><Feed /></ProtectedRoute>
      }
    ],
    errorElement: <div>Page not found</div>,
  },
  {
    path: 'about',
    element: <div>About Page</div>
  }
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)

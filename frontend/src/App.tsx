import './App.css'
import { Outlet } from 'react-router-dom'
import useAuth from './hooks/useAuth';
function App() {
  const user = useAuth();

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100">
      <span className="text-3xl font-bold">Hello World</span>
      {user && (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <img src={user.profilePictureUrl} alt={`${user.username}'s profile`} />
        </div>
      )}
      <Outlet />
    </div>
  )
}

export default App

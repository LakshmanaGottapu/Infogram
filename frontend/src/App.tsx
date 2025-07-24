import './App.css'
import useAuth from './hooks/useAuth';
import RegisterLogin from './components/RegisterLogin';
function App() {
  const user = useAuth();

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100">
      <span className="text-3xl font-bold">Hello World</span>
      {user ? (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <img src={user.profilePictureUrl} alt={`${user.username}'s profile`} />
        </div>
      ) : (
        <RegisterLogin />
      )}
    </div>
  )
}

export default App

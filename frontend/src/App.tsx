import './App.css'
import Feed from './components/Feed';
import RegisterLogin from './components/RegisterLogin';
import useAuth from './hooks/useAuth';

function App() {
  const {user, setUser, loading} = useAuth();
  function handleLogout() {
    //clear refresh token by calling logout endpoint
    fetch('/api/auth/logout')
    .then(response => {
      if (!response.ok) {
        console.error('Logout failed');
        return;
      }
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('username');
      setUser(null);
      console.log('Logout successful');
    })
  }
  if(loading) return <div>...loading</div>
  else return (
    <div className="App">
      <span className="text-3xl font-bold">Hello World</span>
      {
        user ? (<>
        <header className="bg-gray-800 text-white p-4">
          <h1 className="text-2xl">Instagram Clone</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="/feed">Feed</a></li>
              <li><a href="/profile">Profile</a></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
          </nav>
        </header>
        <main className="p-4">
          <h3>Welcome, {user.username}!</h3>
          <Feed />
        </main>
        </>
        ) : (
          <RegisterLogin setUser={setUser} />
        )
      }
    </div>
  )
}

export default App

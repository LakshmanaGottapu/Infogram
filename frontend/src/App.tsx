import useAuth from './context/useAuth';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import "./App.css";
function App() {
  const { loading } = useAuth();
 
  if (loading) return <div>...loading</div>
  else return (
    <>
      <Header />
      <main className="p-4">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default App

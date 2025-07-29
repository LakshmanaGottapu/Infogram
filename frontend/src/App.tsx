import useAuth from './context/useAuth';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import "./App.css";
import LoadSpinner from './components/LoadSpinner';
function App() {
  const { loading } = useAuth();

  if (loading) return <LoadSpinner className='h-screen' />;
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

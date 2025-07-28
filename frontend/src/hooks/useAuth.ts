import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth.ts";
import type { User } from "../types/user.ts";
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  async function fetchUser(retries = 2) {
    let currentUser : null | User;
    for(let i=0; i<retries; i++) {
      try{
        currentUser = await getCurrentUser();
        if(currentUser){
          setUser(currentUser);
          break;
        }
        else if (!currentUser && i<retries) continue;
        else handleNavigation("/");
      } catch (error) {
          if(i<retries){
            await new Promise((res) => setTimeout(res, 1000));
          }
          else{
            console.error("Error fetching user:", error);
            // setUser(null);
            // Optionally redirect to login or show an error message
            if (location.pathname !== "/") handleNavigation("/");
          }
      }
    }
    setLoading(false);
  }
  useEffect(() => {
    fetchUser(2);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return {user, setUser, loading};
}

export default useAuth;

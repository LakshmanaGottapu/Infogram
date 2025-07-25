import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth.ts";
import type { User } from "../types/user.ts";
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try{
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          handleNavigation("/");
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        // Optionally redirect to login or show an error message
        if (location.pathname !== "/") handleNavigation("/");
      }
    };

    fetchUser();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return {user, setUser};
}

export default useAuth;

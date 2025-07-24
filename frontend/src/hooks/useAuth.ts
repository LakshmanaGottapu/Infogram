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
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        handleNavigation("/login");
      } else {
        setUser(currentUser);
      }
    };

    fetchUser();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return user;
}

export default useAuth;

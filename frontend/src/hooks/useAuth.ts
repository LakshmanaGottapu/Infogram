import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth.ts";
import type { User } from "../types/user.ts";
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async function(retries = 2) {
    let currentUser : null | User;
    for(let i=0; i<retries; i++) {
      try{
        currentUser = await getCurrentUser();
        if(currentUser){
          setUser(currentUser);
          break;
        }
        else if (!currentUser && i<retries) continue;
        else navigate("/");
      } catch (error) {
          if(i<retries){
            await new Promise((res) => setTimeout(res, 1000));
          }
          else{
            console.error("Error fetching user:", error);
            navigate("/");
          }
      }
    }
    setLoading(false);
  },[navigate]); 
  useEffect(() => {
    fetchUser(2);
  }, [location.pathname, fetchUser]); 
  return {user, setUser, loading};
}

export default useAuth;

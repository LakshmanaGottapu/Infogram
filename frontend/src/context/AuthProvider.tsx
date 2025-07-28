import { useMemo, useState, useEffect, type ReactNode } from "react";
import {type User} from "../types/user.ts"
import {AuthContext} from "./useAuth.ts";
import {fetchCurrentUser} from "../api/auth.ts";

const AuthContextProvider = ({children}:{children:ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(()=>{
        (async () => {
            const currentUser = await fetchCurrentUser(2);
            if (currentUser) {
                setUser(currentUser);
            } else {
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('username');
            }
            setLoading(false);
        })()
    }, []);
    
    const value = useMemo(() => ({ user, setUser, loading, setLoading }), [user, setUser, loading]);
    return (<AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>)
}

export default AuthContextProvider;

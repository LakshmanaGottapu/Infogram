import { useMemo, type ReactNode } from "react";
import authContext from "./authContext";
import useAuth from "../hooks/useAuth";

const AuthContextProvider = ({children}:{children:ReactNode}) => {
    const {user, setUser, loading} = useAuth();
    const value = useMemo(() => ({ user, setUser, loading }), [user, setUser, loading]);
    return (<authContext.Provider value={value}>
        {children}
    </authContext.Provider>)
}

export default AuthContextProvider;

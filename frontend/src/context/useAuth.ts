import {type User} from '../types/user';
import { useContext, createContext, type Dispatch, type SetStateAction } from "react";

type AuthContextType = {
    user : User | null,
    setUser: Dispatch<SetStateAction<User | null>>,
    loading: boolean,
    setLoading: Dispatch<SetStateAction<boolean>>
}
export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser : () => {},
    loading: true,
    setLoading: () => {}
})

function useAuth(){
    return useContext(AuthContext);
}

export default useAuth;
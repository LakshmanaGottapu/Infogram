import {type User} from '../types/user';
import { createContext, type Dispatch, type SetStateAction } from "react";


type AuthContextType = {
    user : User | null,
    setUser: Dispatch<SetStateAction<User | null>>,
    loading: boolean
}
const authContext = createContext<AuthContextType>({
    user: null,
    setUser : () => {},
    loading: true
})

export default authContext;
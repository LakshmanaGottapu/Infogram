import { useEffect, type ReactNode } from 'react'
import useAuth from '../context/useAuth'
import { useNavigate } from 'react-router-dom';
type ProtectedRouteProps = {
  readonly children: ReactNode;
  readonly redirectIfSuccess?: string;
  readonly redirectIfFailure?: string;
};

function ProtectedRoute({ children, redirectIfSuccess, redirectIfFailure }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (user && redirectIfSuccess) navigate(redirectIfSuccess);
        else if(user && !redirectIfSuccess) return;
        else if (!user && redirectIfFailure) navigate(redirectIfFailure);
        else navigate(redirectIfFailure || '/');
    }, [user]); //eslint-disable-line react-hooks/exhaustive-deps

    if (loading) return <>...Loading</>;
    else return (
        <>
            {children}
        </>
    );
}

export default ProtectedRoute

import { useParams, Navigate } from 'react-router-dom';

const CommunityRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/community?post=${id}`} replace />;
};

export default CommunityRedirect;

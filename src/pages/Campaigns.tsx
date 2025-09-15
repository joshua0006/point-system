import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Campaigns = React.memo(() => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to my-campaigns by default
    navigate('/campaigns/my-campaigns', { replace: true });
  }, [navigate]);

  return null; // This component just redirects
});

Campaigns.displayName = "Campaigns";

export default Campaigns;
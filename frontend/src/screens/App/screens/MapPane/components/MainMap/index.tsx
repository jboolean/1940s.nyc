import React from 'react';

import MapLibreMap from './MapLibreMap';

import LoginForm from 'shared/components/LoginForm';
import useLoginStore from 'shared/stores/LoginStore';
import { MapInterface } from './MapInterface';
import * as overlays from './overlays';

// Export the OverlayId type from the appropriate module
export { OverlayId } from './overlays';

interface Props {
  className?: string;
  panOnClick: boolean;
  overlay: overlays.OverlayId;
  requireLogin?: boolean;
}

// Simple component that switches between implementations
const MainMap = React.forwardRef<MapInterface, Props>((props, ref) => {
  const { isLoggedInToNonAnonymousAccount, isLoadingMe } = useLoginStore();

  // Only show map if user is logged in to a non-anonymous account
  // But allow override if requireLogin is explicitly set to false
  const canShowMap =
    props.requireLogin === false ||
    (isLoggedInToNonAnonymousAccount && !isLoadingMe);

  if (!canShowMap) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          padding: '2rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <h2>Login Required</h2>
          <p>Please log in to view the map.</p>
          <LoginForm newEmailBehavior="create" />
        </div>
      </div>
    );
  }

  return <MapLibreMap ref={ref} {...props} />;
});

MainMap.displayName = 'MainMap';

export default MainMap;

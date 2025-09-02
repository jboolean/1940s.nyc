import React from 'react';
import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';

// Import both implementations
import MapBoxMap from './MapBoxMap';
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
  const useMapLibre = useFeatureFlag(FeatureFlag.USE_MAPLIBRE);
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

  if (useMapLibre) {
    return <MapLibreMap ref={ref} {...props} />;
  } else {
    return <MapBoxMap ref={ref} {...props} />;
  }
});

MainMap.displayName = 'MainMap';

export default MainMap;

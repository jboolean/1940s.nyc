import React from 'react';

import Map from 'shared/components/MapboxGl/Map';

const MAPBOX_STYLE = __DEV__
  ? 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze/draft'
  : 'mapbox://styles/julianboilen/ck0n6mu9t59e41dl5nhs6bzze';

export default class MainMap extends React.Component {
  render(): React.ReactNode {
    const style = {
      position: 'absolute' as 'absolute',
      top: '0',
      bottom: '0',
      width: '100%',
    };

    return (
      <Map
        containerProps={{
          style,
        }}
        options={{
          style: MAPBOX_STYLE,
        }}
      />
    );
  }
}

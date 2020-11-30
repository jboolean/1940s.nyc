import React from 'react';

import classnames from 'classnames';

import stylesheet from './Geolocate.less';

interface Props {
  className?: string;
  onGeolocated: (position: { lat: number; lng: number }) => void;
}

interface State {
  loading: boolean;
}

export default class Geolocate extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
    };

    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleGeolocatedSuccess = this.handleGeolocatedSuccess.bind(this);
    this.handleGeolocatedError = this.handleGeolocatedError.bind(this);
  }

  handleButtonClick(): void {
    if (this.state.loading) {
      return;
    }

    this.setState({
      loading: true,
    });

    navigator.geolocation.getCurrentPosition(
      this.handleGeolocatedSuccess,
      this.handleGeolocatedError,
      {
        enableHighAccuracy: true,
      }
    );
  }

  handleGeolocatedSuccess(position: GeolocationPosition): void {
    const { onGeolocated } = this.props;
    const { coords } = position;
    this.setState({
      loading: false,
    });

    onGeolocated({
      lat: coords.latitude,
      lng: coords.longitude,
    });
  }

  handleGeolocatedError(error: GeolocationPositionError): void {
    this.setState({
      loading: false,
    });

    console.warn(error);
  }

  render(): JSX.Element {
    const { className } = this.props;
    const { loading } = this.state;
    return (
      <button
        className={classnames(stylesheet.button, className)}
        onClick={this.handleButtonClick}
        disabled={loading}
      >
        My Location
      </button>
    );
  }
}

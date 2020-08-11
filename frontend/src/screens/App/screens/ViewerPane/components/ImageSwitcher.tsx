import React, { ImgHTMLAttributes } from 'react';

import { CSSTransition } from 'react-transition-group';

interface State {
  lastSrc: string;
  visibleSrc: string;
  hide: boolean;
  loaded: boolean;
}

type Props = ImgHTMLAttributes<unknown>;

import stylesheet from './ImageSwitcher.less';

function preloadImage(url: string, callback: () => void): void {
  const img = new Image();
  img.src = url;
  img.addEventListener('load', callback);
  img.addEventListener('error', callback);
}

export default class ImageSwitcher<T> extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      lastSrc: props.src,
      visibleSrc: props.src,
      hide: false,
      loaded: true,
    };
    this.handleNewImgLoad = this.handleNewImgLoad.bind(this);
    this.handleExited = this.handleExited.bind(this);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (this.props.src !== prevState.lastSrc && !this.state.hide) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(
        {
          hide: true,
          loaded: false,
          lastSrc: this.props.src,
        },
        () => {
          preloadImage(this.props.src, this.handleNewImgLoad);
        }
      );
    }
  }

  handleNewImgLoad(): void {
    if (!this.state.hide) {
      this.swapImage();
    }
    this.setState({
      loaded: true,
    });
  }

  handleExited(): void {
    this.setState({
      hide: false,
    });
    if (this.state.loaded) {
      this.swapImage();
    }
  }

  swapImage(): void {
    this.setState({
      visibleSrc: this.props.src,
    });
  }

  render(): JSX.Element {
    const { visibleSrc, hide, loaded } = this.state;

    return (
      <CSSTransition
        appear={true}
        in={!hide && loaded}
        classNames={{ ...stylesheet }}
        timeout={150}
        onExited={this.handleExited}
      >
        <img {...this.props} src={visibleSrc} />
      </CSSTransition>
    );
  }
}

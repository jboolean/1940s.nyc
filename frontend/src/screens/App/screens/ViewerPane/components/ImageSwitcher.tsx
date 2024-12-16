import React, { ImgHTMLAttributes } from 'react';

import { CSSTransition } from 'react-transition-group';
import recordEvent from 'shared/utils/recordEvent';

import Require from 'utils/Require';

type View = {
  key: string;
  element: React.ReactElement;
  preload: () => Promise<void>;
};
interface State {
  lastView: View;
  visibleView: View;
  hide: boolean;
  loaded: boolean;
}

type Props = {
  view: View;
};

import stylesheet from './ImageSwitcher.less';

function preloadImage(url: string, callback: () => void): void {
  const img = new Image();
  img.src = url;
  img.addEventListener('load', callback);
  img.addEventListener('error', callback);
}

// Make a view object for a basic img element
export function makeImgView(
  props: Require<ImgHTMLAttributes<unknown>, 'src'>
): View {
  return {
    key: props.src,
    element: <img key={props.src} {...props} />,
    preload: () => new Promise((resolve) => preloadImage(props.src, resolve)),
  };
}

export default class ImageSwitcher extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      lastView: props.view,
      visibleView: props.view,
      hide: false,
      loaded: true,
    };
    this.handleNewImgLoad = this.handleNewImgLoad.bind(this);
    this.handleExited = this.handleExited.bind(this);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (this.props.view.key !== prevState.lastView.key && !this.state.hide) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(
        {
          hide: true,
          loaded: false,
          lastView: this.props.view,
        },
        () => {
          this.props.view.preload().then(() => {
            this.handleNewImgLoad();
          });
        }
      );

      recordEvent({
        category: 'Image Viewer',
        action: 'Image Changed',
      });
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
      visibleView: this.props.view,
    });
  }

  render(): JSX.Element {
    const { visibleView, hide, loaded } = this.state;

    return (
      <CSSTransition
        appear={true}
        in={!hide && loaded}
        classNames={{ ...stylesheet }}
        timeout={150}
        onExited={this.handleExited}
      >
        {visibleView.element}
      </CSSTransition>
    );
  }
}

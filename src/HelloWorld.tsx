import React from 'react';

import stylesheet from './HelloWorld.less';

export default class HelloWorld extends React.Component<{}, {}> {
  render(): JSX.Element {
    return <h1 className={stylesheet.marquee}>Hello World!</h1>;
  }
}

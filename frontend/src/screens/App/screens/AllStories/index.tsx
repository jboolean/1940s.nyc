import React from 'react';

import { FixedSizeList as List } from 'react-window';
import range from 'lodash/range';
import isNil from 'lodash/isNil';
import classnames from 'classnames';

import { getAllStories } from 'shared/utils/StoryApi';

import AutoSizer from 'react-virtualized-auto-sizer';

import stylesheet from './ImageGrid.less';
import { useHistory, useParams, Link } from 'react-router-dom';
import { Story } from 'screens/App/shared/types/Story';
import { default as StoryView } from 'shared/components/Story';

const TARGET_IMAGE_WIDTH = 550;
const ASPECT = 420 / 630;

const calculateItemsPerRow = (width: number): number => {
  const itemsPerRow = Math.floor(width / TARGET_IMAGE_WIDTH);
  const freeSpace = width - itemsPerRow * TARGET_IMAGE_WIDTH;

  // It would be closer to the target to add an extra item
  if (freeSpace > TARGET_IMAGE_WIDTH / 2) {
    return itemsPerRow + 1;
  }

  return itemsPerRow;
};

function useForceUpdate(): () => void {
  const [, setValue] = React.useState(0); // integer state
  return () => setValue((value) => ++value); // update the state to force render
}

// This "state" is kept outside the component because AutoSizer unmounts the component when it is 0 width,
// and then it reloads data
const visibleImageIRef: { current?: number } = { current: undefined };
let allStories: Story[] = [];

function Grid({
  width,
  height,
}: {
  width: number;
  height: number;
}): JSX.Element {
  // Sorry this is a hack. State has to be stored outside the component but I still want to re-render.
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    if (allStories.length) return;
    void getAllStories().then((data) => {
      allStories = data;
      forceUpdate();
    });
  });

  const history = useHistory();
  const { identifier: selectedIdentifier } = useParams<{
    identifier?: string;
  }>();

  const listRef = React.createRef<List>();

  const itemsPerRow = calculateItemsPerRow(width);
  const itemHeight = (1 / ASPECT) * (width / itemsPerRow);

  // If items are reorganized, scroll to last visible item rather than some flying off somewhere random
  React.useEffect(() => {
    const imageI = visibleImageIRef.current;
    if (isNil(imageI)) return;
    const rowI = imageI / itemsPerRow;
    listRef.current?.scrollToItem(rowI, 'start');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- otherwise it will scroll on every click
  }, [itemsPerRow]);

  return (
    <List
      ref={listRef}
      width={width}
      height={height}
      itemSize={itemHeight}
      itemCount={Math.ceil(allStories.length / itemsPerRow)}
      useIsScrolling
      className={stylesheet.grid}
      onItemsRendered={({ visibleStartIndex }) => {
        const imageI = visibleStartIndex * itemsPerRow;
        // We'll scroll back to here
        // Record on a delay to allow time for reflow
        setTimeout(() => {
          visibleImageIRef.current = imageI;
        }, 1500);
      }}
    >
      {({ index: rowIndex, style }) => {
        const firstIndex = rowIndex * itemsPerRow;
        return (
          <div style={style}>
            {range(
              firstIndex,
              Math.min(firstIndex + itemsPerRow, allStories.length)
            ).map((i) => {
              const story = allStories[i];
              return (
                <div
                  key={story.id}
                  style={{
                    width: `${100 / itemsPerRow}%`,
                    display: 'inline-block',
                  }}
                  className={classnames({
                    [stylesheet.selected]: story.photo === selectedIdentifier,
                  })}
                  onClick={() => {
                    visibleImageIRef.current = i;
                    history.push('/stories/photo/' + story.photo);
                  }}
                >
                  <StoryView story={story} />
                </div>
              );
            })}
          </div>
        );
      }}
    </List>
  );
}

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={stylesheet.top}>
        <h1>Stories</h1>
        <Link to="/map" className={stylesheet.backToMap}>
          Back to map
        </Link>
      </div>
      <div className={stylesheet.gridWrapper}>
        <AutoSizer>
          {({ width, height }) => <Grid width={width} height={height} />}
        </AutoSizer>
      </div>
    </div>
  );
}

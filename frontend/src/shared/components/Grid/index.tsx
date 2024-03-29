import React from 'react';

import range from 'lodash/range';
import throttle from 'lodash/throttle';
import { FixedSizeList as List } from 'react-window';

import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';

const calculateItemsPerRow = (
  targetWidth: number,
  containerWidth: number
): number => {
  const itemsPerRow = Math.floor(containerWidth / targetWidth);
  const freeSpace = containerWidth - itemsPerRow * targetWidth;

  // It would be closer to the target to add an extra item
  if (freeSpace > targetWidth / 2) {
    return itemsPerRow + 1;
  }

  return itemsPerRow;
};
type GridProps<T> = {
  className?: string;
  targetWidth: number;
  aspectRatio: number;
  items: T[];
  totalItems: number;
  renderItem: (item: T) => JSX.Element;
  loadMoreItems: (upTo: number) => Promise<void>;
};

type PrivateProps = {
  visibleItemIRef: React.MutableRefObject<number>;
  listRef: React.MutableRefObject<List>;
};

function Grid<T>({
  items,
  totalItems,
  renderItem,
  className,
  targetWidth,
  aspectRatio,

  width: containerWidth,
  height: containerHeight,

  visibleItemIRef: visibleImageIRef,
  listRef,

  loadMoreItems,
}: GridProps<T> & Size & PrivateProps): JSX.Element {
  const itemsPerRow = calculateItemsPerRow(targetWidth, containerWidth);
  const itemHeight = (1 / aspectRatio) * (containerWidth / itemsPerRow);

  // If items are reorganized, scroll to last visible item rather than some flying off somewhere random
  React.useEffect(() => {
    const itemI = visibleImageIRef.current;
    if (!itemI || itemI === Infinity) return;
    const rowI = itemI / itemsPerRow;
    listRef.current?.scrollToItem(rowI, 'start');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- otherwise it will scroll on every click
  }, [itemsPerRow]);

  const updateVisibleImageI = throttle(
    (imageI: number) => {
      if (isNaN(imageI)) return;
      visibleImageIRef.current = imageI;
    },
    1500,
    { leading: false }
  );

  const rowCount = Math.ceil(totalItems / itemsPerRow);
  const isRowLoaded = (index: number): boolean => {
    const firstItemI = index * itemsPerRow;
    const lastItemI = Math.min(firstItemI + itemsPerRow - 1, totalItems - 1);
    return lastItemI < items.length;
  };

  const handleLoadMoreItems = React.useCallback(
    async (_startIndex: number, stopIndex: number) => {
      const firstItemI = stopIndex * itemsPerRow;
      const lastItemI = Math.min(firstItemI + itemsPerRow - 1, totalItems - 1);
      await loadMoreItems(lastItemI);
    },
    [itemsPerRow, loadMoreItems, totalItems]
  );

  return (
    <InfiniteLoader
      isItemLoaded={isRowLoaded}
      itemCount={rowCount}
      loadMoreItems={handleLoadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <List
          ref={(el) => {
            ref(el);
            listRef.current = el;
          }}
          className={className}
          width={containerWidth}
          height={containerHeight}
          itemSize={itemHeight}
          itemCount={rowCount}
          useIsScrolling
          onItemsRendered={(props) => {
            const { visibleStartIndex } = props;
            const imageI = visibleStartIndex * itemsPerRow;
            if (containerWidth === 0) {
              return;
            }
            // We'll scroll back to here
            // Record on a delay to allow time for reflow
            updateVisibleImageI(imageI);
            onItemsRendered(props);
          }}
        >
          {({ index: rowIndex, style }) => {
            const firstItemI = rowIndex * itemsPerRow;
            return (
              <div style={style}>
                {range(
                  firstItemI,
                  Math.min(firstItemI + itemsPerRow, items.length)
                ).map((i) => {
                  const item = items[i];
                  return (
                    <div
                      style={{
                        width: `${100 / itemsPerRow}%`,
                        height: '100%',
                        display: 'inline-block',
                        position: 'relative',
                      }}
                      key={i}
                    >
                      {renderItem(item)}
                    </div>
                  );
                })}
              </div>
            );
          }}
        </List>
      )}
    </InfiniteLoader>
  );
}

export default function AutoSizeGrid<T>({
  ...gripProps
}: GridProps<T>): JSX.Element {
  // AutoSizer unmounts children when width is 0, so we pull state/refs up to here, its parent
  const visibleItemIRef = React.useRef<number>();
  const listRef = React.useRef<List>();

  return (
    <AutoSizer>
      {(size) => (
        <Grid
          {...gripProps}
          {...size}
          visibleItemIRef={visibleItemIRef}
          listRef={listRef}
        />
      )}
    </AutoSizer>
  );
}

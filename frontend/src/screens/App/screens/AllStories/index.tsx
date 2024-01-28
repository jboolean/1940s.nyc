import React from 'react';

import classnames from 'classnames';

import { Link, useHistory, useParams } from 'react-router-dom';
import { Story } from 'screens/App/shared/types/Story';
import Grid from 'shared/components/Grid';
import StoryView from 'shared/components/Story';
import Paginated from 'shared/types/Paginated';
import { PHOTO_BASE } from 'shared/utils/apiConstants';
import { getAllStories } from 'shared/utils/StoryApi';
import stylesheet from './AllStories.less';

const TARGET_WIDTH = 420;
const ASPECT = 420 / 630;

export default function Outtakes({
  className,
}: {
  className?: string;
}): JSX.Element {
  const nextToken = React.useRef<string>(undefined);
  const [storiesPage, setStoriesPage] = React.useState<Paginated<Story> | null>(
    null
  );
  const [stories, setStories] = React.useState<Story[]>([]);
  const isLoading = React.useRef(false);

  const handleNewPage = React.useCallback(
    (newPage: Paginated<Story>) => {
      nextToken.current = newPage.nextToken;
      setStoriesPage(newPage);
      setStories([...stories, ...newPage.items]);
    },
    [stories]
  );

  React.useEffect(
    () => {
      isLoading.current = true;
      void getAllStories()
        .then(handleNewPage)
        .finally(() => {
          isLoading.current = false;
        });
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadNextPage = React.useCallback(
    async (pageSize = 20) => {
      if (!storiesPage) return;
      if (!storiesPage.hasNextPage) return;
      if (isLoading.current) {
        return;
      }

      isLoading.current = true;

      return getAllStories(Math.max(pageSize, 1), nextToken.current)
        .then((data) => handleNewPage(data))
        .finally(() => {
          isLoading.current = false;
        });
    },
    [storiesPage, handleNewPage]
  );

  const handleLoadMoreItems = React.useCallback(
    (untilIndex: number) => {
      return loadNextPage(untilIndex - stories.length + 1);
    },
    [stories, loadNextPage]
  );

  const history = useHistory();
  const { identifier: selectedIdentifier } = useParams<{
    identifier?: string;
  }>();

  return (
    <div className={classnames(stylesheet.container, className)}>
      <div className={stylesheet.top}>
        <h1>All Stories</h1>
        <p>
          Click a story to see the photo. Add your story by clicking{' '}
          <i>Know This Place?</i> on any photo.
        </p>
        <Link
          to={{ pathname: '/map', hash: history.location.hash }}
          className={stylesheet.backToMap}
        >
          Back to map
        </Link>
      </div>
      <div className={stylesheet.gridWrapper}>
        <Grid
          items={stories}
          totalItems={storiesPage?.total ?? 0}
          loadMoreItems={handleLoadMoreItems}
          targetWidth={TARGET_WIDTH}
          aspectRatio={ASPECT}
          className={stylesheet.grid}
          renderItem={(story) => {
            if (!story) {
              return <div className={stylesheet.storyItem}></div>;
            }
            const identifier = story.photo;
            return (
              <div className={stylesheet.storyItem}>
                <Link
                  to={{
                    pathname: '/stories/photo/' + story.photo,
                    hash: story.lngLat
                      ? `16/${story.lngLat.lat}/${story.lngLat.lng}`
                      : '',
                  }}
                  className={stylesheet.storyLink}
                >
                  <div
                    className={classnames(stylesheet.storyCard, {
                      [stylesheet.selected]: identifier === selectedIdentifier,
                    })}
                  >
                    <img
                      height={`100%`}
                      width={`100%`}
                      src={`${PHOTO_BASE}/420-jpg/${identifier}.jpg`}
                      loading="lazy"
                      className={classnames(stylesheet.image)}
                      onLoad={(e) => {
                        e.currentTarget.className += ' ' + stylesheet.loaded;
                      }}
                    />

                    <div className={stylesheet.textContent}>
                      <div className={stylesheet.storyTitle}>
                        {[
                          story.photoExpanded.address,
                          story.photoExpanded.borough,
                        ].join(', ')}
                      </div>
                      <div className={stylesheet.story}>
                        <StoryView story={story} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

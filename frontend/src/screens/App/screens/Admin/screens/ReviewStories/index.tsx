import React from 'react';
import Button from 'shared/components/Button';
import Story from 'shared/components/Story';
import { PHOTO_BASE } from 'shared/utils/apiConstants';
import classNames from 'classnames';

import useReviewStoriesStore from './stores/ReviewStoriesStore';

import stylesheet from './ReviewStories.less';
import { AdminStory } from 'screens/App/shared/types/Story';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function StoryMetadataView({ story }: { story: AdminStory }): JSX.Element {
  return (
    <div className={stylesheet.metadata}>
      <div>
        <time dateTime={story.createdAt}>
          {DATE_FORMATTER.format(Date.parse(story.createdAt))}
        </time>
      </div>
      <div>{story.storytellerEmail}</div>
      <div
        className={classNames(stylesheet.score, {
          [stylesheet.good]: story.recaptchaScore > 0.5,
          [stylesheet.bad]: story.recaptchaScore <= 0.5,
        })}
      >
        {story.recaptchaScore * 100}% Human
      </div>
      {story.lngLat ? (
        <div>
          {story.lngLat.lat}, {story.lngLat.lng}
        </div>
      ) : null}
      <div>
        Photo:{' '}
        <a
          href={`/map/photo/${story.photo}#16/${story.lngLat?.lat}/${story.lngLat?.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          {story.photo}
        </a>
      </div>
    </div>
  );
}

export default function ReviewStories(): JSX.Element {
  const reviewStoriesStore = useReviewStoriesStore();

  React.useEffect(() => {
    reviewStoriesStore.loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={stylesheet.container}>
      <h1>Review Stories</h1>

      <div className={stylesheet.stories}>
        {reviewStoriesStore.stories.map((story) => (
          <React.Fragment key={story.id}>
            <div>
              <div className={stylesheet.buttons}>
                <Button
                  onClick={() => reviewStoriesStore.approveStory(story.id)}
                  buttonStyle={'primary'}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => reviewStoriesStore.rejectStory(story.id)}
                  buttonStyle={'secondary'}
                >
                  Reject
                </Button>
              </div>

              <StoryMetadataView story={story} />
            </div>

            <img
              src={`${PHOTO_BASE}/420-jpg/${story.photo}.jpg`}
              className={stylesheet.photo}
            />

            <Story story={story} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

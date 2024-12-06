import classNames from 'classnames';
import React from 'react';
import Button from 'shared/components/Button';
import Story from 'shared/components/Story';
import { PHOTO_BASE } from 'shared/utils/apiConstants';

import useReviewStoriesStore from './stores/ReviewStoriesStore';

import { AdminStory } from 'screens/App/shared/types/Story';
import stylesheet from './ReviewStories.less';

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
      {story.recaptchaScore < 0.7 ? (
        <div
          className={classNames(stylesheet.score, {
            [stylesheet.good]: story.recaptchaScore > 0.5,
            [stylesheet.bad]: story.recaptchaScore <= 0.5,
          })}
        >
          {story.recaptchaScore * 100}% Human
        </div>
      ) : null}
      {story.emailBounced ? (
        <div className={classNames(stylesheet.score, stylesheet.bad)}>
          Email bounced
        </div>
      ) : null}

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
      <div>Title: {story.title}</div>
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

      <details>
        <summary>Review guidelines</summary>
        <p>Examples of stories to reject</p>
        <ul>
          <li>
            &ldquo;dvdsvdf&rdquo; — <i>This is junk content</i>
          </li>
          <li>
            &ldquo;My house&rdquo; — <i>Not a story</i>
          </li>
          <li>
            &ldquo;6th pct&rdquo; — <i>Not a story</i>
          </li>
          <li>
            &ldquo;205 Riverside dr&rdquo; — <i>Adds no new information</i>
          </li>
          <li>
            &ldquo;This is the wrong location&rdquo; —{' '}
            <i>
              User should use the <i>Fix</i> button instead
            </i>
          </li>
          <li>
            &ldquo;I was looking for Pack's Pharmacy Store??? &rdquo; —{' '}
            <i>Not a story</i>
          </li>
        </ul>
      </details>

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

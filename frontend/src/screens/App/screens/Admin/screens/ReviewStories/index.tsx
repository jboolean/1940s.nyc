import classNames from 'classnames';
import React from 'react';
import Button from 'shared/components/Button';
import Story from 'shared/components/Story';
import { PHOTO_BASE } from 'shared/utils/apiConstants';

import useReviewStoriesStore from './stores/ReviewStoriesStore';

import { AdminStory, AiModerationFlag } from 'screens/App/shared/types/Story';
import stylesheet from './ReviewStories.less';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const labelByAiModerationFlag: Record<AiModerationFlag, string> = {
  linkOrAd: 'Advertisement',
  complaintOrCorrection: 'Complaint',
  nonsense: 'Nonsense',
  addressOnly: 'Lacks personal detail',
  offensive: 'Offensive',
  trolling: 'Trolling',
};

function RecommendedDot(): JSX.Element {
  return (
    <span
      className={stylesheet.recommendedDot}
      role="img"
      aria-label="Recommended"
      title="Recommended"
    />
  );
}

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
      {story.moderationFlags.map((flag) => (
        <div
          key={flag}
          className={classNames(stylesheet.score, stylesheet.bad)}
        >
          {labelByAiModerationFlag[flag]}
        </div>
      ))}

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
            &ldquo;I was looking for Pack&rsquo;s Pharmacy Store???&rdquo; —{' '}
            <i>Not a story</i>
          </li>
          <li>Stories that primarily advertise or direct users away</li>
        </ul>
      </details>

      {reviewStoriesStore.isLoading ? <p>Loading&hellip;</p> : null}

      {reviewStoriesStore.error ? <p>Failed to load stories. </p> : null}

      {!reviewStoriesStore.isLoading &&
      !reviewStoriesStore.error &&
      reviewStoriesStore.stories.length === 0 ? (
        <p>No stories to review.</p>
      ) : null}

      <div className={stylesheet.stories}>
        {reviewStoriesStore.stories.map((story) => (
          <React.Fragment key={story.id}>
            <div>
              <div className={stylesheet.buttons}>
                <Button
                  onClick={() => reviewStoriesStore.approveStory(story.id)}
                  buttonStyle={'primary'}
                >
                  {story.recommendedAction === 'approve' ? (
                    <RecommendedDot />
                  ) : null}
                  Approve
                </Button>
                <Button
                  onClick={() => reviewStoriesStore.rejectStory(story.id)}
                  buttonStyle={'secondary'}
                >
                  {story.recommendedAction === 'reject' ? (
                    <RecommendedDot />
                  ) : null}
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

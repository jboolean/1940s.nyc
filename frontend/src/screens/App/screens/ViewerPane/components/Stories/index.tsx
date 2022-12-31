import React from 'react';
import { getStoriesForPhoto } from 'screens/App/screens/SubmitStoryWizard/shared/utils/StoryApi';
import Story from './components/Story';
import { Story as StoryType } from 'screens/App/shared/types/Story';

interface Props {
  photoIdentifier: string;
}

export default function Stories({ photoIdentifier }: Props): JSX.Element {
  const [stories, setStories] = React.useState<StoryType[]>([]);

  React.useEffect(() => {
    getStoriesForPhoto(photoIdentifier)
      .then((stories) => {
        setStories(stories);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [photoIdentifier]);

  return (
    <div>
      {stories.map((story) => (
        <Story key={story.id} story={story} />
      ))}
    </div>
  );
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useStoryDraftStore } from './SubmitStoryWizard';

const STORY_AUTH_TOKEN_KEY = 'token';

/**
 * This is the landing page for the edit link in story emails.
 * It just rehydrates the story draft store with the story data and redirects.
 */
export default function EditStory(): JSX.Element {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  const storyAuthToken = searchParams.get(STORY_AUTH_TOKEN_KEY);

  const { rehydrateForEditing, draftStory } = useStoryDraftStore();

  React.useEffect(() => {
    if (!storyAuthToken) return;
    rehydrateForEditing(storyAuthToken);
  }, [rehydrateForEditing, storyAuthToken]);

  if (draftStory && draftStory.photo) {
    return <Navigate to={`/stories/photo/${draftStory.photo}`} replace />;
  }
  return <></>;
}

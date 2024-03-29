import React from 'react';

import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import useFeatureFlagsStore from 'screens/App/shared/stores/FeatureFlagsStore';
import { Link } from 'react-router-dom';
import { lowerCase, upperFirst } from 'lodash';

export default function FeatureFlags(): JSX.Element {
  const featureFlags = useFeatureFlagsStore();

  const handleFeatureFlagChange =
    (feature: FeatureFlag) => (event: React.ChangeEvent<HTMLInputElement>) => {
      useFeatureFlagsStore.setState({ [feature]: event.target.checked });
    };

  return (
    <div>
      <h1>Labs</h1>
      <h2>Features under development and debug options</h2>
      <ul>
        {Object.values(FeatureFlag).map((featureFlag) => (
          <li key={featureFlag}>
            <label>
              <input
                type="checkbox"
                checked={featureFlags[featureFlag]}
                onChange={handleFeatureFlagChange(featureFlag)}
              />
              <span>{upperFirst(lowerCase(featureFlag))}</span>
            </label>
          </li>
        ))}
      </ul>

      <Link to="/">Back to home</Link>
    </div>
  );
}

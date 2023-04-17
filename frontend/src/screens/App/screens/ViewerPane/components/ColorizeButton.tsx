import React from 'react';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import Button from 'shared/components/Button';
import useColorizationStore from '../stores/ColorizationStore';

import MagicIcon from './assets/magic.svg?asset';

import classNames from 'classnames';

import stylesheet from './ColorizeButton.less';

export default function ColorizeButton({
  photoIdentifier,
}: {
  photoIdentifier: string;
}): JSX.Element {
  // This is a bit of a hack to only show for 40s photos, without making an api call to actually determine the collection
  const isColorizable = photoIdentifier.startsWith('nynyma');
  const colorizationEnabled =
    useFeatureFlag(FeatureFlag.COLORIZATION) && isColorizable;
  const { toggleColorization, isLoading, colorEnabledForIdentifier } =
    useColorizationStore();

  const enabled = colorEnabledForIdentifier === photoIdentifier;

  return colorizationEnabled ? (
    <Button
      className={classNames(stylesheet.colorizeButton, {
        [stylesheet.loading]: isLoading,
        [stylesheet.enabled]: enabled,
      })}
      buttonTheme="viewer"
      buttonStyle="secondary"
      disabled={isLoading}
      onClick={() => {
        toggleColorization(photoIdentifier);
      }}
      aria-pressed={enabled}
    >
      <img
        src={MagicIcon}
        alt="Magic wand icon"
        className={stylesheet.magicIcon}
      />
      Colorize
    </Button>
  ) : null;
}

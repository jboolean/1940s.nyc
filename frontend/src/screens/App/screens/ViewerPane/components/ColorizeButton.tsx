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
  const colorizationEnabled = useFeatureFlag(FeatureFlag.COLORIZATION);
  const { toggleColorization, isLoading, colorEnabledForIdentifier } =
    useColorizationStore();

  return colorizationEnabled ? (
    <Button
      className={classNames(stylesheet.colorizeButton, {
        [stylesheet.loading]: isLoading,
        [stylesheet.enabled]: photoIdentifier === colorEnabledForIdentifier,
      })}
      buttonTheme="viewer"
      buttonStyle="secondary"
      disabled={isLoading}
      onClick={() => {
        toggleColorization(photoIdentifier);
      }}
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

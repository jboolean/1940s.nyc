import React from 'react';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import Button from 'shared/components/Button';
import useColorizationStore from '../stores/ColorizationStore';

import MagicIcon from './assets/magic.svg?asset';

import classNames from 'classnames';

import stylesheet from './ColorizeButton.less';
import { useExperimentVariants } from 'shared/utils/OptimizeExperiments';

export default function ColorizeButton({
  photoIdentifier,
}: {
  photoIdentifier: string;
}): JSX.Element {
  // This is a bit of a hack to only show for 40s photos, without making an api call to actually determine the collection
  const isColorizable = photoIdentifier.startsWith('nynyma');
  const isColorizationFlagEnabled = useFeatureFlag(FeatureFlag.COLORIZATION);
  const isColorizationExperimentEnabled =
    useExperimentVariants('nqDw4XFlQaCY57aVMxJReA')?.[0] == 1;
  const colorizationEnabled =
    isColorizable &&
    (isColorizationFlagEnabled || isColorizationExperimentEnabled);

  const { toggleColorization, isLoading, colorEnabledForIdentifier, balance } =
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
      {balance !== null && balance >= 0 ? (
        <span className={stylesheet.balance}>[{balance}]</span>
      ) : null}
    </Button>
  ) : null;
}

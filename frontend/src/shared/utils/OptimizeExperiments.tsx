import React, { PropsWithChildren } from 'react';
import memoize from 'lodash/memoize';
import debounce from 'lodash/debounce';

/**
 * Supports multivariate tests.
 * index = section, value = variant.
 * In an A/B length is 1.
 */
type VariantAssignments = number[] | undefined;

const ExperimentAssignmentsContext = React.createContext<
  Record<string, VariantAssignments>
>({});

/**
 * Listens to experiments being activated in Google Optimize and updates the store.
 * @returns function to unsubscribe
 */
export default function listenToGoogleOptimize(
  setActiveVariantCb: (
    experimentId: string,
    variants: VariantAssignments
  ) => void
): () => void {
  if (!window.gtag) {
    return;
  }

  // Optimize calls this callback twice in the same tick upon activation, once to de-activate the experiment and a second time to activate it.
  // This is debounced to eliminate the initial de-activation.
  // The debounced function is memoized by experiment id so as to not conflate experiments.
  const getVariantSetterForExperiment = memoize((experimentId: string) => {
    const setVariant = (variant: number[] | undefined): void => {
      return setActiveVariantCb(experimentId, variant);
    };
    return debounce(setVariant, 0);
  });
  const setActiveVariant = (
    experimentId: string,
    variant: number[] | undefined
  ): void => {
    getVariantSetterForExperiment(experimentId)(variant);
  };

  // https://support.google.com/optimize/answer/9059383?hl=en
  const googleCb = (
    variantRaw: string | undefined,
    experimentId: string
  ): void => {
    // Sections of multivariate test are separated by "-". A/B tests have one section.
    // The variant numbers comes in as strings. Convert.
    let variant: number[] | undefined;
    if (typeof variantRaw === 'string') {
      variant = variantRaw.split('-').map(Number);
    }
    setActiveVariant(experimentId, variant);
  };

  window.gtag('event', 'optimize.callback', {
    callback: googleCb,
  });

  // Return an unsubscribe function
  return () => {
    window.gtag('event', 'optimize.callback', {
      callback: googleCb,
      remove: true,
    });
  };
}

export function OptimizeExperimentsProvider({
  children,
}: PropsWithChildren<never>): JSX.Element {
  const [assignmentsByExperimentId, setAssignmentsByExperimentId] =
    React.useState<Record<string, VariantAssignments>>({});
  React.useEffect(() => {
    return listenToGoogleOptimize((experimentId, variants) => {
      console.log('Updated experiment', experimentId, variants);
      setAssignmentsByExperimentId({
        ...assignmentsByExperimentId,
        [experimentId]: variants,
      });
    });
  }, []);

  return (
    <ExperimentAssignmentsContext.Provider value={assignmentsByExperimentId}>
      {children}
    </ExperimentAssignmentsContext.Provider>
  );
}

export function ExperimentVariantsConsumer({
  experimentId,
  children,
}: {
  experimentId: string;
  children: (variants: number[]) => JSX.Element;
}): JSX.Element {
  return (
    <ExperimentAssignmentsContext.Consumer>
      {(assignmentsByExperimentId) =>
        children(assignmentsByExperimentId[experimentId])
      }
    </ExperimentAssignmentsContext.Consumer>
  );
}

export function useExperimentVariants(
  experimentId: string
): number[] | undefined {
  const assignmentsByExperimentId = React.useContext(
    ExperimentAssignmentsContext
  );

  return assignmentsByExperimentId[experimentId];
}

import React from 'react';

import Autosuggest from 'react-autosuggest';

import classnames from 'classnames';
import { Feature, Point } from 'geojson';
import { autocomplete, search } from './utils/geosearch';
import throttle from 'lodash/throttle';
import uniqWith from 'lodash/uniqWith';
import isEqual from 'lodash/isEqual';
import property from 'lodash/property';

import stylesheet from './Search.less';

interface Props {
  className?: string;
  onFeatureSelected: (feature: Feature<Point>) => void;
}

interface State {
  value: string;
  suggestions: Feature<Point>[];
  isSuggestionHighlighted: boolean;
}

const getSuggestionValue = (suggestion: Feature<Point>): string =>
  suggestion.properties.name;

const renderSuggestion = (suggestion: Feature<Point>): JSX.Element => (
  <div>{suggestion.properties.name}</div>
);

const getCoordinates = property('geometry.coordinates');
const uniqByPoint = (features: Feature<Point>[]): Feature<Point>[] =>
  uniqWith(features, (a, b) => isEqual(getCoordinates(a), getCoordinates(b)));

export default class Search extends React.Component<Props, State> {
  fetchSuggestionsThrottled: (a: { value: string }) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      value: '',
      suggestions: [],
      isSuggestionHighlighted: false,
    };
    this.fetchSuggestionsThrottled = throttle(
      this.fetchSuggestions.bind(this),
      200
    );
  }

  handleChange = (
    _e: React.FormEvent,
    { newValue }: { newValue: string }
  ): void => {
    this.setState({
      value: newValue,
    });
  };

  handleKeydown = async (e: React.KeyboardEvent): Promise<void> => {
    const { value, isSuggestionHighlighted } = this.state;
    if (e.keyCode !== 13 || isSuggestionHighlighted) {
      return;
    }
    const results = await search(value);
    if (!results.features.length) {
      return;
    }
    this.props.onFeatureSelected(results.features[0]);
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  async fetchSuggestions({ value }: { value: string }): Promise<void> {
    const results = await autocomplete(value);
    const features = results.features;
    const dedupedFeatures = uniqByPoint(features);
    this.setState({
      suggestions: dedupedFeatures,
    });
  }

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = (): void => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    this.fetchSuggestionsThrottled.cancel();

    this.setState({
      suggestions: [],
      isSuggestionHighlighted: false,
    });
  };

  render(): JSX.Element {
    const { onFeatureSelected } = this.props;
    const { value, suggestions } = this.state;

    return (
      <Autosuggest
        theme={{
          ...stylesheet,
          container: classnames(this.props.className, stylesheet.container),
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.fetchSuggestionsThrottled}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        onSuggestionSelected={(_e, { suggestion }) =>
          onFeatureSelected(suggestion)
        }
        onSuggestionHighlighted={suggestion => {
          this.setState({
            isSuggestionHighlighted: suggestion !== null,
          });
        }}
        renderSuggestion={renderSuggestion}
        inputProps={{
          placeholder: 'Search',
          value,
          onChange: this.handleChange,
          onKeyDown: this.handleKeydown,
        }}
        focusInputOnSuggestionClick={false}
      />
    );
  }
}

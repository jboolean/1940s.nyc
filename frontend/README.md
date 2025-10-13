# 1940s.nyc frontend

## Pre-requisites

This project was developed with node version specified in in .nvmrc

With `nvm` installed, run `nvm use`

## Development

When building for the first time or if dependencies have changed, run

```
npm ci
```

This installs dependencies exactly as pinned in `package-lock.json`. Use `npm install` only when updating dependencies.

To develop,

```
npm run watch
```

Starts a development server at http://dev.1940s.nyc:8080.
The backend must also be running for many functions to work.

## Build

```
npm run build
```

bundles javascript and css into `/dist`.

## Directory structure

The files and directories in `src` are strictly organized into standard directories. The contents of each directory are limited.

(Example names from another project are used for illustration)

- `screens` - Contains only sub-directories named for full pages in the UI. If pages have a hierarchy, those sub-directories can contain another `screens` folder for the pages in the hierarchy.
  ```
  - screens
    - Dj
    - Shows
      - screens
        - Episode
        - Show
  ```
- `components` - Contains only sub-directories named for UI elements that relate to the screen of the parent directory. A component's subdirectory should contain an `index.jsx` file for the component and a `ComponentName.less` file for styles. If the component has a higher-order connecting component to maintain state, that is in the `index.jsx` file, and `ComponentName.jsx` is a pure underlying component. If there is only one file, a directory is not needed.

  ```
  - components
    - Schedule
      - index.jsx // Manages state, loads data from the API
      - Schedule.jsx // A pure React component that renders a Schedule
      - Schedule.less // styles used by Schedule.jsx
  ```

- `utils` - Contains only files that export utility functions, objects, or constants. May contain any subdirectories to organize the utilities.
- `stores` - Contains zustand stores
- `shared` - A special type of directory, configured in Webpack to make its contents easily importable by descendants in the hierarchy. When importing, webpack will automatically look up the tree in shared folders to find a match, so instead of `import ../../shared/utils/myUtil`, just `import 'utils/myUtil'` will suffice. `shared` can contain `components`, `screens` or `utils`. `shared` directories can exist on any level to make contents available below that level.
  - The top-level `src/shared` directory contains code _not_ specific to this application, that could potentially become separate packages, such as UI components.

## Frameworks and patterns

### React

This project is based on React.

### State management

Where state management is needed, [zustand](https://github.com/pmndrs/zustand) is used. It was added to this app in 2023, so legacy code uses Context.

Zustand is an unopinionated framework, but this project has opinions.

- Stores should be structured and separate from rendering components
- Stores should use Immer for easier immutability
- Zustand does not natively support computeds, so we have a separate hook co-located with the store
- Stores should clearly define their Actions and State, separately, using typescript interfaces

A store must be created in a file called \*Store.ts in a `stores` directory and exported as the default export. Ad-hoc stores shouldn't be created in components.

```typescript
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  isOpen: boolean;
  value: number | null;
}

interface ComputedState {
  isValueSet: boolean;
}

interface Actions {
  setValue: (value: number) => void;
  reset: () => void;
}

const useStore = create(
  immer<State & Actions>((set) => ({
    isOpen: false,
    value: null,

    setValue: (value) => {
      set((draft) => {
        draft.isOpen = true;
        draft.value = value;
      });
    },

    reset: () => {
      set((draft) => {
        draft.isOpen = false;
        draft.value = null;
      });
    },
  }))
);

export function useStoreComputeds(): ComputedState {
  const { value } = useStore();
  return {
    isValueSet: value !== null,
  };
}

export default useStore;
```

This template above demonstrates how to structure a Zustand store with Immer for immutability and a separate utility for computed state.

Key Features:
• State and Actions: Define state and behavior in the same store.
• Computed State: Use a dedicated custom hook (useStoreComputeds) to derive and expose computed values from the store within the same file.

### LESS

LESS CSS ([lesscss.org](http://lesscss.org)) is used for styles with Webpack's [CSS Modules](https://github.com/webpack-contrib/css-loader#modules). The tl;dr of this is: 1) All less files can be imported into javascript as objects and 2) All the class names within a `:local` block in the less file, which should be the entire less file, gets replace with a random string. The exported javascript object is a map from the original class name to the randomized class name.

MyGreatComponent.less

```css
:local {
  .myGreatClass {
    color: beige;
  }
}
```

MyGreatComponent.jsx

```javascript
import stylesheet from './MyGreatComponent.less'; // { 'myGreatClass' : 'MyGreatComponent-myGreatClass-x1f2'}

export <div className={stylesheet.myGreatClass} />;
```

This keeps styles local to a component, prevents them from being used elsewhere unintentionally, and allows for using common classnames like `.body` or `.title` without fear of duplication.

## Code style

This project follows [eslint-config-jboolean](https://github.com/jboolean/eslint-config-jboolean), based on eslint recommended rules and `prettier`.

```
npm run lint
```

will find style errors, and

```
npm run lint-fix
```

will fix many of them.

lint errors will be automatically fixed when saving changes while running `npm run watch` as well.

Linting is also run on commit via `husky`.

### Typescript

This project uses Typescript.

### API Client

API calls are written manually in utils files and use `axios`, with named exports matching API functions.

There is no automatic generation of API clients, but this could be done in a future project based on the spec generated by the backend.

import { useEffect, useState } from 'react';

export default function useCanHover(): boolean {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');

    // Set initial value
    setHasFinePointer(mediaQuery.matches);

    // Define a handler for changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setHasFinePointer(event.matches);
    };

    // Add event listener for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup event listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return hasFinePointer;
}

import { useEffect } from 'react';

type EventConstructor<T extends Event = Event> = new (
  type: string,
  eventInitDict?: EventInit
) => T;

type EventNames = keyof GlobalEventHandlersEventMap;

/**
 * Custom hook to forward specified events from an overlay element to a target element.
 * @param overlayRef - Ref to the overlay element
 * @param targetRef - Ref to the target element
 * @param events - List of event names to forward
 */
const useEventForwarding = (
  overlayEl: HTMLElement,
  targetEl: HTMLElement,
  events: readonly EventNames[]
): void => {
  useEffect(() => {
    if (!overlayEl || !targetEl) return;

    const reDispatchEvent = (
      event: GlobalEventHandlersEventMap[keyof GlobalEventHandlersEventMap]
    ): void => {
      const newEvent = new (event.constructor as EventConstructor)(
        event.type,
        event
      );

      targetEl.dispatchEvent(newEvent);
    };

    // Attach listeners to the overlay
    events.forEach((eventName) => {
      overlayEl.addEventListener(eventName, reDispatchEvent);
    });

    return () => {
      // Clean up listeners on unmount
      events.forEach((eventName) => {
        overlayEl.removeEventListener(eventName, reDispatchEvent);
      });
    };
  }, [overlayEl, targetEl, events]);
};

export default useEventForwarding;

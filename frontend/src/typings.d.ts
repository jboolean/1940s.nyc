/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.css' {
  interface ClassNames {
    [className: string]: string;
  }
  const classNames: ClassNames;
  export = classNames;
}

declare module '*.less' {
  interface ClassNames {
    [className: string]: string;
  }
  const classNames: ClassNames;
  export = classNames;
}

declare module '*.svg' {
  const component: import('react').ForwardRefExoticComponent<
    import('react').ComponentPropsWithoutRef<'svg'> &
      import('react').RefAttributes<SVGSVGElement>
  >;
  export default component;
}

declare module '*.svg?asset' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

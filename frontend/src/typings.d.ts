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
  const content: any;
  export default content;
}

declare module '*.svg?asset' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

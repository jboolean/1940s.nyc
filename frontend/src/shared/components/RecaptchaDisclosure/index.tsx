import React from 'react';

import stylesheet from './RecaptchaDisclosure.less';

// Required by reCAPTCHA's terms because the badge is hidden
export default function RecaptchaDisclosure(): React.JSX.Element {
  return (
    <p className={stylesheet.recaptchaDisclosure}>
      This site is protected by reCAPTCHA and the Google{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noreferrer"
      >
        Terms of Service
      </a>{' '}
      apply.
    </p>
  );
}

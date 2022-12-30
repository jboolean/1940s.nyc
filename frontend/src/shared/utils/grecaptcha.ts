const RECAPTCHA_SITE_KEY: string = __RECAPTCHA_PK__; // This is replaced by webpack at build time

export const executeRecaptcha = (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(
      (token) => {
        resolve(token);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

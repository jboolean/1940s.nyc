const APPS = [
  'frontend',
  'backend',
];

const tasks = arr => arr.join(' && ');

module.exports = {
  "hooks": {
    "pre-commit": tasks(
      APPS
        .map(app => tasks([
          'cd `git rev-parse --show-toplevel`', // reset to git root
          `cd ${app}`, // down into app
          `echo "Checking \"${app}\"\n"`,
          'npx --no-install lint-staged', // run local to submodule
        ])))
  }
};

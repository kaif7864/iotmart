# Rules for IoTMart Project

1. **NO GIT PUSHING**: DO NOT EVER run `git push`, `git commit`, or make any changes to Git without explicit, direct permission from the user. The user is actively developing locally, and pushing to the development branch triggers live deployments which disrupts their workflow. Always wait for the user to explicitly say "push the code" before interacting with Git.

2. **SCRATCH & SCRIPT FILES**: Whenever creating one-off utility scripts (e.g., database migrations, testing scripts) or markdown analysis files, YOU MUST ALWAYS place them inside the `useless/` directory at the root of the project. This folder is already added to `.gitignore`. Never create these files outside of the `useless/` folder so that `git add .` does not accidentally stage them for GitHub.

# Deploying a Vite Project to GitHub Pages

To release your flashcard application to GitHub Pages, the most robust and modern approach is to use GitHub Actions to automatically build your Vite project and deploy it. 

Since you are using **Vite**, there are a couple of small structural adjustments needed first so that your static files (`data.csv` and `audio/`) are handled correctly during the production build.

Here is the step-by-step guide to get it deployed:

### 1. Move Static Assets to a `public` Folder
By default, Vite does not include random files in the root directory during the build (`npm run build`). You must place static assets into a folder named `public`. 
* Create a folder called `public` in the root of your project.
* Move `data.csv` into `public/data.csv`.
* Move your `audio/` directory into `public/audio/`.

*(Because they are in the `public` folder, Vite will serve them at the root path, so your `index.js` fetch code like `fetch('data.csv')` and `new Audio('audio/word.mp3')` will still work perfectly without any code changes!)*

### 2. Add a `vite.config.js` file (If applicable)
If you are deploying to a repository page (e.g., `https://<username>.github.io/<repo-name>/`), you must tell Vite the base path.
Create a file named `vite.config.js` in your root directory:
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  // Replace '<repo-name>' with your actual GitHub repository name!
  base: '/<repo-name>/', 
})
```
*(Note: If you are deploying to a User page like `vrzalamatej.github.io`, you can skip this step or set `base: '/'`)*

### 3. Create a GitHub Actions Workflow
You can automate the deployment so that every time you push to your `main` branch, it builds and updates GitHub Pages.
Create the following file in your project: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ] # Or 'master', depending on your default branch name

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install Dependencies
        run: npm install

      - name: Build Project
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist # Vite outputs the build to the 'dist' folder
```

### 4. Enable Settings in GitHub
1. Push all your changes to your GitHub repository.
2. Go to your repository on GitHub.
3. Click **Settings** > **Pages** (on the left sidebar).
4. Under the **Source** dropdown, select **\`gh-pages\`** branch and click Save. (The GitHub Action above will automatically create this branch for you on the first run).

# How to Update Your Site on Netlify

## Method 1: Drag and Drop (Easiest)

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Open your site dashboard (melodic-pithivier-5dfc2b)
3. Go to the **Deploys** tab
4. Find the drag-and-drop area (usually shows "Want to deploy a new version without connecting to Git? Drag and drop your site output folder here")
5. Drag the entire `hy_250403` folder onto that area
6. Wait for the deployment to complete

## Method 2: Using Netlify CLI (Recommended)

### First Time Setup:

1. Install Node.js if you haven't already: [https://nodejs.org/](https://nodejs.org/)
2. Install Netlify CLI globally:
   ```powershell
   npm install -g netlify-cli
   ```
3. Login to Netlify:
   ```powershell
   netlify login
   ```
   (This will open your browser for authentication)

4. Link your site (run this in the `hy_250403` folder):
   ```powershell
   cd hy_250403
   netlify link
   ```
   - Choose "Existing site"
   - Select your site from the list

### For Future Updates:

Simply run in PowerShell from the `hy_250403` folder:
```powershell
netlify deploy --prod
```

Or use the provided script:
```powershell
.\deploy.ps1
```

## Method 3: Git Integration (Best for Version Control)

1. Push your code to GitHub, GitLab, or Bitbucket
2. In Netlify dashboard:
   - Go to **Site configuration** → **Build & deploy**
   - Under **Continuous Deployment**, click **Link to Git provider**
   - Follow the prompts to connect your repository
3. Configure build settings:
   - **Base directory**: `hy_250403`
   - **Publish directory**: `hy_250403` (or leave blank if base is set)
   - **Build command**: (leave blank for static site)
4. Every time you push to your repository, Netlify will automatically deploy!

## Quick Reference

- Your site URL: https://melodic-pithivier-5dfc2b.netlify.app/
- Site folder: `hy_250403`
- Main file: `index.html`

## Notes

- After deploying, changes are usually live within 30-60 seconds
- You can check deployment status in the Netlify dashboard
- Netlify provides a preview URL for each deployment before you publish

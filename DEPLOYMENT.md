# Deploying Multiplayer Hangman to Render

This guide will help you deploy your Multiplayer Hangman game to Render.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Multiplayer Hangman game"

# Add your GitHub repository as origin
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Using the Render Dashboard (Recommended)

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure Service**:
   - **Name**: `multiplayer-hangman` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" (for testing) or "Starter" (for production)

4. **Environment Variables**:
   - Click "Advanced" to expand options
   - Add these environment variables:
     ```
     NODE_ENV=production
     PORT=10000
     ```

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Wait for deployment to complete (5-10 minutes)

#### Option B: Using render.yaml (Auto-deploy)

If you included the `render.yaml` file in your repository:

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to deploy

### 3. Configure Your Domain

After deployment:

1. **Find Your URL**: Render will provide a URL like `https://your-app-name.onrender.com`
2. **Update Backend Configuration**: 
   - In your `backend/server.js`, update the `FRONTEND_URL` in line 12 to match your actual Render URL
   - Or set it as an environment variable in Render dashboard

### 4. Test Your Deployment

1. **Visit Your App**: Open the Render-provided URL
2. **Test Functionality**:
   - Create a room
   - Join from another browser/device
   - Play a complete game
   - Check if all real-time features work

## Environment Variables Reference

Set these in your Render service dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets environment to production |
| `PORT` | `10000` | Port for Render deployment |
| `FRONTEND_URL` | Your Render URL | CORS configuration (optional) |

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check that all dependencies are in package.json
   - Ensure Node version compatibility (16+)
   - Check build logs for specific errors

2. **App Won't Start**:
   - Verify start command is correct: `npm start`
   - Check that backend/server.js exists
   - Review application logs in Render dashboard

3. **Socket.io Connection Issues**:
   - Ensure WebSocket connections are allowed
   - Check CORS configuration in server.js
   - Verify frontend is connecting to correct URL

4. **Static Files Not Serving**:
   - Ensure frontend build folder exists
   - Check that static file serving is configured correctly

### Checking Logs:

1. Go to your Render service dashboard
2. Click on "Logs" tab
3. Look for error messages or connection issues

## Performance Tips

### For Production:

1. **Upgrade Plan**: Free tier goes to sleep after 15 minutes of inactivity
2. **Custom Domain**: Add your own domain in Render settings
3. **SSL**: Automatically provided by Render
4. **Monitoring**: Set up uptime monitoring

### Scaling:

- **Free Tier**: Good for testing, sleeps after inactivity
- **Starter Tier**: $7/month, always on, better performance
- **Standard Tier**: For high traffic applications

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Room creation works
- [ ] Multiple players can join
- [ ] Real-time gameplay functions
- [ ] Timer works correctly
- [ ] Game over screen displays
- [ ] All buttons and navigation work
- [ ] Mobile responsiveness verified

## Updating Your App

To deploy updates:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push
   ```
3. Render will automatically redeploy (if auto-deploy is enabled)
4. Or manually trigger deploy from Render dashboard

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Community**: [community.render.com](https://community.render.com)
- **Socket.io Documentation**: [socket.io/docs](https://socket.io/docs)

Your Multiplayer Hangman game should now be live and accessible to players worldwide! 🎉
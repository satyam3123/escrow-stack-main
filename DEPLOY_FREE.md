# Deploy Escrow Stack for Free

## 🚀 Free Deployment on Render

This guide deploys your **entire app** (backend API + React frontend) on **Render's free tier** — no costs.

### Step 1: Push the deployment files
✅ Already done! These files were just added to your repo:
- `render.yaml` — deployment configuration
- `render-start.js` — production startup script
- `server/.env.production` — server environment variables
- `web/.env.production` — frontend environment variables

### Step 2: Go to Render and deploy

1. Visit **https://render.com** and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing Git repository"**
   - If you haven't connected GitHub yet, click "Connect GitHub" and authorize
4. Find and select **`satyam3123/escrow-stack-main`**
5. Fill in the deployment settings:
   - **Name:** `escrow-stack`
   - **Environment:** `Node`
   - **Build Command:** `npm run install:all && npm --prefix web run build`
   - **Start Command:** `node render-start.js`
   - **Instance Type:** `Free`

6. **Add Environment Variables** (click "Advanced"):
   ```
   NODE_ENV        = production
   JWT_SECRET      = your-super-secret-key-here-min-32-chars
   CORS_ORIGIN     = https://escrow-stack.onrender.com
   DB_PATH         = /tmp/escrow.db
   TICK_MS         = 1000
   VITE_API_URL    = https://escrow-stack.onrender.com
   ```

7. Click **"Create Web Service"** and wait ~5-10 minutes for the build

### Step 3: Test your deployment

Once Render shows "Live", open your app URL (like `https://escrow-stack.onrender.com`).

Test:
- **Sign up** with an email
- **Subscribe** to stocks (GOOG, TSLA, etc.)
- Watch prices update **live every second** via WebSocket

---

## 💰 Cost Breakdown

| Service | Cost | Limits |
|---------|------|--------|
| Render Free Tier | $0 | Includes 750 free compute hours/month |
| SQLite Database | Included | Stored on `/tmp/` (ephemeral, resets on redeploy) |
| **Total Monthly** | **$0** | ✅ Completely free |

**Note:** If the app is inactive for 15 min, Render will spin it down. First request takes ~30s to restart. To avoid this, upgrade to Hobby tier ($7/month).

---

## 🔧 Troubleshooting

### App won't build
- Check Render's build logs for errors
- Ensure `npm --prefix server install` completes successfully
- Verify Node.js version is 20+

### WebSocket not connecting
- Make sure `CORS_ORIGIN` matches your Render URL exactly
- Check browser console for connection errors
- Verify `VITE_API_URL` is set correctly

### Database keeps resetting
- `/tmp/` is ephemeral on Render (deleted on redeploy)
- For persistent data, upgrade to paid tier + PostgreSQL
- For free testing, current setup is fine

---

## 🎯 What's included

✅ **Backend:** Express + Socket.IO + SQLite  
✅ **Frontend:** React (Vite) dashboard  
✅ **WebSocket:** Live price updates  
✅ **Auth:** JWT + bcrypt password hashing  
✅ **Single URL:** API + frontend served from one domain  

---

## Next steps (optional)

- **Mobile app:** Deploy separately to Expo or TestFlight
- **Custom domain:** Add a domain in Render's project settings ($12/year)
- **Persistent database:** Upgrade to Render Hobby tier + add PostgreSQL

---

Questions? Check Render's docs: https://render.com/docs

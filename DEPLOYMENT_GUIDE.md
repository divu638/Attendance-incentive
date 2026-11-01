# 🚀 Attendify – Live Cloud Deployment Guide

Follow this 3-step guide to take **Attendify** live on **GitHub**, **Vercel**, and **Render**.

---

## Step 1: Push Code to GitHub

1. Open your browser and go to [github.com/new](https://github.com/new).
2. Repository name: `attendify-web3` (or any name you prefer).
3. Set visibility to **Public** (or **Private**).
4. Leave *"Initialize this repository with a README"* **unchecked**.
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/attendify-web3.git`).
7. In your terminal / command prompt, run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/attendify-web3.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy Backend to Render (Free Web Service)

1. Go to [dashboard.render.com](https://dashboard.render.com) (sign in with GitHub).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your `attendify-web3` repository.
4. Configure the settings:
   - **Name**: `attendify-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Create Web Service**.
6. Once deployed, Render will display your backend URL (e.g. `https://attendify-api.onrender.com`). Copy this URL.

---

## Step 3: Deploy Frontend to Vercel (Instant HTTPS Web App)

1. Go to [vercel.com/new](https://vercel.com/new) (sign in with GitHub).
2. Select your `attendify-web3` repository and click **Import**.
3. Configure the settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `frontend`)
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://attendify-api.onrender.com` (your Render backend URL from Step 2)
4. Click **Deploy**.
5. In ~45 seconds, Vercel will give you a live production link (e.g. `https://attendify-web3.vercel.app`)!

---

## Summary of Configuration Files Added:
- [`vercel.json`](./vercel.json): Configured SPA routing rewrites so page refreshes never return 404.
- [`render.yaml`](./render.yaml): Auto-configures Render Node.js runtime.
- [`frontend/src/api.js`](./frontend/src/api.js): Uses `VITE_API_URL` when in cloud production, and local proxy when offline.

# 🧸 Droomvriendjes Kinderboeken

E-commerce platform voor Droomvriendjes kinderproducten.

## 📋 Setup

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm install
npm run build
```

The `/frontend/build` directory will be deployed to Cloudflare Pages.

### Backend (Optional - for local development)
```bash
cd backend
pip install -r requirements.txt
python server.py
```

## 🚀 Deployment

### Cloudflare Pages Integration
1. Connect your GitHub repository to Cloudflare Pages
2. Set Build command: `npm run build` (from frontend directory)
3. Set Output directory: `frontend/build`
4. Automatic deployments on every `git push`

No Wrangler, no external agents, just pure GitHub + Cloudflare Pages.

## 🔒 Security
- No external agent dependencies
- All configuration in version control
- Environment variables managed via Cloudflare dashboard

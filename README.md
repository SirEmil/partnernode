# Partnernode - Contract Sender

A professional CRM and SMS automation platform that integrates Pipedrive CRM with JustCall SMS services. Built with Next.js frontend and Express.js backend, designed for deployment on Google Cloud Run.

**CRM integrated system for Partnernode, allows for a way more simple way of sending contracts**

## 🚀 Features

- **Modern Authentication**: Secure JWT-based login and registration
- **CRM Integration**: Fetch leads directly from Pipedrive CRM
- **SMS Automation**: Send SMS messages through JustCall API
- **Professional UI**: Clean, modern interface inspired by JustCall
- **Cloud Ready**: Optimized for Google Cloud Run deployment
- **Responsive Design**: Works seamlessly on desktop and mobile

## 📁 Project Structure

```
contract-sender/
├── api/                    # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/        # API routes (auth, leads, sms)
│   │   ├── middleware/    # Authentication middleware
│   │   └── index.ts       # Main server file
│   ├── Dockerfile         # API container configuration
│   └── cloudbuild.yaml    # Google Cloud Build config
├── frontend/              # Frontend (Next.js)
│   ├── app/               # Next.js app directory
│   │   ├── dashboard/     # Dashboard page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── Dockerfile         # Frontend container configuration
│   └── cloudbuild.yaml    # Google Cloud Build config
├── docker-compose.yml     # Local development setup
├── deploy.sh             # Deployment script
└── env.example           # Environment variables template
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for containerized deployment)
- Google Cloud CLI (for Cloud Run deployment)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd contract-sender
   npm install
   cd api && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual API tokens and configuration
   ```

3. **Start development servers:**
   ```bash
   # From root directory
   npm run dev
   
   # Or start individually:
   npm run dev:api      # API on http://localhost:3001
   npm run dev:frontend # Frontend on http://localhost:3000
   ```

4. **Using Docker Compose:**
   ```bash
   docker-compose up --build
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# API Configuration  
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Pipedrive CRM Integration
PIPEDRIVE_API_TOKEN=your-pipedrive-api-token

# JustCall SMS Integration
JUSTCALL_API_TOKEN=your-justcall-api-token
JUSTCALL_DEFAULT_FROM_NUMBER=+1234567890

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Leads (Pipedrive Integration)
- `GET /api/leads/fetch` - Fetch leads from Pipedrive
- `GET /api/leads/:id` - Get specific lead details

### SMS (JustCall Integration)
- `POST /api/sms/send` - Send SMS message
- `GET /api/sms/status/:messageId` - Get SMS status
- `GET /api/sms/history` - Get SMS history

## 🚀 Deployment to Google Cloud Run

### Prerequisites
- Google Cloud Project with billing enabled
- Google Cloud CLI installed and authenticated
- Required APIs enabled (Cloud Run, Cloud Build, Container Registry)

### Deploy

1. **Update the deployment script:**
   ```bash
   # Edit deploy.sh and replace 'your-project-id' with your actual project ID
   ```

2. **Run deployment:**
   ```bash
   ./deploy.sh your-project-id us-central1
   ```

3. **Set environment variables in Cloud Run:**
   ```bash
   # API service
   gcloud run services update contract-sender-api --region=us-central1 \
     --set-env-vars="PIPEDRIVE_API_TOKEN=your-token,JUSTCALL_API_TOKEN=your-token,JWT_SECRET=your-secret"
   
   # Frontend service  
   gcloud run services update contract-sender-frontend --region=us-central1 \
     --set-env-vars="NEXT_PUBLIC_API_URL=https://your-api-url.run.app"
   ```

### Manual Deployment

If you prefer manual deployment:

1. **Build and push API:**
   ```bash
   cd api
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Build and push Frontend:**
   ```bash
   cd frontend
   gcloud builds submit --config cloudbuild.yaml
   ```

## 🔑 API Integrations

### Pipedrive CRM
1. Go to [Pipedrive Settings > API](https://app.pipedrive.com/settings/api)
2. Generate a new API token
3. Add the token to your environment variables

### JustCall SMS
1. Go to [JustCall Settings > API](https://app.justcall.io/settings/api)
2. Generate a new API token
3. Add the token and your phone number to environment variables

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface inspired by JustCall
- **Responsive Layout**: Optimized for all device sizes
- **Dark/Light Theme**: Automatic theme switching
- **Real-time Updates**: Live data refresh and notifications
- **Intuitive Navigation**: Easy-to-use dashboard and controls

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## 📊 Monitoring & Health Checks

- Health check endpoints (`/health`)
- Container health checks in Docker
- Cloud Run health monitoring
- Error logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API integration guides

---

Built with ❤️ using Next.js, Express.js, and Google Cloud Run

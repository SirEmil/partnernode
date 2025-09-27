<div align="center">

# 🚀 Partnernode Contract Sender

**Professional CRM & SMS Automation Platform**

*Streamline contract management with intelligent CRM integration and automated SMS workflows*

[![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-green?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[![Deploy to Google Cloud Run](https://img.shields.io/badge/Deploy%20to-Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/run)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)

---

</div>

## ✨ Overview

**Partnernode Contract Sender** is a cutting-edge business automation platform that revolutionizes contract management by seamlessly integrating Pipedrive CRM with JustCall SMS services. Built with modern web technologies, it provides a professional, scalable solution for businesses looking to automate their contract workflows.

### 🎯 **Key Value Proposition**
> *"Transform your contract management from manual processes to intelligent automation - reducing time, eliminating errors, and boosting customer satisfaction."*

---

## 🌟 Features

### 🔐 **Enterprise Authentication**
- **Firebase-powered security** with JWT tokens
- **Role-based access control** (Admin/User levels)
- **Secure user management** with encrypted passwords
- **Session management** with automatic token refresh

### 📊 **CRM Integration**
- **Pipedrive API integration** for real-time lead data
- **Organization number search** for instant lead lookup
- **Auto-population** of customer details
- **Lead management** with comprehensive data display

### 📱 **SMS Automation**
- **JustCall API integration** for reliable SMS delivery
- **Dynamic contract templates** with placeholder substitution
- **E.164 phone number formatting** for international compatibility
- **Delivery status tracking** and confirmation management

### 🎨 **Modern UI/UX**
- **Responsive design** optimized for all devices
- **Professional dashboard** with intuitive navigation
- **Real-time updates** and live data refresh
- **Clean, modern interface** inspired by industry leaders

### ⚙️ **Admin Features**
- **Comprehensive SMS records** with advanced filtering
- **User activity monitoring** and analytics
- **Product & terms management** system
- **Settings configuration** for SMS sender numbers

---

## 🏗️ Architecture

<div align="center">

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[Dashboard] --> B[Auth Context]
        A --> C[API Client]
        D[Admin Panel] --> C
        E[Settings] --> C
    end
    
    subgraph "Backend (Express.js)"
        F[Auth Routes] --> G[Firebase Admin]
        H[SMS Routes] --> I[JustCall API]
        J[Leads Routes] --> K[Pipedrive API]
        L[Products/Terms] --> M[Firestore]
    end
    
    subgraph "External Services"
        N[Firebase Auth]
        O[Firestore DB]
        P[JustCall SMS]
        Q[Pipedrive CRM]
    end
    
    B --> F
    C --> H
    C --> J
    C --> L
    G --> N
    I --> P
    K --> Q
    M --> O
    
    style A fill:#e1f5fe
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#f3e5f5
    style H fill:#e0f2f1
    style J fill:#fce4ec
    style L fill:#fff8e1
```

</div>

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)
- **Google Cloud CLI** (for Cloud Run deployment)

### ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/SirEmil/partnernode.git
cd partnernode

# Install dependencies
npm install
cd api && npm install
cd ../frontend && npm install
cd ..
```

### 🔧 Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit with your credentials
nano .env
```

**Required Environment Variables:**
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# API Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Pipedrive CRM
PIPEDRIVE_API_TOKEN=your-pipedrive-token

# JustCall SMS
JUSTCALL_API_TOKEN=your-justcall-token

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 🏃‍♂️ Running the Application

```bash
# Development mode (both frontend & backend)
npm run dev

# Or run individually:
npm run dev:api      # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:3000

# Docker Compose
docker-compose up --build
```

---

## 📚 API Documentation

### 🔐 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User authentication |
| `GET` | `/api/auth/me` | Get current user data |

### 📊 CRM Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads/fetch?org_number=123456789` | Fetch leads by organization number |
| `GET` | `/api/leads/:id` | Get specific lead details |

### 📱 SMS Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sms/send` | Send SMS with contract template |
| `PATCH` | `/api/sms/confirm/:firestoreId` | Confirm contract acceptance |
| `GET` | `/api/sms/records` | Get all SMS records (Admin only) |

### ⚙️ Configuration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Create new product |
| `GET` | `/api/terms` | Get all terms & conditions |
| `GET` | `/api/sms-settings` | Get SMS configuration |

---

## 🎨 User Interface

### 🏠 **Dashboard**
- **Lead Search**: Find customers by organization number
- **SMS Composer**: Create and send contract SMS
- **Product Selection**: Choose from predefined contract templates
- **Real-time Preview**: See exactly what customers will receive

### 👑 **Admin Panel**
- **SMS Records**: Comprehensive view of all sent messages
- **Advanced Filtering**: Filter by status, date, user, confirmation
- **User Management**: Monitor team activity
- **Analytics**: Track contract confirmation rates

### ⚙️ **Settings**
- **Product Management**: Create and edit contract templates
- **Terms & Conditions**: Manage legal document links
- **SMS Configuration**: Set sender numbers and preferences

---

## 🔒 Security Features

- **🔐 JWT Authentication** with Firebase Admin SDK
- **🛡️ Role-based Access Control** (RBAC)
- **🔒 Password Encryption** with bcrypt
- **🌐 CORS Protection** and security headers
- **✅ Input Validation** with Joi schemas
- **🚫 Rate Limiting** on API endpoints
- **🔍 SQL Injection Protection** (NoSQL with Firestore)

---

## 🚀 Deployment

### ☁️ Google Cloud Run

```bash
# Deploy with one command
./deploy.sh your-project-id us-central1

# Set environment variables
gcloud run services update partnernode-api --region=us-central1 \
  --set-env-vars="FIREBASE_PROJECT_ID=...,PIPEDRIVE_API_TOKEN=..."
```

### 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 📦 Manual Deployment

```bash
# API Service
cd api
gcloud builds submit --config cloudbuild.yaml

# Frontend Service
cd frontend
gcloud builds submit --config cloudbuild.yaml
```

---

## 🔌 Integrations

### 📊 **Pipedrive CRM**
- **Real-time lead data** synchronization
- **Custom field mapping** for organization numbers
- **Person details** including phone numbers
- **Deal tracking** and status updates

### 📱 **JustCall SMS**
- **Reliable SMS delivery** with status tracking
- **International number support** (E.164 format)
- **Delivery confirmations** and error handling
- **Cost-effective messaging** for business use

### 🔥 **Firebase**
- **User authentication** and management
- **Real-time database** with Firestore
- **Secure data storage** with encryption
- **Scalable infrastructure** for growth

---

## 📊 Performance & Monitoring

- **⚡ Fast API responses** with optimized queries
- **📈 Real-time monitoring** with health checks
- **🔍 Error logging** and debugging tools
- **📊 Performance metrics** and analytics
- **🚨 Alert system** for critical issues

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **💾 Commit your changes**: `git commit -m 'Add amazing feature'`
4. **📤 Push to the branch**: `git push origin feature/amazing-feature`
5. **🔄 Open a Pull Request**

### 📝 Development Guidelines

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test coverage** for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Community

### 📞 **Getting Help**
- **🐛 Bug Reports**: [Create an issue](https://github.com/SirEmil/partnernode/issues)
- **💡 Feature Requests**: [Start a discussion](https://github.com/SirEmil/partnernode/discussions)
- **📚 Documentation**: Check the [Wiki](https://github.com/SirEmil/partnernode/wiki)

### 🌟 **Show Your Support**
- **⭐ Star this repository** if you find it helpful
- **🐦 Follow us** for updates and announcements
- **💬 Join discussions** to share ideas and feedback

---

<div align="center">

### 🚀 **Ready to Transform Your Contract Management?**

[![Deploy to Google Cloud Run](https://img.shields.io/badge/Deploy%20Now-Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/run)
[![Try it Live](https://img.shields.io/badge/Try%20it-Live%20Demo-00C851?style=for-the-badge)](https://your-demo-url.com)

**Built with ❤️ by the Partnernode Team**

*Empowering businesses through intelligent automation*

---

[![GitHub stars](https://img.shields.io/github/stars/SirEmil/partnernode?style=social)](https://github.com/SirEmil/partnernode/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/SirEmil/partnernode?style=social)](https://github.com/SirEmil/partnernode/network)
[![GitHub watchers](https://img.shields.io/github/watchers/SirEmil/partnernode?style=social)](https://github.com/SirEmil/partnernode/watchers)

</div>
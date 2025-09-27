#!/bin/bash

# Contract Sender Deployment Script for Google Cloud Run
# Make sure you have gcloud CLI installed and authenticated

set -e

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}

if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Please provide your Google Cloud Project ID as the first argument"
    echo "Usage: ./deploy.sh <PROJECT_ID> [REGION]"
    echo "Example: ./deploy.sh my-contract-sender-project us-central1"
    exit 1
fi

echo "🚀 Starting deployment to Google Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Deploy API
echo "🔧 Deploying API..."
cd api
gcloud builds submit --config cloudbuild.yaml --substitutions=_PROJECT_ID=$PROJECT_ID,_REGION=$REGION
cd ..

# Get API URL
API_URL=$(gcloud run services describe contract-sender-api --region=$REGION --format="value(status.url)")
echo "✅ API deployed at: $API_URL"

# Update frontend environment variable
echo "🔄 Updating frontend configuration..."
sed -i.bak "s|https://contract-sender-api-\[YOUR-PROJECT-ID\].run.app|$API_URL|g" frontend/cloudbuild.yaml

# Deploy Frontend
echo "🎨 Deploying Frontend..."
cd frontend
gcloud builds submit --config cloudbuild.yaml --substitutions=_PROJECT_ID=$PROJECT_ID,_REGION=$REGION
cd ..

# Get Frontend URL
FRONTEND_URL=$(gcloud run services describe contract-sender-frontend --region=$REGION --format="value(status.url)")
echo "✅ Frontend deployed at: $FRONTEND_URL"

# Restore original cloudbuild.yaml
mv frontend/cloudbuild.yaml.bak frontend/cloudbuild.yaml

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔌 API URL: $API_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env file with the production URLs"
echo "2. Configure your environment variables in Cloud Run"
echo "3. Set up your Pipedrive and JustCall API tokens"
echo ""
echo "🔧 To update environment variables:"
echo "gcloud run services update contract-sender-api --region=$REGION --set-env-vars=\"PIPEDRIVE_API_TOKEN=your-token,JUSTCALL_API_TOKEN=your-token\""
echo "gcloud run services update contract-sender-frontend --region=$REGION --set-env-vars=\"NEXT_PUBLIC_API_URL=$API_URL\""

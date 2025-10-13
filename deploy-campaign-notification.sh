#!/bin/bash

# Campaign Purchase Notification Deployment Script
# This script deploys the email notification system for campaign purchases

set -e  # Exit on any error

echo "🚀 Campaign Purchase Notification Deployment"
echo "=============================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase

    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Supabase CLI"
        echo "Please install manually: npm install -g supabase"
        exit 1
    fi
    echo "✅ Supabase CLI installed successfully"
else
    echo "✅ Supabase CLI found: $(supabase --version)"
fi

echo ""

# Check if logged in to Supabase
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    exit 1
fi
echo "✅ Authenticated with Supabase"

echo ""

# Link to project if not linked
echo "🔗 Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked"
    echo "🔗 Linking to project rrnaquethuzvbsxcssss..."
    supabase link --project-ref rrnaquethuzvbsxcssss

    if [ $? -ne 0 ]; then
        echo "❌ Failed to link project"
        echo "Please link manually: supabase link --project-ref rrnaquethuzvbsxcssss"
        exit 1
    fi
    echo "✅ Project linked successfully"
else
    echo "✅ Project already linked"
fi

echo ""

# Deploy the Edge Function
echo "📦 Deploying Edge Function: send-campaign-purchase-notification"
supabase functions deploy send-campaign-purchase-notification

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi
echo "✅ Edge Function deployed successfully"

echo ""

# Check if RESEND_API_KEY is set
echo "🔑 Checking environment secrets..."
if supabase secrets list | grep -q "RESEND_API_KEY"; then
    echo "✅ RESEND_API_KEY is set"
else
    echo "⚠️  RESEND_API_KEY not found"
    echo ""
    echo "Please set your Resend API key:"
    echo "  supabase secrets set RESEND_API_KEY=your_api_key_here"
    echo ""
    read -p "Do you want to set it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Resend API key: " api_key
        supabase secrets set RESEND_API_KEY="$api_key"
        echo "✅ RESEND_API_KEY set successfully"
    else
        echo "⚠️  Skipping... Please set RESEND_API_KEY later"
    fi
fi

echo ""

# Apply database migration
echo "🗄️  Applying database migration..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to apply database migration"
    echo ""
    echo "You can try manually:"
    echo "  supabase db push"
    exit 1
fi
echo "✅ Database migration applied successfully"

echo ""
echo "=============================================="
echo "✨ Deployment Complete!"
echo "=============================================="
echo ""
echo "📧 Email notifications will be sent to: tanjunsing@gmail.com"
echo "🎯 Trigger: When any user purchases a campaign"
echo ""
echo "📋 Next Steps:"
echo "  1. Test by purchasing a campaign in the app"
echo "  2. Check logs: supabase functions logs send-campaign-purchase-notification"
echo "  3. Verify email was sent to tanjunsing@gmail.com"
echo ""
echo "📚 Documentation: supabase/functions/send-campaign-purchase-notification/README.md"
echo ""

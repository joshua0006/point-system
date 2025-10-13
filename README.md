# AgentHub

A modern marketplace platform that combines marketing campaign management with client relationship gifting to help businesses manage outreach and strengthen client connections.

## 🚀 Core Features

### 1. Campaign Management System

Three campaign types with AI-assisted workflows:

- **Facebook Ads** → Targeted advertising campaigns with ad copy generation
  `src/pages/FacebookAdsCampaigns.tsx:164`
- **Cold Calling** → Outreach campaigns with script generation
  `src/pages/ColdCallingCampaigns.tsx:170`
- **VA Support** → Virtual assistant service campaigns
  `src/pages/VASupportCampaigns.tsx:176`

**Features:**
- Campaign wizards and templates
- Budget calculators
- AI-powered script and ad copy generation
- Campaign monitoring dashboards
- Real-time analytics

### 2. Gifting Platform

Send personalized gifts to clients and partners to strengthen relationships.

- Browse merchant catalog with redemption system
  `src/pages/Gifting.tsx:29`
- Flexi credits balance management
- Receipt upload and reimbursement workflow
- Track gift delivery and engagement
- Admin approval process for reimbursements

### 3. Wallet & Subscription System

Credit-based economy with flexible subscription management.

- **Credit Types:** Flexi credits, awarded credits
- Subscription plan management with Stripe integration
- Transaction history and ledger
- Upcoming charges tracking
- Top-up functionality
- Payment methods management

### 4. Real-Time Messaging

Comprehensive communication system between buyers, sellers, and consultants.

- Conversation management
  `src/data/userFlows.ts:5`
- Auto-reply settings
- Message notifications
- Booking coordination
- Review and rating system

### 5. Admin Dashboard

Comprehensive admin controls at `/admin-dashboard`:

- **User Management** → Manage user accounts, permissions, and profiles
- **Billing Oversight** → Track transactions, subscriptions, and credits
- **Service Management** → Assign and manage services
- **Campaign Monitoring** → Analytics and performance tracking
- **Reimbursement Approval** → Review and approve gift reimbursements
- **Campaign Scripts & Targets** → Manage campaign templates and targeting

### 6. Service Marketplace

Browse and book services from consultants.

- Service catalog with filtering
- Consultant profiles with reviews
- Service detail pages with booking system
- Booking management and tracking
- Session scheduling

### 7. AI Features

Intelligent tools to enhance productivity.

- **AI Assistant** → `/ai-assistant`
  `src/config/routes.ts:224`
- **Ad Copy Generator** → `/ad-copy-generator`
  `src/config/routes.ts:229`
- Campaign script generation via Supabase Edge Functions
- Smart budget recommendations
- Automated template suggestions

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **shadcn/ui** - Modern, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Server state management

### Backend
- **Supabase**
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions (AI integrations)
- **Stripe** - Payment processing

### UI/UX
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Modern icon library
- **Recharts** - Data visualization
- **React Hook Form + Zod** - Form validation

---

## 📋 Getting Started

### Prerequisites

- Node.js 18+ & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account (for backend services)
- Stripe account (for payment processing)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd agenthub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Environment Variables

Configure your `.env` file with:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

---

## 🏗️ Project Structure

```
agenthub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── campaigns/      # Campaign management components
│   │   ├── chat/           # Messaging components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── gifting/        # Gifting platform components
│   │   ├── marketplace/    # Marketplace components
│   │   ├── subscription/   # Subscription management
│   │   ├── wallet/         # Wallet and credits components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route pages
│   │   ├── admin/          # Admin pages
│   │   └── ...             # Other pages
│   ├── config/             # Route and navigation config
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript types
│   └── utils/              # Helper functions
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

---

## 🚀 Deployment

### Vercel (Recommended)

```sh
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```sh
# Build command
npm run build

# Publish directory
dist
```

### Build for Production

```sh
npm run build
```

The build output will be in the `dist/` directory.

---

## 🔑 Key User Flows

### 1. Authentication & Onboarding
User sign-up → Email confirmation → Profile approval → Dashboard access

### 2. Campaign Launch
Select campaign type → Choose template → Set budget → Review → Launch

### 3. Gifting Process
Browse merchants → Select gift → Upload receipt → Admin approval → Credits awarded

### 4. Subscription Management
View plans → Select/upgrade → Stripe checkout → Credits awarded → Unlock awarded credits

---

## 📊 Features by User Role

### **Buyers/Users**
- Launch and manage campaigns
- Send gifts to clients
- Manage wallet and subscriptions
- Book services from consultants
- Track spending and transactions

### **Consultants/Sellers**
- Offer services on marketplace
- Manage bookings and sessions
- Track earnings
- Communicate with clients
- Receive reviews and ratings

### **Admins**
- User management
- Campaign monitoring
- Reimbursement approval
- Billing oversight
- Service assignment
- Analytics and reporting

---

## 🎯 Development Scripts

```sh
# Development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🔗 Key Routes

- `/` - Dashboard home
- `/campaigns` - Campaign management hub
- `/campaigns/facebook-ads` - Facebook Ads campaigns
- `/campaigns/cold-calling` - Cold calling campaigns
- `/campaigns/va-support` - VA support campaigns
- `/gifting` - Gifting platform
- `/marketplace` - Service marketplace
- `/ai-assistant` - AI assistant
- `/ad-copy-generator` - Ad copy generation tool
- `/admin-dashboard` - Admin control panel
- `/settings` - User settings

---

**AgentHub v2.0** | Built with React, TypeScript, Supabase, and shadcn/ui

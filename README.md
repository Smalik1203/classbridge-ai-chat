# ClassBridge AI Chat

A modern React application built with TypeScript, Vite, and shadcn/ui components.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd classbridge-ai-chat

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Development

The development server will start on `http://localhost:8080` with hot reload enabled.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/        # shadcn/ui components
│   └── ChatBot.tsx
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── integrations/  # External service integrations
│   └── supabase/  # Supabase client and types
└── lib/           # Utility functions
```

## Deployment

This project can be deployed to any static hosting service like:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Build the project with `npm run build` and deploy the `dist` folder.

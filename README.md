# IoTMart (Frontend)

IoTMart is a premium e-commerce platform dedicated to providing industrial IoT hardware, microcontrollers, and development boards. 
This directory contains the **Frontend** of the application.

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **State Management**: Context API
- **PWA**: vite-plugin-pwa (Fully Installable App)
- **Icons**: Lucide React

## Key Features

- 🛒 **Dynamic E-Commerce Shop**: Browse hardware, filters, and dynamic search.
- 💳 **Secure Checkout**: Cart management and integration with Razorpay/Cashfree (Mock/Real).
- 🔐 **Authentication**: User & Admin secure login, email & mobile OTP verification.
- 👨‍💻 **User Profile**: Track orders, view transaction receipts, download invoices, and manage 2FA settings.
- 🛡️ **Admin Dashboard**: Comprehensive control panel to manage users, inventory (products), analytics, and system logs.
- 📱 **Progressive Web App (PWA)**: Can be installed on desktops and mobile devices natively.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   cd iot-ecommerce
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
   *(Update the URL to your deployed backend URL in production).*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for Production:
   ```bash
   npm run build
   ```
   *The optimized output will be generated in the `dist/` folder.*

## Project Structure
- `/src/components` - Reusable UI components (admin, navigation, profile, layout)
- `/src/context` - Global state providers (Auth, Cart, Wishlist)
- `/src/hooks` - Custom React hooks (usePWAInstall, useCart)
- `/src/pages` - Main page views (Shop, Profile, Admin Dashboard)
- `/src/services` - API client handlers to communicate with the backend
- `/src/utils` - Helper functions (PDF generation, formatters)

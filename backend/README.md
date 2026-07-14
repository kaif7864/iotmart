# IoTMart API (Backend)

This is the backend API for the IoTMart E-Commerce Platform. It serves as the central data engine, providing a robust, fast, and scalable API architecture for the frontend application.

## Tech Stack

- **Framework**: FastAPI (Python 3.9+)
- **Database**: MongoDB Atlas via `Motor` (Async Driver)
- **Authentication**: JWT (JSON Web Tokens), PyJWT, bcrypt
- **Caching & Rate Limiting**: Redis, SlowAPI
- **Other Services**: Twilio (SMS), Brevo / smtplib (Emails), Groq (AI Chatbot), Cashfree (Payments)

## Key Features

- 🔐 **Secure Authentication System**: Custom JWT auth, Role-Based Access Control (RBAC), Mobile & Email OTP verification mechanisms.
- ⚙️ **Two-Factor Authentication (2FA)**: Opt-in layer for advanced account security.
- 📦 **Order & Inventory Management**: Atomic stock deductions, real-time tracking integration logic.
- 💳 **Payment Processing**: Webhooks configured for live transaction tracking via Cashfree/Razorpay.
- 🚀 **Performance**: High-speed asynchronous routes using FastAPI and MongoDB `Motor`. Redis integration for efficient data caching.
- 🤖 **AI Assistant**: Built-in endpoints to power an AI support agent querying products and policies.

## Getting Started

### Prerequisites
- Python 3.9 or higher
- A running MongoDB instance (Local or Atlas Cluster)
- A running Redis server (Local or Upstash)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (Recommended):
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   Create a `.env` file in the `backend/` root:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=iot_mart
   SECRET_KEY=your_very_secret_key_here
   REDIS_URL=redis://localhost:6379/0
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   
   # External APIs (Optional for local testing if bypasses are active)
   BREVO_API_KEY=your_brevo_key
   GMAIL_USER=your_email@gmail.com
   TWILIO_ACCOUNT_SID=your_twilio_sid
   GROQ_API_KEY=your_groq_api_key
   CASHFREE_APP_ID=your_cashfree_id
   CASHFREE_SECRET_KEY=your_cashfree_secret
   ```

5. Run the Server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Access the API Documentation:
   FastAPI automatically generates interactive documentation:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure
- `/api/v1` - API routes and endpoints (auth, users, products, orders, etc.)
- `/core` - Application config, database connection logic, security utilities.
- `/repositories` - Database interaction layer (Separation of concerns).
- `/schemas` - Pydantic models for request/response validation.
- `/services` - Third-party integrations (Emails, SMS, Payments, AI, Logistics).
- `/scripts` - Database seeders and backfill scripts.

# Rural Tech Innovation Challenge 3.0 Registration Platform

A premium, modern, fully responsive, and highly secure registration web application for the **Rural Tech Innovation Challenge 3.0**. Built using a dark futuristic UI theme with animated particle backdrops, glassmorphism card layouts, robust server-side schemas, and a secure administration control panel.

---

## 🚀 Key Features

* **Landing Page**: Fully responsive layout using Bootstrap 5, AOS scroll animations, GSAP scrolling, custom countdown timer, FAQs accordion, and responsive Dark/Light themes.
* **Team Validations**: Enforces the constraint of exactly 4 members per team (1 Leader + 3 Members). Includes real-time validation checks for email syntax, phone length, and inputs.
* **Auto-saved Drafts**: Autosaves form input fields to `localStorage` on keystroke, protecting users from losing typed data due to accidental reloads.
* **UPI Payment Integration**: Embeds a dynamic UPI QR Code linking directly to the destination UPI ID, calculating fees dynamically (₹1400 total fee at ₹350/member), and requires uploading transaction IDs and payment screenshots (up to 10MB JPG/PNG/PDF).
* **Success Celebrations**: Triggers canvas confetti upon successful registration, displaying a unique sequential Team ID (e.g. `RTIC0001`) with QR codes, copy-ID buttons, and downloadable PDF receipts generated entirely on the client side using `html2pdf.js` and `qrcode.js`.
* **Admin Dashboard**:
  - Secure login protected by JSON Web Tokens (JWT) and bcrypt hashing.
  - Tally metrics: Total Teams, Total Participants, Amount Collected, Pending, Approved, and Rejected counts.
  - Operations table with search queries, status dropdowns, screenshot modal viewer, and details editor.
  - Data exporting: Generates formatted CSVs, Microsoft Excel spreadsheets, and print-ready stylesheets.
* **Email Notifications**: Nodemailer-driven SMTP dispatches sending confirmation HTML mails to the Team Leader upon initial registration, approval, or rejection.
* **Advanced Security**: Integrated `helmet` headers, CORS protections, `express-rate-limit` (prevents API spam and registration DDoS), `express-mongo-sanitize` (blocks NoSQL injections), and `xss-clean` (filters inputs against cross-site scripting).

---

## 📁 Project Directory Structure

```
├── client/
│   ├── index.html           # Main Landing Page with Countdown, Rules, and Registration Form
│   ├── success.html         # Registration Success Page with receipt, QR code, and download PDF button
│   ├── admin/
│   │   ├── index.html       # Admin Panel Dashboard and Login Panel overlay
│   │   └── admin.js         # Admin dashboard fetching, status updates, editing, and CSV export
│   └── assets/
│       ├── css/
│       │   └── style.css    # Premium CSS with glassmorphism variables, dark themes, and animations
│       └── js/
│           └── main.js      # Core client animations, validation logic, draft autosaves, and AJAX submits
├── server/
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose connection config
│   ├── controllers/
│   │   ├── authController.js# Admin JWT authorization controller
│   │   └── teamController.js# Team registrations, duplicate checks, counter increments, and mail senders
│   ├── middlewares/
│   │   ├── auth.js          # JWT verify token header gatekeeper
│   │   └── upload.js        # Multer validation for screenshots (JPG/PNG/PDF size <= 10MB)
│   ├── models/
│   │   ├── Counter.js       # Atomic counter schema for concurrent-safe unique Team ID creation
│   │   └── Team.js          # Main team registrations document schema with multi-field indexes
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication API endpoints
│   │   └── teamRoutes.js    # Team CRUD management API endpoints
│   ├── uploads/             # Stores uploaded transaction proof screenshots
│   ├── .env.example         # Template containing environment variables configurations
│   ├── .env                 # Local environment variables configuration file
│   └── server.js            # Main Express entry point with secure headers and rate limiters
├── setup_node.sh            # Installs localized Node environment in workspace
└── README.md                # Comprehensive documentation guide
```

---

## 🛠️ Local Development Setup

### Prerequisite

To run this project, make sure Node.js (v18.x or higher) is installed. If you do not have it installed or are working in a sandbox without global node, you can run the setup script to download a portable copy:

```bash
bash setup_node.sh
```

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   # Prepend node bin path if using the portable environment script:
   export PATH="../.node_env/bin:$PATH"
   npm install
   ```

### Configuration (.env)

Create a `.env` file in the `server/` directory (you can copy `.env.example` as a starting point) and adjust the parameters:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas URL - Replace with your target cluster connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/RTIC2026?retryWrites=true&w=majority

# JWT Token Secret Key
JWT_SECRET=your_super_secret_jwt_key_here

# Admin Default Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123 # Hashed with bcrypt during sign-in verification

# Email SMTP Settings (Nodemailer config)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_organizer_email@gmail.com
SMTP_PASS=your_gmail_app_specific_password
```

### Starting the Server

Launch the backend Express application:

```bash
export PATH="../.node_env/bin:$PATH" # (If using setup_node.sh)
npm run dev
```

* **Frontend Landing Page**: `http://localhost:5000/`
* **Admin Dashboard**: `http://localhost:5000/admin/`

---

## 🔒 Security Best Practices Implemented

1. **JWT Auth Session**: All admin verification, retrieval, edits, and deletions are gated by checking standard Bearer JSON Web Tokens in header requests.
2. **Double-layer Sanitization**:
   - `helmet` protects from basic clickjacking, sniffing, and framing.
   - `express-mongo-sanitize` intercepts NoSQL characters to block injection.
   - `xss-clean` filters out JavaScript tags and malicious scripts in payload strings.
3. **API Rate Limiters**:
   - Main APIs are capped at 100 requests per 15 minutes per IP.
   - Team registration submission is capped at 10 requests per hour per IP to prevent bot registrations and server storage exhaustion.
4. **File Validation**: Multer verifies mime-types and extensions strictly before writing uploads to disk, blocking execution files, and rejects items exceeding 10MB.

---

## 🌐 Production Deployment Guide

### MongoDB Atlas Setup

1. Create a free cluster on MongoDB Atlas.
2. Under **Network Access**, add an IP Access List (for Render, configure `0.0.0.0/0` to allow dynos, or specify Render's outbound IPs).
3. Under **Database Access**, create a user with readWrite permissions.
4. Copy the connection string and paste it into the backend environment variables as `MONGO_URI`.

### Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your Git repository.
3. Set the following configuration:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment**, add all variables specified in `.env.example` (especially `MONGO_URI`, `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS`, etc.).
5. Add a **Disk** mount if you wish uploaded payment screenshots to persist across dyno redeploys (mount `/opt/render/project/src/server/uploads` to preserve them, or update file uploading to handle Cloudinary/S3).

### Frontend Deployment (Vercel)

Since the frontend is a collection of static files (HTML, CSS, JS) that communicate with the backend via API, you can easily host it on Vercel:

1. Create a `vercel.json` file in the project root to handle static routing and redirect client API calls to the Render backend URL:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-backend-service.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://your-backend-service.onrender.com/uploads/$1" }
     ]
   }
   ```
2. Deploy the `client/` folder to Vercel. In Vercel Project Settings, set the **Build Command** to override (blank or `echo "no build needed"`) and **Output Directory** to `client`.
3. Save and deploy. The static frontend will load and direct all dynamic API actions and payment proof uploads seamlessly to Render.

# Cloud-Based Telemedicine Platform

A secure, full-stack telemedicine system designed for remote patient-doctor consultations. This project features role-based authentication, medical document management, and automated file lifecycle management.

## 🚀 Features
- **Role-Based Access Control**: Separate portals for Patients, Doctors, and Admins.
- **Secure Authentication**: JWT-based login with password hashing.
- **Case Management**: Patients can upload medical documents; doctors can review and respond.
- **Lifecycle Automation**: Automatically archives patient files when a case is closed.
- **Responsive UI**: Clean, hospital-style interface built with vanilla HTML/CSS/JS.
- **Production Ready**: Structured for deployment on AWS EC2 with Nginx.

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **File Storage**: Local filesystem (simulating S3 structure)
- **Auth**: JSON Web Tokens (JWT), BcryptJS

## 📂 Project Structure
```text
/telemedicine-platform
├── /backend
│   ├── /controllers    # Business logic
│   ├── /middleware     # Auth & Role protection
│   ├── /models         # Mongoose schemas
│   ├── /routes         # API endpoints
│   ├── server.js       # Entry point
│   └── .env            # Configuration
├── /frontend
│   ├── /css            # Stylesheets
│   ├── /js             # Frontend logic
│   └── index.html      # Main entry
├── /uploads            # Active patient files
└── /archive            # Archived files (Lifecycle)
```

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/telemedicine
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
The frontend is served statically by the backend. Once the server is running, open your browser and navigate to:
`http://localhost:5000`

## ☁️ Deployment on AWS EC2
1. **Launch Instance**: Use Ubuntu 22.04 LTS.
2. **Install Node.js & MongoDB**:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm mongodb
   ```
3. **Clone Project**: Upload your files to the instance.
4. **Setup Nginx**:
   - Install Nginx: `sudo apt install nginx`
   - Configure reverse proxy to point to port 5000.
5. **Run with PM2**:
   - `sudo npm install -g pm2`
   - `pm2 start server.js --name telemed`

## 🛡 Security & Lifecycle
- **JWT**: All protected routes require a valid Bearer token.
- **Lifecycle**: When a doctor clicks "Close Case", the system moves the patient's uploaded files from `/uploads` to `/archive` and logs the event in the database.

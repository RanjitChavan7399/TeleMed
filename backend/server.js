require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(morgan('dev'));

// Ensure uploads and archive directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const archiveDir = path.join(__dirname, '../archive');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

// Static files
app.use('/uploads', express.static(uploadsDir));
app.use('/archive', express.static(archiveDir));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine';
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('Could not connect to MongoDB', err);
    });

app.listen(PORT,"0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

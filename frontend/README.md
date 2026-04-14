# CareFusion Hospital Management System

A comprehensive MERN stack hospital management system with role-based access control for 6 user profiles: Patient, Doctor, Staff, Pharmacy, Laboratory, and Admin.

## Features

### 👨‍⚕️ Doctor Dashboard
- View daily appointments and patient queue
- Access patient Electronic Medical Records (EMR)
- Create digital prescriptions
- Request lab tests

### 👨‍⚕️ Patient Dashboard
- Book appointments with doctors
- View appointment history
- Access prescriptions
- Download lab reports

### 👥 Staff Dashboard
- Manage daily OPD queue with token system
- Book appointments for walk-in patients
- View patient and doctor lists
- Update queue status

### 💊 Pharmacy Dashboard
- View incoming prescriptions
- Mark prescriptions as dispensed
- Track dispensing history

### 🔬 Laboratory Dashboard
- View lab test requests
- Update test status (pending → in-progress → completed)
- Upload test reports (PDF)

### 🔐 Admin Dashboard
- Create user accounts for all roles
- Manage system users
- View analytics and statistics
- Monitor system activity

## Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt for password hashing
- Multer for file uploads

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- Modern CSS with custom design system

## Project Structure

```
Hospital/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── staffController.js
│   │   ├── pharmacyController.js
│   │   └── laboratoryController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Staff.js
│   │   ├── Pharmacy.js
│   │   ├── Laboratory.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   ├── LabTest.js
│   │   └── Queue.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── patient.js
│   │   ├── doctor.js
│   │   ├── staff.js
│   │   ├── pharmacy.js
│   │   └── laboratory.js
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   ├── Patient/
    │   │   ├── Doctor/
    │   │   ├── Staff/
    │   │   ├── Pharmacy/
    │   │   ├── Laboratory/
    │   │   ├── Admin/
    │   │   └── Shared/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB installed and running
- MongoDB Compass (optional, for database management)

### 1. Setup Backend

```bash
cd d:\Hospital\backend

# Install dependencies
npm install

# Configure environment variables
# The .env file is already created with default values
# Modify if needed:
# - PORT=5000
# - MONGODB_URI=mongodb://localhost:27017/carefusion
# - JWT_SECRET=your_secret_key

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Setup Frontend

```bash
cd d:\Hospital\frontend

# Install dependencies (if not already done)
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Create Initial Admin User

Since all users must be created by Admin, you need to create the first admin user manually in MongoDB.

**Option 1: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Open the `carefusion` database
4. Open the `users` collection
5. Add a new document:

```json
{
  "email": "admin@hospital.com",
  "password": "$2a$10$X3xF8Z9YhWqN5JKL7mP0xOeH9pQ2RtV6wS4lB8vC9nD5gE7fU0iZm",
  "role": "admin",
  "status": "approved",
  "createdAt": {"$date": "2026-02-11T00:00:00.000Z"},
  "updatedAt": {"$date": "2026-02-11T00:00:00.000Z"}
}
```

**Option 2: Using MongoDB Shell**

```bash
mongosh
use carefusion

db.users.insertOne({
  email: "admin@hospital.com",
  password: "$2a$10$X3xF8Z9YhWqN5JKL7mP0xOeH9pQ2RtV6wS4lB8vC9nD5gE7fU0iZm",
  role: "admin",
  status: "approved",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Default Admin Credentials:**
- Email: `admin@hospital.com`
- Password: `admin123`

### 4. Access the Application

1. Open your browser and go to `http://localhost:5173`
2. Login with admin credentials
3. Create users for other roles (doctor, patient, staff, etc.)
4. Logout and login with different role credentials to test

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/create-user` - Create new user
- `GET /api/admin/users/:role` - Get users by role
- `GET /api/admin/analytics` - Get system analytics

### Patient
- `GET /api/patient/appointments` - Get appointments
- `POST /api/patient/appointments` - Book appointment
- `GET /api/patient/prescriptions` - Get prescriptions
- `GET /api/patient/lab-reports` - Get lab reports

### Doctor
- `GET /api/doctor/appointments` - Get appointments
- `GET /api/doctor/patient/:id` - Get patient EMR
- `POST /api/doctor/prescription` - Create prescription
- `POST /api/doctor/lab-request` - Request lab test

### Staff
- `GET /api/staff/queue` - Get daily queue
- `POST /api/staff/queue` - Add patient to queue
- `PUT /api/staff/queue/:id` - Update queue status
- `GET /api/staff/appointments` - Get appointments
- `POST /api/staff/appointment` - Book appointment

### Pharmacy
- `GET /api/pharmacy/prescriptions` - Get prescriptions
- `PUT /api/pharmacy/dispense/:id` - Dispense prescription

### Laboratory
- `GET /api/laboratory/tests` - Get lab tests
- `PUT /api/laboratory/test/:id` - Update test status
- `POST /api/laboratory/upload-report/:id` - Upload report

## User Workflow

1. **Admin** creates accounts for all users (doctors, staff, patients, etc.)
2. **Patients** login and book appointments
3. **Staff** manages daily OPD queue and walk-in patients
4. **Doctors** view appointments, access patient EMR, create prescriptions, and request lab tests
5. **Pharmacy** receives prescriptions and dispenses medicines
6. **Laboratory** receives test requests, processes tests, and uploads reports
7. **Patients** can view their prescriptions and download lab reports

## Notes

- Admin must create all user accounts - there is no public registration
- Each role has a separate dashboard with specific permissions
- JWT tokens are used for authentication and stored in localStorage
- File uploads (lab reports) are stored in the `backend/uploads` directory

## Future Enhancements

- Real-time notifications using Socket.io
- Appointment reminder system
- Medicine inventory management
- Billing and payment integration
- Medical history timeline
- Report analytics and insights

## License

MIT License

---

Built with ❤️ using MERN Stack

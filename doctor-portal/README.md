# Doctor Portal - Patient Health Monitoring

A clean, professional Next.js web application for doctors to monitor their patients' health journals.

## Features

✅ **Doctor Authentication** - Secure sign up and sign in
✅ **Patient Management** - Add and remove patients from monitoring list
✅ **Journal Monitoring** - View all patient journal entries in real-time
✅ **Beautiful UI** - Modern design with Tailwind CSS
✅ **TypeScript** - Fully typed for better development experience
✅ **Firebase Backend** - Secure, scalable data storage

## Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 2. Create a Doctor Account

1. Click "Sign Up" on the login page
2. Enter your name, email, and password
3. Click "Create Account"

### 3. Add Patients

1. Once logged in, click the "+ Add" button
2. Select patients from the list (these are users from the mobile app)
3. Click "Add" to start monitoring them

### 4. View Patient Journals

- Click on any patient to view their journal entries
- See dates, moods, and full content
- All entries sorted newest first

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Deployment Ready**: Optimized for Vercel

## Project Structure

```
doctor-portal/
├── app/
│   ├── page.tsx           # Main page with auth logic
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── AuthForm.tsx       # Login/signup component
│   └── Dashboard.tsx      # Main dashboard
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   └── types.ts           # TypeScript types
└── package.json
```

## Important: Firebase Rules

Update your Firestore security rules to allow doctors to access patient data.
See `../FIRESTORE_RULES.md` for the required configuration.

## Building for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the project in Vercel
3. Deploy automatically

## Why This Matters

This doctor portal makes your health journal app **competitive and professional**:

- Real clinical integration for healthcare providers
- HIPAA-ready architecture with proper access controls
- Scalable for adding telehealth features
- Professional design that doctors will trust

## Future Enhancements

- Doctor notes on patient entries
- Mood trend analytics and charts
- Email alerts for concerning patterns
- Export patient data to PDF
- Video consultation integration
- Appointment scheduling

## Support

For issues or questions:
- Check Firebase Console for data/rules
- Review `../DOCTOR_PORTAL_SETUP.md` for detailed setup
- See `../FIRESTORE_RULES.md` for security configuration

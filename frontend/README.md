# SecureVault Frontend

Next.js frontend application for SecureVault - a secure digital vault for passwords, files, and notes.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The application runs at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.js                 # Landing page
│   ├── layout.js               # Root layout with providers
│   ├── globals.css             # Global styles
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── verify-otp/             # OTP verification page
│   ├── forgot-password/        # Password recovery page
│   ├── reset-password/         # Password reset page
│   ├── dashboard/              # Main dashboard
│   ├── profile/                # User profile page
│   ├── password-health/        # Password health report
│   ├── teams/                  # Team management
│   └── vault/
│       ├── passwords/          # Password manager
│       ├── files/              # Encrypted file storage
│       └── notes/              # Secure notes
│
├── components/                 # Reusable components
│   ├── Navbar.js               # Navigation bar
│   ├── Footer.js               # Footer component
│   ├── PasswordGenerator.js    # Password generator with options
│   └── PasswordStrengthMeter.js # Password strength indicator
│
├── context/                    # React contexts
│   └── AuthContext.js          # Authentication state management
│
└── lib/                        # Utilities
    └── api.js                  # Axios API client with interceptors
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview |
| `/login` | User login |
| `/register` | New user registration |
| `/verify-otp` | OTP verification for MFA |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password |
| `/dashboard` | Main dashboard with quick actions |
| `/profile` | User profile and security info |
| `/vault/passwords` | Password manager (add, edit, delete) |
| `/vault/files` | File storage with preview and download |
| `/vault/notes` | Secure notes editor |
| `/password-health` | Password health analysis |
| `/teams` | Team creation and file sharing |

## Key Features

- Responsive design with dark theme
- Animated UI with Framer Motion
- Password strength meter with real-time feedback
- Password generator with customizable options
- File preview for images and PDFs
- Search and filter functionality
- Team collaboration interface

## Technologies

- Next.js 16 with App Router
- React 19
- Axios for API requests
- Framer Motion for animations
- Lucide React for icons
- CSS with custom properties

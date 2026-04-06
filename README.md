# Smart QR Class Buddy

A modern attendance management system built with React, TypeScript, and Supabase. This application allows teachers to manage student attendance via QR codes and provides comprehensive reporting and analytics.

## Features

- **Authentication**: Secure login for teachers and students.
- **QR Code Attendance**: Students can scan QR codes to mark their attendance.
- **Session Management**: Create and manage class sessions.
- **Student Management**: Add, edit, and view student information.
- **Class Management**: Organize students into classes.
- **Reporting**: Generate detailed attendance reports.
- **Admin Dashboard**: Comprehensive overview of system usage.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Authentication)
- **State Management**: React Router, TanStack Query (optional)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-qr-class-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

- **Admin Portal**: Access the admin dashboard at `/admin`.
- **Login**: Use the credentials provided by your administrator.

## License

MIT

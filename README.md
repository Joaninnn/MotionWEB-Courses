# Motion WEB Platform

## 🎓 Overview

MotionCourse is a modern educational platform built on Next.js 15 that enables mentors to create, manage, and distribute video courses. The platform provides an intuitive interface for uploading videos, organizing lessons by categories, and managing educational content.

## ✨ Key Features

### 🎥 Video Content Management
- **Video Upload**: Simple and convenient video content upload with MP4 format support
- **Editing**: Full video information editing (course, category, lesson number, description)
- **Organization**: Systematization of videos by courses and lesson categories
- **Deletion**: Secure video content deletion with confirmation

### 👥 Role System
- **Mentors**: Full access to video content creation and management
- **Students**: Viewing and studying available courses, communicating with mentors
- **Administrators**: User and content management

### 💬 Communication System
- **Private Chats**: Direct communication between students and mentors
- **Group Chats**: Discussions within courses and topics
- **Media Exchange**: Sending videos and photos to demonstrate errors and questions
- **Instant Notifications**: Prompt responses to student questions

### 🔐 Security and Authentication
- **JWT Tokens**: Reliable authentication system with refresh tokens
- **Role-based Permissions**: Access control based on user roles
- **API Protection**: Secure data transfer between frontend and backend

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with SSR/SSG
- **React 18.3** - Library for building user interfaces
- **TypeScript 5** - Static typing for code reliability
- **Redux Toolkit** - Application state management
- **SCSS Modules** - Modular component styles
- **Framer Motion** - Animations and transitions
- **React Hook Form** - Form management

### UI/UX
- **Material-UI (MUI)** - Modern component library
- **Tailwind CSS 4** - Utility CSS framework
- **React Icons** - Interface icons
- **React Slick** - Carousels and sliders

### Backend Integration
- **RTK Query** - Efficient API request management
- **Axios** - HTTP client for API interaction
- **js-cookie** - Token cookie management
- **WebSocket** - Real-time for chats and notifications
- **Socket.io** - Real-time event handling

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone repository
git clone <repository-url>
cd motionCourses

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

### Environment Variables
Create `.env` file in project root:
```env
NEXT_PUBLIC_MOTIONCOURSE_API=http://your-api-url
```

## 📁 Project Structure

```
src/
├── appPages/                 # Application pages
│   ├── auth/                # Authentication
│   └── site/                # Main pages
│       ├── components/      # Page components
│       │   └── pages/       # Individual pages
│       └── layout/          # Layout components
├── assets/                  # Static resources
├── components/              # Common components
├── redux/                   # Redux store and API
│   ├── api/                # RTK Query endpoints
│   └── store/              # Redux configuration
└── provider/               # Application providers
```

## 🎯 Main Components

### Mentor Section
- **Upload**: Video upload and editing component
- **UploadedVideos**: List of uploaded videos with management functions
- **VideoCard**: Video card with preview and actions

### Communication System
- **ChatInterface**: Main chat interface with room list
- **MessageList**: Message display component with media support
- **MessageInput**: Message sending form with file upload capability
- **ChatRoom**: Chat room management (private and group)

### Authentication System
- **AuthInitializer**: Authentication initialization on load
- **Header**: Navigation with user status awareness
- **Login/Registration**: Login and registration forms

## 🔧 API Integration

The platform integrates with RESTful API via RTK Query:

### Main Endpoints
- `/mentor/videos/` - Get mentor videos
- `/video-create/` - Create new video
- `/video-update/{id}/` - Update and delete video
- `/auth/login/` - User authentication
- `/chat/messages/` - Get and send messages
- `/chat/rooms/` - Chat room management (private and group)
- `/chat/upload/` - Media file upload (video, photos) to chats

### Features
- Automatic token refresh
- Informative error handling
- Request caching for optimization

## 🎨 Design and UX

### Principles
- **Minimalism**: Clean and understandable interface
- **Adaptability**: Works on all devices
- **Accessibility**: WCAG compliance
- **Performance**: Optimized components and animations

### Styles
- SCSS Modules for style encapsulation
- Tailwind CSS for utility styles
- Material-UI for ready components
- Custom animations via Framer Motion

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Optimization
- Automatic Next.js image optimization
- Code splitting for fast loading
- SSR for SEO optimization
- Static generation where possible

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License. Details in LICENSE file.

---

**MotionCourse** - Making education accessible and modern! 🎓✨

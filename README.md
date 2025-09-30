# Collyer Site Management System

A responsive React dashboard for managing workers, visitors, and site attendance, with Firebase backend and REST API integration.

## Features

- **Admin & Officer Dashboards:**  
  Responsive dashboards for admins, gate officers, site agents, and more.
- **Sidebar Navigation:**  
  Mobile-friendly sidebar with hamburger menu and overlay.
- **Worker Management:**  
  - View, add, check-in/out workers
  - Download worker register as CSV
  - View worker history
- **Visitor Management:**  
  - View, add, check-out visitors
  - Search/filter visitors
- **Attendance Reports:**  
  - Upload and preview CSV attendance reports
  - Store reports in Firebase
- **Authentication:**  
  - Firebase Auth for login/logout
- **REST API Integration:**  
  - Connects to Google Cloud Functions for user management
  - OpenAPI spec provided for Copilot Studio or other integrations
- **Progressive Web App (PWA) Ready:**  
  - Can be installed on mobile devices

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

```sh
git clone https://github.com/yourusername/collyer-site-management.git
cd site-management
npm install
```

### Environment Variables

Create a `.env` file in the root with your Firebase config:

```
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
```

### Running Locally

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```sh
npm run build
```

### Deploying

You can deploy to [Render](https://render.com/), [Firebase Hosting](https://firebase.google.com/products/hosting), or any static hosting provider.  
For SPA routing, ensure you have a `_redirects` file with:

```
/*    /index.html   200
```

### REST API

- The backend is implemented with Google Cloud Functions.
- OpenAPI spec is provided in `openapi.json` for integration with Copilot Studio or other tools.

## License

MIT

---

**Collyer Site Management System**  
Built with React, Firebase, and ❤️

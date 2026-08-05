LEGAL AID MATCHING PLATFORM
Backend + Frontend Setup Guide
================================

This is a full-stack application built using :
- Spring Boot (Backend)
- React with Vite (Frontend)

The platform connects Citizens, Lawyers, and NGOs.

--------------------------------
PROJECT STRUCTURE 
--------------------------------

Legal-Aid-Matching-Platform-Group-A/

backend/
  demo/        -> Spring Boot application

frontend/      -> React + Vite application


--------------------------------
PREREQUISITES    
--------------------------------

Make sure the following are installed:

- Java 17 or higher
- Maven
- Node.js (v18 or higher recommended)
- npm
- PostgreSQL (or configured database)


--------------------------------
HOW TO START BACKEND (SPRING BOOT)
--------------------------------

1. Open terminal
2. Go to backend directory :

   cd backend/demo 

3. Run the application:

   mvn spring-boot:run

   OR (Windows Maven Wrapper):

   mvnw.cmd spring-boot:run

4. Backend will start on:

   http://localhost:8080


--------------------------------
HOW TO START FRONTEND (REACT + VITE)
--------------------------------

1. Open a new terminal
2. Go to frontend directory:

   cd frontend

3. Install dependencies:

   npm install

4. Start frontend server:

   npm run dev

5. Frontend will start on:

   http://localhost:5173


--------------------------------
BACKEND - FRONTEND CONNECTION
--------------------------------

Ensure frontend API base URL points to:

http://localhost:8080

(Check axiosClient.js or API configuration file)


--------------------------------
FRONTEND BUILD (OPTIONAL)
--------------------------------

To create production build:

npm run build

Build output will be generated in:

frontend/dist


--------------------------------
NOTES
--------------------------------

- Backend uses Spring Boot layered architecture
- Frontend uses component-based React structure
- Git workflow follows fork, branch, and pull request method


--------------------------------
TROUBLESHOOTING
--------------------------------

- Check if ports 8080 or 5173 are already in use
- Verify database credentials
- Ensure correct Java and Node versions are installed


--------------------------------
END OF FILE
--------------------------------

# Sistem Inventaris Room

## Architecture
This project is divided into two main parts:
- **Frontend**: A Vue.js/Nuxt.js based web application providing a responsive UI.
- **Backend**: A Node.js/Express based API connected to a MongoDB database.

The frontend communicates with the backend via REST APIs.

## Documentation
- The application supports an automated setup script (`start.bat`) for Windows users to easily install dependencies and launch the servers.
- Make sure MongoDB is running before starting the application, or configure the `.env` in the backend folder to point to a cloud MongoDB Atlas instance.
- Run `start.bat` for first-time launch and local development.

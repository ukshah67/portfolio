# Portfolio Manager

A full-stack portfolio management application built with React, Express, and TypeScript.

## Features
- **Real-time Data**: Fetches live stock prices from NSE/BSE using Yahoo Finance.
- **Portfolio Tracking**: Calculates total investment, current value, and overall P/L.
- **Interactive Charts**: Visualizes investment allocation.
- **Validation**: Ensures valid ticker symbols are added with auto-suggestions.

## Project Structure
- `client/`: Frontend application (React + Vite).
- `server/`: Backend API (Express).

## Getting Started

1.  **Install Dependencies**:
    ```bash
    # Client
    cd client
    npm install

    # Server
    cd ../server
    npm install
    ```

2.  **Start Development Servers**:
    You need to run both client and server in separate terminals.

    **Terminal 1 (Backend):**
    ```bash
    cd server
    npm run dev
    ```
    *Server runs on http://localhost:3002*

    **Terminal 2 (Frontend):**
    ```bash
    cd client
    npm run dev
    ```
    *Client runs on http://localhost:5173*

## Data Persistence
Currently, all portfolio data is saved in your browser's **Local Storage**. 
- The data persists even if you refresh or close the browser tab.
- **Important**: If you clear your browser cache or open the app in a different browser/incognito window, your data will not be available.

## Deployment
To deploy, you can use services like Vercel (frontend) and Render/Heroku (backend).

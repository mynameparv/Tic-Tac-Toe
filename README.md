# Multiplayer Server-Authoritative Tic-Tac-Toe

This is a production-ready, multiplayer Tic-Tac-Toe game leveraging a server-authoritative backend (Nakama) and a React frontend. The application follows clean architectural principles and is meant to be highly scalable.

## Architecture

*   **Backend**: [Nakama](https://heroiclabs.com/nakama/) by Heroic Labs, implementing authoritative matchmaking and game logic via custom TypeScript modules.
*   **Database**: CockroachDB (distributed SQL database used by Nakama).
*   **Frontend**: React (Vite) utilizing the Nakama JavaScript client for WebSocket communication without the need for additional HTTP routers.
*   **Deployment**: Dockerized backend, ready for AWS implementation.

### Why Server-Authoritative Design?
In multiplayer games, relying on a peer-to-peer (P2P) or client-authoritative model is susceptible to cheating. Clients can spoof messages, claiming they placed a mark out of turn or modified existing choices.
A **Server-Authoritative** model means the backend is the single source of truth:
1. **Move Validation**: The server checks if a move is valid (the cell is empty, it's the correct player's turn, the game hasn't ended).
2. **State Management**: The game state is stored and progressed entirely in the backend logic (`match_handler.ts`).
3. **Broadcasting**: The server broadcasts valid state changes symmetrically to connected clients.

---

## Setup Steps

### Prerequisites
*   Node.js (v18+)
*   Docker & `docker-compose`

### 1. Start the Backend

1. Navigate to the project root directory.
2. Build the backend code natively first:
   ```bash
   cd backend
   npm install
   npm run build
   ```
3. Run the Docker containers. This will start both CockroachDB and Nakama:
   ```bash
   cd ..
   docker-compose up -d --build
   ```
4. The Nakama server will be accessible natively at `http://127.0.0.1:7350`. (Dashboard at `http://127.0.0.1:7351` with credentials `admin:password`).

### 2. Start the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open two tabs of `http://localhost:5173` to play against yourself, or test locally across your network.

---

## How Multiplayer Works

1. **Authentication**: Users anonymously authenticate utilizing the device ID based matching logic in `nakamaClient.ts`.
2. **Matchmaking**: We utilize an RPC endpoint (`rpcFindMatch`) registered in `main.ts` that relies on Nakama's authoritative matchmaking functionality.
   *   Looks for existing empty rooms expecting a player.
   *   If none exists, it creates an authoritative match and awaits an opponent.
3. **Game Loop**: Sockets capture input -> Match handler validities index, current user, bounds -> Evaluates Winner / Draw -> Updates Match State -> Broadcasts Data via Opcodes.

---

## AWS Deployment Steps

To run this application in a production AWS setup:

### Phase 1: Deploy Nakama Backend (AWS ECS + RDS)
1. **ECR (Elastic Container Registry)**: Build the backend Docker image using `docker build -t nakama-tic-tac-toe ./backend` and push it to AWS ECR.
2. **Database (RDS)**: Set up an AWS RDS Postgres database (CockroachDB works well natively, but pure Postgres is fully supported by Nakama in production).
3. **ECS (Elastic Container Service) Fargate**: Provide task definitions ensuring `7350` and `7351` TCP ports are allowed on your security groups. Reference your RDS database environment variables in the task definition to replace the local Cockroach setup.
4. **Load Balancer (ALB)**: Expose an application load balancer pointing to ECS `7350` for WebSocket/HTTP APIs and configure a proper SSL/TLS ACM Certificate since modern browsers mandate `wss://` on secure applications.

### Phase 2: Deploy Frontend (S3 / CloudFront or Vercel)
1. In `frontend/src/services/nakamaClient.ts`, change `127.0.0.1` and `USE_SSL=false` to your newly created Application Load Balancer endpoint and true, respectively.
2. Run `npm run build` in the frontend directory.
3. Deploy the resulting `dist` directory to an AWS S3 Bucket strictly enabled for Static Web Hosting.
4. (Optional) Provide AWS CloudFront overlapping the S3 bucket to provide CDN edge delivery, fast TTFB, and HTTPS caching.

---
## Screenshots (Placeholder)

![Login Screen](https://via.placeholder.com/600x400?text=Nickname+Entry)
![Game Interface](https://via.placeholder.com/600x400?text=Playing+Tic-Tac-Toe)

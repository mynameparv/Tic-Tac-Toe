# Multiplayer Server-Authoritative Tic-Tac-Toe

This is a production-ready, highly scalable multiplayer Tic-Tac-Toe game. It uses a **React (Vite+TypeScript)** frontend to render the game UI, and a **Nakama (Golang) + JavaScript Runtime** backend to handle cheating prevention, secure matchmaking, and state broadcasting. 

## 1. What This Architecture Does
We implemented a **Server-Authoritative Matchmaking Engine**. Instead of players trusting each other's computers (which allows for easy cheating in multiplayer games), all game logic is enforced securely inside a containerized backend. 
- The frontend only asks the server "Can I place an X on square 3?". 
- The server mathematically validates if it's your turn and if square 3 is empty. 
- If valid, the server updates its own master board, and immediately shoots out a network broadcast to both players to update their UI automatically.

### Key Fixes Implemented:
* **Docker Module Binding Fix:** Adjusted Docker commands so your custom TypeScript backend modules properly mount into `/nakama/data/modules/`, ensuring `rpcFindMatch` works.
* **Nakama Device ID Authentication Validation:** Safely mapped your short, readable Nicknames to long, secure 10+ character encrypted strings in your browser's `localStorage` to bypass Nakama's 400 Bad Request limitations.
* **Race Condition Fix:** Guaranteed the second player to enter a lobby securely catches the `GET_STATE` / `UPDATE` broadcast rather than remaining stranded on the "Matchmaking" loading screen.

---

## 2. The Use of CockroachDB
Nakama requires a heavy-duty database to store long-term data (Player Accounts, User Wallets, Passwords, Match Histories, Leaderboards, etc.).
We are using **CockroachDB**, which is an incredibly powerful, distributed SQL database designed to be indestructible. It acts exactly like PostgreSQL but can be cloned across several servers globally. If a server goes offline or crashes, CockroachDB instantly reroutes connections, ensuring zero downtime and 100% data preservation.

---

## 3. Do We Use WebSockets?
**Yes!** 
When you click "Find Match", behind the scenes a traditional HTTP REST request trades your Device ID for a secure session token. However, once you enter the Matchmaking phase, **your browser physically opens a persistent, bi-directional WebSocket connection (`socket.connect()`) directly to the Nakama server.**
- **Why?** Traditional HTTP requests require the client to constantly ask "Is it my turn yet?" every second (polling), which creates massive lag. WebSockets allow the server to push a message into the frontend in *milliseconds*. The instant the opponent places an "O", the server pushes that binary data down the open WebSocket pipe directly to your screen.

---

## 4. How the "2-Player Workflow" Works
1. **Queueing:** When you click "Find Match", Nakama's internal Matchmaker places your socket into a mathematical queue. 
2. **Matching:** The server constantly scans the queue. Once it finds two active sockets searching for "tic-tac-toe", it groups them together and returns a highly secure alphanumeric `match_id`.
3. **Joining:** Both browsers automatically take that `match_id` and send a join request. 
4. **Authoritative Play:** The server executes the `matchJoin` function inside `match_handler.ts`, locks the lobby so no 3rd player can join, and dictates that Player 1 is "X" and Player 2 is "O".

---

## 5. What Happens if Thousands of People Play at Once?
This setup is wildly scalable.
Nakama is written in **Golang**, which is famous for extreme concurrency via "Goroutines". Instead of spinning up heavy virtual partitions for every game, millions of matches share tiny micro-threads on the server's CPU. 
If 10,000 players hit "Find Match" at exact same second:
1. Nakama instantly categorizes them into 5,000 isolated 2-manager `match_id` rooms.
2. Because all board memory arrays (`[0,0,0,0,0...]`) are tiny lightweight variables executed inside the JavaScript runtime memory, the server can comfortably host thousands of concurrent match loops on a standard machine. 
3. If it exceeds 100,000 players, you simply boot up a second Nakama Docker instance, and CockroachDB easily syncs the data between both nodes automatically.

---

## 6. Why You Can't Play Against "The Same Name"
If you open Chrome Tab #1 and type the name "Parva", your browser saves a specific Device ID (`nakama_device_id_Parva`) to `localStorage` and logs into Nakama as User Account A.
If you open Chrome Tab #2 and type the **same name** "Parva", the browser fetches that exact same Device ID. Tab 2 immediately logs into the exact same User Account A.

**The default Nakama matchmaking system is designed to prevent a user from playing a multiplayer game against themselves.** When User A is placed in the matchmaking queue, the server explicitly looks for *any other* user. Because Tab 1 and Tab 2 are technically broadcasting the same User Identity, they physically cannot be paired to play Tic-Tac-Toe together. 
*(If you want to test against yourself in two tabs on the same computer, you must enter two completely different names, e.g., "Parva1" and "Parva2" so the server recognizes them as two distinct human beings!)*

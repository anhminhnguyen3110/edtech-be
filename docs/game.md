
# Game (websocket)

![image.png](../images/image%209.png)

This architecture represents a scalable system designed to handle multiplayer game sessions involving teachers and students, where real-time communication is facilitated through **WebSockets**. The system is distributed across multiple servers, with **Redis** acting as the central communication bridge to synchronize sessions across different nodes. Below is a detailed breakdown of how the architecture works.

### 1. WebSocket Communication for Real-Time Interactions

The core of the system revolves around real-time communication between clients (teachers and students) and servers. Each client—whether it’s a teacher or a student—connects to the game through the `/games` endpoint on the server, establishing a **WebSocket** connection. This socket allows for bi-directional communication, essential for fast-paced interactions in multiplayer games.

- **Teacher and Students**: The diagram shows teachers and students interacting with the game by sending requests to `/games`. Each connection is managed via a WebSocket, enabling continuous communication between the clients and the server.
- **Server A and Server B**: The architecture is designed with multiple servers (Server A and Server B) to handle scalability and distribute the load. Each server runs multiple WebSocket instances to manage the connections. For example, Server A handles connections for Teacher, Student A, and Student B, while Server B manages connections for Student C, Student D, and Student E. This division allows the system to scale horizontally, accommodating more users by adding more servers.

### 2. Redis for Synchronization Across Servers

To synchronize the WebSocket communication between Server A and Server B, we utilize **Redis** as a central hub for real-time message broadcasting. The **Redis Adapter** ensures that messages sent to any server can be distributed to clients on any other server seamlessly.

- **Redis Adapter**: Each server has a **Redis Adapter** that connects the WebSocket layer to the Redis instance. The adapter listens for events (e.g., game state changes, user actions) and publishes these events to Redis.
- **Redis**: The Redis instance serves as a message broker, ensuring that all connected clients—regardless of the server they are connected to—are kept in sync. For instance, when a teacher sends a game update or a student makes a move, Redis ensures that this event is propagated to all clients involved in the game session, even if they are connected to different servers.

### 3. Horizontal Scalability and Load Distribution

One of the primary strengths of this architecture is its ability to scale horizontally. By distributing the WebSocket connections across multiple servers, the system can accommodate a growing number of users without sacrificing performance. Redis acts as the glue that keeps all the servers in sync, ensuring that even if users are connected to different nodes, they experience a seamless and synchronized game.

- **Server A and B**: As mentioned, each server runs multiple WebSockets. The system can easily scale by adding more servers (e.g., Server C, D, etc.) as the number of users increases. This design is especially useful for educational games where many students and teachers may interact in real-time during lessons.

### 4. Use Case for Educational Games

This architecture is particularly well-suited for multiplayer games in an educational context. Teachers can initiate game sessions that involve multiple students, each connecting from different locations. Whether it’s a quiz, puzzle, or collaborative game, the system ensures that all participants are kept in sync, with low latency, allowing for interactive and engaging learning experiences.

### Summary of Key Components:

- **WebSocket Communication**: Enables real-time bi-directional communication between the clients and servers, crucial for the interactive nature of multiplayer games.
- **Multiple Servers (Server A, Server B)**: Designed to handle scalability by distributing WebSocket connections across multiple servers.
- **Redis and Redis Adapter**: Redis serves as a central message broker, ensuring that events and messages are synchronized across all servers and clients.
- **Horizontal Scalability**: The system can scale by adding more servers as needed, making it flexible and resilient to increasing loads.


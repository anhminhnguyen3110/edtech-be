# Game pub/sub for auto-scaling

![image.png](../images/image%2010.png)

### WebSocket Connections

- **Teacher and Students Connection**:
    - The game participants, including the **teacher** and **students**, establish **WebSocket connections** to interact with the quiz game. These WebSocket connections are made through a `/games` endpoint.
    - **Server A** manages the WebSocket connections for the **teacher**, **Student A**, and **Student B**, listening on **port 8082**. These connections are handled by the **Socket Handler** on Server A.
    - **Server B**, which handles connections for **Student C**, **Student D**, and **Student E**, listens on **port 8083**. Server B also maintains its own **Socket Handler** to manage WebSocket communications.

### Event Emission and Handling

- **Teacher Emission of Start Game Event**:
    - The quiz game starts when the **teacher** emits a **Start Game** event via the WebSocket connection on **Server A**.
    - The **Socket Handler** on Server A intercepts this event and triggers the event-handling process.
    - Server A’s **Publisher A** prepares the event to be sent to Redis. This is done through the **Redis Adapter** integrated into the server.

### Publish-Subscribe Pattern for Event Synchronization

- **Publisher A Publishes to Redis**:
    - The **Publisher A** on Server A publishes the **Start Game** event to **Redis**, acting as a message broker for communication between servers.
    - Redis follows the **publish-subscribe (pub/sub) pattern**, which allows multiple servers to subscribe to the event. Redis takes the role of broadcasting the event to all servers in the system.
- **Redis Centralized Communication**:
    - Redis plays a central role in this architecture by ensuring that all connected servers receive the **Start Game** event.
    - Once **Server A** publishes the event to Redis, Redis makes sure that every subscribed server (like **Server B**) receives this event.

### Redis Event Reception on Other Servers

- **Subscriber A on Server B**:
    - **Server B**, which is responsible for managing **Student C**, **Student D**, and **Student E**, is subscribed to the Redis channel that receives the **Start Game** event.
    - The **Subscriber A** component of **Server B** listens for incoming events from Redis. When the **Start Game** event is published by Server A, Subscriber A on Server B immediately receives the event.
- **Socket Handler on Server B**:
    - Once **Subscriber A** on Server B receives the **Start Game** event from Redis, the event is forwarded to the **Socket Handler**.
    - The **Socket Handler** on Server B is responsible for broadcasting this event to all the students connected to Server B—namely, **Student C**, **Student D**, and **Student E**.
    - Thus, Redis ensures that even though the students are on different servers, they all receive the **Start Game** event simultaneously.

### Event Broadcasting to All Connected Clients

- **Server A Broadcasts to Students**:
    - On **Server A**, the **Socket Handler** receives the event internally and broadcasts the **Start Game** event to the connected clients (**Student A** and **Student B**).
    - The WebSocket broadcast ensures that the event reaches all students connected to the same server.
- **Server B Broadcasts to Students**:
    - Similarly, on **Server B**, the **Socket Handler** broadcasts the **Start Game** event to **Student C**, **Student D**, and **Student E** through their WebSocket connections.
    - This guarantees that all participants in the quiz game receive the start event, regardless of which server they are connected to.

### Horizontal Scaling and Server Synchronization

- **Horizontal Scalability**:
    - This architecture is designed to scale horizontally. As more participants (students and teachers) join the quiz game, additional servers can be introduced (e.g., **Server C**, **Server D**, etc.). Each new server can manage its own set of WebSocket connections.
    - Redis serves as the communication layer between these servers, ensuring that all game events, like starting the quiz or updating the game state, are synchronized across all connected clients.
- **Redis Synchronization**:
    - By using the **pub/sub pattern**, Redis maintains synchronization across all servers, ensuring that every server receives critical game events.
    - As each server publishes and subscribes to the same Redis channels, Redis ensures that every client (regardless of server) receives consistent, up-to-date game state information.

### Real-time Quiz Synchronization

- **Real-time Updates**:
    - The real-time nature of the WebSocket connections ensures that as soon as the **Start Game** event is emitted by the teacher, every participant—whether they are on Server A or Server B—receives the event simultaneously.
    - Redis enables this by acting as the synchronization layer, propagating the event to every server and maintaining the same game state for all participants.
- **Consistency Across Servers**:
    - This pub/sub architecture ensures that there are no discrepancies between participants on different servers. The quiz starts for all players at the same time, and further events (such as quiz questions or answers) follow the same synchronized pattern.

### Socket Management and Auto-Scaling

- **Socket Handler**:
    - Each server maintains its own **Socket Handler** for managing WebSocket connections. This component ensures that the server can communicate bi-directionally with all connected clients (teachers and students).
    - The Socket Handler is also responsible for handling incoming messages (like quiz answers) from students and broadcasting outgoing events (like new quiz questions).
- **Redis Adapter and Auto-Scaling**:
    - The **Redis Adapter** is crucial for allowing the system to auto-scale. As more users join, additional servers can be added, and Redis will ensure that these new servers are kept in sync with the existing ones.
    - Each server, whether new or existing, subscribes to the same Redis channels, allowing them to receive and publish events seamlessly, thus enabling real-time synchronization across all nodes.
# Downstream Task Workflow (Time-Consuming Operations)

![image.png](../images/image%204.png)

This second workflow is designed for handling **downstream, long-running tasks** that are resource-intensive and may significantly impact the user experience if not handled asynchronously. This pattern is crucial for tasks like quiz generation, assignment grading, or AI-powered content processing, which can take time to complete. Here’s how this workflow functions:

1. **API Request (from Browser)**:
    - The user initiates a request for a task that involves complex processing, such as generating an AI-driven report. This request is received by the **API Gateway Service**.
2. **Immediate API Response**:
    - The **API Gateway** sends an immediate response to the user’s browser, acknowledging the task but not blocking the user interface. This allows the user to continue other activities while the task is being processed in the background.
3. **Emit Task Event (API Gateway to RabbitMQ)**:
    - The API Gateway then emits a **Task Event** to **RabbitMQ**, which signifies that a long-running process needs to be initiated. RabbitMQ ensures that the message is delivered to the correct service in a decoupled manner, which allows for scalability and better resource management.
4. **Subscribe to Task Event (RabbitMQ to Internal Service)**:
    - The **Internal Service** subscribes to the task event and picks up the job when it’s ready to be processed. This service is designed to handle complex operations like running AI models, generating reports, or processing student submissions.
5. **Process Downstream Task (Internal Service)**:
    - The **Internal Service** processes the downstream task asynchronously. This ensures that the operation is completed independently of the user interface interaction, preventing user delays and improving system efficiency for complex tasks.
6. **Emit Notification Event (Internal Service to RabbitMQ)**:
    - Once the downstream task is complete, the **Internal Service** emits a **Notification Event** back to RabbitMQ. This event signals the completion of the task and readiness for user notification.
7. **Subscribe to Notification Event (RabbitMQ to API Gateway)**:
    - The **API Gateway Service** subscribes to the notification event. Upon receiving the event, it is ready to notify the user of the task’s completion.
8. **Emit Notification WebSocket (API Gateway to Browser)**:
    - The **API Gateway** uses **WebSocket** to push real-time notifications back to the user’s browser. This method ensures that the user is instantly notified when the long-running task has finished, without needing to refresh or manually check for updates.

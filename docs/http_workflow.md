# Traditional HTTP Request Workflow (CRUD Operations)

![image.png](../images/image%203.png)

This workflow is designed for handling standard **CRUD (Create, Read, Update, Delete)** operations, such as file uploads, downloads, or basic database interactions. It follows a straightforward **synchronous** pattern where the user interacts with the system and expects an immediate response. Here’s how this process flows:

1. **API Request (from Browser)**:
    - The user sends a request through the browser (e.g., uploading or fetching a file). This request is received by the **API Gateway Service**, which manages authentication, routing, and input validation.
2. **Send Message (API Gateway to RabbitMQ)**:
    - Instead of directly processing the request, the API Gateway offloads the task by sending a message to **RabbitMQ**. This allows for task decoupling, ensuring that any service can consume the task without blocking the API Gateway.
3. **Deliver Message (RabbitMQ to Internal Service)**:
    - RabbitMQ routes the message to the appropriate **Internal Service** responsible for file management. This could involve tasks like staging a file or preparing a file for download.
4. **Process (Internal Service)**:
    - The **Internal Service** processes the request, such as interacting with the **File System Stage Area** or **File System Main Area** to upload or retrieve a file. This processing happens in isolation from the user interaction, allowing for flexibility in handling complex file operations.
5. **Respond Message (Internal Service to RabbitMQ)**:
    - Once the file operation is complete, the **Internal Service** sends a response back to RabbitMQ, indicating that the task has been successfully processed.
6. **Respond Message (RabbitMQ to API Gateway)**:
    - RabbitMQ delivers the response message to the **API Gateway Service**, notifying it that the file operation is complete and the results are ready to be sent to the user.
7. **API Response (API Gateway to Browser)**:
    - The **API Gateway Service** sends the final response back to the browser, confirming that the operation (e.g., file upload, download, or CRUD operation) has been completed. This flow ensures quick feedback to the user without requiring the system to remain blocked during processing.

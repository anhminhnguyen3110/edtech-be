# Deployment architecture

![image.png](../images/image%2012.png)

### 1. Kubernetes Cluster & Microservices with Horizontal Autoscaling

At the core of this architecture is the **Kubernetes Cluster**, which is responsible for orchestrating the deployment, scaling, and management of the EdTech Assistant’s services. **Kubernetes’ Horizontal Pod Autoscaling** allows the system to automatically scale its microservices based on the load, ensuring that the system remains responsive and available during periods of high usage, such as when many students are taking quizzes or submitting assignments simultaneously.

### Microservices

- **API Gateway Service**: This service acts as the front door to the backend services, routing incoming API requests from the frontend or external systems to the appropriate microservice. The API Gateway also performs critical functions such as request validation, load balancing, rate limiting, and security (e.g., authentication and authorization).
- **Assignment Service**: Manages the creation, submission, and grading of student assignments. This service handles data-intensive tasks like processing submitted documents and running any automated grading algorithms. It scales horizontally to ensure smooth handling of many simultaneous submissions.
- **Quiz Service**: Generates quizzes, handles quiz submissions, and tracks student performance. As quizzes are a key feature of the platform, this service needs to dynamically scale based on user activity.
- **Chat Service**: Facilitates real-time communication between teachers and students, supporting interactive learning sessions, discussions, and student queries. This service must be low-latency to ensure instant messaging.

### Autoscaling

Kubernetes provides **Horizontal Pod Autoscaling (HPA)** for the core microservices. This allows services such as the **Quiz Service**, **Assignment Service**, and **Chat Service** to automatically adjust their pod count based on current traffic and CPU utilization. For example, during peak times—like when a large number of students are submitting assignments—the system will automatically spin up more instances (pods) of the **Assignment Service** to handle the additional load.

- **API Gateway Service**, **Assignment Service**, **Quiz Service**, and **Chat Service** all benefit from HPA to ensure the platform remains performant, even under varying loads.
- **RabbitMQ** is used for messaging between services. It acts as a message broker, allowing services to communicate asynchronously, thus decoupling service dependencies. This is especially useful in scenarios where real-time responses are not needed but reliability and message delivery are critical, such as processing quiz results or sending notifications.
- **Redis** is employed as a caching layer to improve the speed of frequently accessed data. For example, it can cache quiz results, session data, or frequently accessed educational materials. Redis is highly performant and ensures that responses are quick, even under high load.
- **Prometheus** is used for gathering real-time metrics from each of these microservices, helping the system monitor the health and performance of each service. This ensures that autoscaling decisions are based on accurate, up-to-date information.

### 2. TLS Issuer & Load Balancer for Secure Traffic Management

Security is a core aspect of the EdTech Assistant platform, and managing secure connections via TLS certificates is a key requirement. The architecture includes a **TLS Issuer and Load Balancer** system that handles secure communication between users and the backend services.

- **Vercel** is used as the frontend platform for hosting and delivering the web interface. All user interactions, such as teachers and students accessing the platform, are routed through Vercel to the backend services managed in the Kubernetes cluster.
- **Nginx Ingress Controller**: This component sits at the edge of the Kubernetes cluster and is responsible for managing external access to the internal services. It serves as the entry point for all HTTP and HTTPS requests. The Nginx controller integrates with **Let’s Encrypt** to handle the automated issuing and renewal of **TLS certificates**, ensuring all communication between clients (teachers, students) and the platform is encrypted and secure.
- **Let's Encrypt & Cert Manager**: The **Cert Manager** is used within Kubernetes to automate the management and renewal of SSL/TLS certificates through **Let's Encrypt**. It works alongside the Nginx Ingress Controller to request certificates for services running in the cluster, ensuring that all communication is secure and HTTPS is enforced across the system.
- **Porkbun DNS Provider**: The **DNS Mapper** from **Porkbun** is responsible for resolving domain names to the correct services. It ensures that users can access the platform securely by verifying domain ownership and pointing the domain to the Vercel platform, while also ensuring that the certificate requests are correctly mapped to the domain.

### 3. ELK Stack for Centralized Logging and Monitoring

For logging and observability, the architecture includes the **ELK Stack** (Elasticsearch, Logstash, and Kibana). This ensures that logs generated by the microservices are captured, processed, and visualized in a developer-friendly manner.

- **Filebeat**: This lightweight log shipper is deployed as a DaemonSet in the Kubernetes cluster, ensuring that logs from all pods are collected and forwarded to **Logstash** for processing.
- **Logstash**: Processes and enriches the logs received from Filebeat before forwarding them to **Elasticsearch**. Logstash can filter, transform, and enhance logs, making them more structured and easier to search.
- **Elasticsearch**: Acts as a distributed search and analytics engine, storing and indexing all logs from the services. It enables fast search capabilities and analytics, which are vital for debugging and monitoring performance.
- **Kibana**: A visualization layer that sits on top of Elasticsearch, allowing developers to search through logs, create dashboards, and visualize metrics such as error rates, latency, or system behavior. It provides real-time insights into the system's performance and health, helping developers track down issues efficiently.

### 4. Prometheus & Grafana for Metrics and Visualization

**Prometheus** and **Grafana** form the core of the monitoring and alerting system. Prometheus collects detailed metrics from every component in the cluster, allowing for deep insights into performance and potential bottlenecks.

- **Prometheus**: Scrapes metrics from Kubernetes nodes and microservices, including data such as CPU usage, memory consumption, request rates, and error counts. These metrics are crucial for making informed scaling decisions and for detecting anomalies in the system's behavior.
- **Grafana**: Visualizes the metrics collected by Prometheus in customizable dashboards. Developers and administrators can view real-time data on resource utilization, request performance, and service health. Grafana allows users to create alerts based on specific thresholds, ensuring proactive detection and resolution of issues before they affect users.
- **Metric Server**: Works in tandem with Prometheus to collect resource usage data at the pod and node levels. The **Metric Server** feeds this data into Kubernetes’ Horizontal Pod Autoscaler to automatically adjust the number of running pods based on CPU or memory usage, ensuring that the system remains responsive during peak loads.

### 5. Horizontal Pod Autoscaling for Dynamic Resource Management

Kubernetes' **Horizontal Pod Autoscaling (HPA)** is central to this architecture’s ability to handle fluctuating workloads efficiently. By automatically adjusting the number of pods running each microservice based on real-time demand, the platform ensures optimal resource usage.

- **API Gateway Service**, **Assignment Service**, **Quiz Service**, and **Chat Service** are all configured with HPA to scale in response to varying load conditions. This dynamic scaling helps avoid service degradation or downtime during periods of high usage, such as exam periods or assignment deadlines.
- **Prometheus metrics** drive these autoscaling decisions, with thresholds set to ensure that the services scale up when CPU or memory usage reaches critical levels. Once the demand subsides, HPA scales the services back down to conserve resources.

# Edtech-BE (Microservices System For Edtech Assistant)
You can access the web site from here: [Edtech Website](https://www.edtech-assistant.sbs/). 

You can find the front-end repository here: [Edtech Front-end Repository](https://github.com/anhminhnguyen3110/edtech-fe).

# Table of Contents

1. [Application Introduction](#application-introduction)
2. [Techstack](#techstack)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [AI & Data Engineering](#ai--data-engineering)
   - [DevOps](#devops)
   - [Testing](#testing)
3. [Performance Testing](#performance-testing)
4. [Micro-services architecture](#micro-services-architecture)
5. [Deployment architecture](#deployment-architecture)
6. [CI/CD pipeline](#cicd-pipeline)
7. [Traditional HTTP Request Workflow (CRUD Operations)](#traditional-http-request-workflow-crud-operations)
8. [Downstream Task Workflow (Time-Consuming Operations)](#downstream-task-workflow-time-consuming-operations)
9. [PowerPoint Generator Architecture](#powerpoint-generator)
10. [Intelligent Educational Question Answering Assistant (High-level Architecture)](#intelligent-educational-question-answering-assistant-high-level-architecture)
11. [Intelligent Educational Question Answering Assistant (Low-level Architecture)](#intelligent-educational-question-answering-assistant-low-level-architecture)
12. [Game (Websocket)](#game-websocket)
13. [Game pub/sub for auto-scaling](#game-pubsub-for-auto-scaling)


# Application Introduction

https://github.com/user-attachments/assets/dece0ded-eff1-4c5f-9665-4fa8f776bfec

# Techstack
## Frontend ([Repository](https://github.com/anhminhnguyen3110/edtech-fe))

<div style="display: inline-block; font-size: 22px;">
    <img src="images/react.png" alt="React" width="25" height="25"> ReactJS |
    <img src="images/nextjs.png" alt="Next.js" width="25" height="25" style="border-radius: 50%;"> NextJS |
    <img src="images/socket-io.png" alt="Socket.IO" width="25" height="25" style="border-radius: 50%;"> Socket.IO |
    <img src="images/material-ui.png" alt="Material-UI" width="25" height="25"> Material-UI |
    <img src="images/seo.png" alt="SEO" width="25" height="25"> Search Engine Optimization (SEO) |
    <img src="images/vercel.png" alt="Vercel" width="25" height="25"> Vercel
</div>

## Backend
<div style="display: inline-block; font-size: 22px;">
    <img src="images/nestjs.svg" alt="NestJS" width="25" height="25"> NestJS |
    <img src="images/nodejs.png" alt="Node.js" width="25" height="25"> NodeJS |
    <img src="images/typescript.png" alt="TypeScript" width="25" height="25"> TypeScript |
    <img src="images/rabbitmq.svg" alt="RabbitMQ" width="25" height="25"> RabbitMQ |
    <img src="images/redis.svg" alt="Redis" width="25" height="25"> Redis |
    <img src="images/redis-insight.png" alt="RedisInsight" width="25" height="25"> Redis Insight |
    <img src="images/mysql.png" alt="MySQL" width="25" height="25" style="border-radius: 50%;"> MySQL |
    <img src="images/prometheus.png" alt="Prometheus" width="25" height="25" style="border-radius: 50%;"> Prometheus |
    <img src="images/grafana.svg" alt="Grafana" width="25" height="25"> Grafana |
    <img src="images/Elasticsearch.png" alt="Elasticsearch" width="25" height="25"> Elasticsearch 
</div>

## AI & Data Engineering    
<div style="display: inline-block; font-size: 22px;">
    <img src="images/llm.png" alt="LLM" width="25" height="25"> Large Language Model (LLM) |
    <img src="images/VectorDB.png" alt="VectorDB" width="25" height="25" style="border-radius: 50%;"> Vector Database |
    <img src="images/Airflow.png" alt="Airflow" width="25" height="25"> Airflow |
    <img src="images/dbt.png" alt="dbt" width="75" height="25"> dbt |
    <img src="images/kafka.png" alt="Kafka" width="16" height="25"> Kafka |
    <img src="images/zoo.webp" alt="Zookeeper" width="25" height="25"> Zookeeper |
    <img src="images/delta_lake.png" alt="Delta Lake" width="25" height="25"> Delta Lake |
    <img src="images/scrapy.webp" alt="Scrapy" width="25" height="25"> Scrapy |
    <img src="images/selenium.png" alt="Selenium" width="25" height="25"> Selenium |
    🧠 Advanced Retriever-Augmented Generation (RAG)
</div>

## DevOps
<div style="display: inline-block; font-size: 22px;">
    <img src="images/kubernetes.svg" alt="Kubernetes" width="25" height="25"> Kubernetes |
    <img src="images/aks.png" alt="Azure Kubernetes Service" width="25" height="25"> Azure Kubernetes Service (AKS) |
    <img src="images/helm.png" alt="Helm" width="25" height="25" style="border-radius: 50%;"> Helm |
    <img src="images/terraform.png" alt="Terraform" width="25" height="25"> Terraform |
    <img src="images/docker.png" alt="Docker" width="25" height="16"> Docker |
    <img src="images/AzureCloud.png" alt="Azure Cloud" width="25" height="25"> Azure Cloud |
    <img src="images/porkbun.png" alt="Porkbun" width="25" height="25"> Porkbun DNS Provider |
    <img src="images/nginx.svg" alt="Nginx" width="25" height="25"> Nginx Load Balancer |
    <img src="images/CertManager.png" alt="CertManager" width="25" height="25"> CertManager |
    <img src="images/lets-encrypt.png" alt="Let's Encrypt" width="25" height="25"> Let's Encrypt |
    🔏 TLS Cluster Issuer |
    🚀 CI/CD |
    <img src="images/GitHub-Actions.png" alt="GitHub Actions" width="25" height="25"> GitHub Actions |
    <img src="images/hpa.png" alt="Horizontal Pod Autoscaling" width="25" height="25"> Horizontal Pod Autoscaling (HPA) |
    <img src="images/elk.svg" alt="ELK Stack" width="25" height="25"> ELK Stack 
    (<img src="images/Elasticsearch.png" alt="Elasticsearch" width="25" height="25"> Elasticsearch, 
    <img src="images/Logstash.png" alt="Logstash" width="25" height="25"> Logstash, 
    <img src="images/kibana.png" alt="Kibana" width="25" height="25"> Kibana, 
    <img src="images/Filebeat.png" alt="Filebeat" width="25" height="25"> Filebeat)
</div>

## Testing
<div style="display: inline-block; font-size: 22px;">
    <img src="images/jest.png" alt="Jest" width="25" height="25"> Jest |
    <img src="images/K6.svg" alt="K6" width="25" height="25"> K6 |
    <img src="images/puppeteer.png" alt="Puppeteer" width="25" height="25"> PuppeteerJS
</div>

<!-- Divider -->
---

# Performance Testing

The application underwent stress testing using K6 to simulate real-world user interactions. The test was conducted in a cloud environment, allowing for scalable and realistic load conditions. Below are the key findings from the performance tests:

- **Stress Test Setup**:
  - The test simulated common user actions such as login requests, data fetching, and page navigation.
  - The test was conducted by incrementally increasing the number of concurrent users, starting from 1,000.

- **Test Results**:
  - A **peak test** was conducted over the course of one hour, gradually pushing the system to its limit.
  - At **85,000 concurrent users**, response times began to slow down, but no critical issues were observed.

![peak.png](images/peak.webp)
  - At **90,000 concurrent users**, the application was pushed to its limit, leading to severe performance degradation, including slower response times, increased error rates, and eventual system failure.

![fail.png](images/failure.png)

# Micro-services architecture

![image.png](images/image%2011.png)
For more detailed explanations, see [here](docs/microservice.md).

# Deployment Architecture

![image 1](https://github.com/user-attachments/assets/a6c93c1e-7827-4721-b713-885645d54207)
For more detailed explanations, see [here](docs/deployment.md).

# CI/CD pipeline

![image.png](images/image%202.png)
For more detailed explanations, see [here](docs/ci_cd.md).


# Traditional HTTP Request Workflow (CRUD Operations)

![image.png](images/image%203.png)
For more detailed explanations, see [here](docs/http_workflow.md).

# Downstream Task Workflow (Time-Consuming Operations)

![image.png](images/image%204.png)
For more detailed explanations, see [here](docs/downstream_workflow.md).

# PowerPoint generator

![image.png](images/image%205.png)
For more detailed explanations, see [here](docs/powerpoint.md).

# Intelligent Educational Question Answering Assistant (High-level Architecture)

![image.png](images/image%206.png)

This architecture is designed to build a **Intelligent Educational Question Answering Assistant** for the education domain, using a **Retrieval-Augmented Generation (RAG)** approach. The design integrates several advanced techniques, including **HyDE**, **CRAG**, and **Fusion RAG**, to enhance the system's ability to handle complex queries and provide accurate, domain-specific responses. Below is an explanation of the workflow and components involved in this architecture:

For more detailed explanations, see [here](docs/qa_high.md).

# Intelligent Educational Question Answering Assistant (Low-level Architecture)

![image.png](images/image%207.png)

The low-level architecture described focuses on an **ETL (Extract, Transform, Load)** process, **Real-time Data Serving**, and a **RAG (Retrieval-Augmented Generation) Pipeline**. The system is designed to gather and process data from educational websites, ingest user-provided documents (such as PDFs), and integrate these inputs into a retrieval-augmented response system using advanced models like Large Language Models (LLMs) and query expansion techniques. Below is a breakdown of the major components and how they work together.

For more detailed explanations, see [here](docs/qa_low.md).


# Game (websocket)

![image.png](images/image%209.png)

This architecture represents a scalable system designed to handle multiplayer game sessions involving teachers and students, where real-time communication is facilitated through **WebSockets**. The system is distributed across multiple servers, with **Redis** acting as the central communication bridge to synchronize sessions across different nodes. Below is a detailed breakdown of how the architecture works.

For more detailed explanations, see [here](docs/game.md).

# Game pub/sub for auto-scaling

![image.png](images/image%2010.png)

This architecture represents a scalable system designed to handle multiplayer game sessions involving teachers and students, where real-time communication is facilitated through **WebSockets**. The system is distributed across multiple servers, with **Redis** acting as the central communication bridge to synchronize sessions across different nodes and using **Pub/Sub** pattern for auto-scaling. Below is a detailed breakdown of how the architecture works.

For more detailed explanations, see [here](docs/game_pub.md).

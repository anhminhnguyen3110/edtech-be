# Intelligent Educational Question Answering Assistant (Low-level Architecture)

![image.png](../images/image%207.png)

The low-level architecture described focuses on an **ETL (Extract, Transform, Load)** process, **Real-time Data Serving**, and a **RAG (Retrieval-Augmented Generation) Pipeline**. The system is designed to gather and process data from educational websites, ingest user-provided documents (such as PDFs), and integrate these inputs into a retrieval-augmented response system using advanced models like Large Language Models (LLMs) and query expansion techniques. Below is a breakdown of the major components and how they work together.

### 1. ETL + Feature Engineering for Real-time Data Serving

![image.png](../images/image%208.png)

- **Rotating Proxy Server**: We start by collecting educational data from various external websites. The **Rotating Proxy Server** forwards requests to multiple websites from a list of **educational resources**. This rotation ensures that we can access data from a wide variety of sources without being rate-limited or blocked by web servers.
- **Real-time Data Extractor**: The **Real-time Data Extractor** uses the list of websites to continuously fetch the latest content from the web. The extracted data is then published to a **Kafka** queue, allowing other components to consume it in real-time. This pipeline ensures that we always have up-to-date content for educational queries.
- **Apache Airflow**: Airflow coordinates this entire workflow, triggering tasks such as fetching data from educational websites and processing it. The data collected through the **Real-time Data Extractor** is further processed by the **Feature Engineering** module, which adds metadata, tags, and other relevant information to enrich the data.
- **Feature Engineering and Data Lake**: The processed data is saved into a **Datalake**, ensuring that it is stored for future retrieval. The **Feature Engineering** module continuously improves the quality of the data by adding semantic and structural information that can be leveraged during the search process.

### 2. Document Ingestion Pipeline

- **File System Main Area**: In addition to real-time data fetching, the system allows users (e.g., teachers) to upload their own documents, such as PDFs. The uploaded documents are stored in the **File System Main Area**, ready to be processed.
- **PDF Converter**: The uploaded PDFs are passed through a **PDF Converter** that extracts the text from each page. This step transforms the documents into a format that can be further processed and indexed by the system.
- **Text Splitter**: After the PDF content is extracted, it is passed through a **Text Splitter**. This component divides the document into chunks, which are smaller units of data that can be easily processed by the system. Each chunk is indexed and embedded into the **VectorDB**, making the document searchable.
- **Vector Database (VectorDB)**: The **VectorDB** stores these document embeddings, enabling efficient similarity-based search operations. Each chunk of the document is indexed with corresponding vector embeddings, which allows the system to quickly locate and retrieve relevant chunks during query processing.

### 3. RAG (Retrieval-Augmented Generation) Pipeline

- **Ambiguous Query Handler**: When a user submits a query, it is first handled by the **Ambiguous Query Handler**. This component clarifies the query’s intent and generates an initial understanding, which is particularly useful in education, where queries may be open-ended or complex.
- **Query Expansion and HyDE**: We use **Query Expansion** techniques, such as **Stepback Prompting** and **HyDE** (Hypothetical Document Embeddings), to enhance the query. These techniques enrich the original query by generating multiple variations that broaden its scope, allowing the system to cover all potential aspects of the user's request.
- **Search and Retrieval**:
    - The expanded query is passed to the **Search** module, where it interacts with two primary retrievers: a **Dense Retriever (Ada-002)** and a **Sparse Retriever (BM25)**. These retrievers search both semantic and keyword-based representations of the documents stored in the **VectorDB**.
    - The dense retriever works with vector embeddings to find semantically related documents, while the sparse retriever uses traditional search methods like keyword matching to return highly relevant results. Both results are aggregated for the next step.
- **Reciprocal Rank Fusion Algorithm**: After gathering the results, we apply the **Reciprocal Rank Fusion Algorithm**, which aggregates and ranks the retrieved documents. This process helps prioritize the most relevant chunks of data based on the initial query and its sub-queries.
- **LLM Integration**: The **Large Language Model (LLM)** then takes over. Using the retrieved and ranked documents, the LLM generates a final response. The context from the query and the search results is ingested, allowing the LLM to craft a detailed, well-informed response tailored to the educational domain.

### 4. Data and Result Handling

- **Ingest Context**: After retrieval, the context from the retrieved chunks is ingested into the **LLM** to help it understand the broader context of the query and generate an accurate response. The results from both retrieval and generation are combined and further enriched with additional context to provide the most accurate answer possible.
- **Generate Answer**: Finally, the system returns the generated response to the user. The combination of query expansion, dense and sparse retrieval, and LLM ensures that the answer is not only relevant but also exhaustive and highly accurate, tailored to the education-specific query.
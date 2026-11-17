# 🐦 Tweeter

**Tweeter** is a full-stack, cloud-native social networking web application modeled after X (formerly Twitter). Built as a TypeScript monorepo, it demonstrates enterprise software engineering patterns—including **Model-View-Presenter (MVP)** on the frontend, a **shared domain/DTO package**, and an **event-driven serverless backend** powered by AWS Lambda, DynamoDB, API Gateway, and SQS.

---

## ✨ Key Features

* **User Authentication & Profiles:** Register new accounts with custom profile avatars (stored in Amazon S3), log in with token-based authentication, and view user profiles with live follower/followee counts.
* **Status Posting & Rich Text Parsing:** Publish status updates that automatically parse `@mentions` and external URLs into interactive, clickable segments.
* **Social Graph (Follow / Unfollow):** Follow or unfollow other users and browse paginated lists of a user's followers and followees.
* **Infinite-Scrolling Feed & Story:**
  * **Story:** Chronological timeline of posts authored by a specific user.
  * **Feed:** Aggregated timeline of posts from all users that the logged-in user follows.
* **Asynchronous Feed Fan-Out:** Posting a status triggers an SQS queue pipeline (`PostsQueueLambda` $\rightarrow$ `UpdateFeedLambda`) that distributes posts to followers' feeds asynchronously without blocking the user interface.

---

## 🏗️ System Architecture

The repository is organized as a multi-package **TypeScript Monorepo** (`tweeter-web`, `tweeter-server`, and `tweeter-shared`) to enforce clean separation of concerns and strict type safety across the network boundary:

```
┌───────────────────────────┐       HTTP / JSON       ┌──────────────────────────────────┐
│        tweeter-web        │ ──────────────────────► │          tweeter-server          │
│  React + TypeScript (MVP) │ ◄────────────────────── │  AWS API Gateway + Lambda (SAM)  │
└─────────────┬─────────────┘                         └────────┬────────────────┬────────┘
              │                                                │                │
              ▼                                                ▼                ▼
┌───────────────────────────┐                         ┌────────────────┐ ┌───────────────┐
│      tweeter-shared       │                         │    Amazon SQS  │ │   DynamoDB    │
│  Domain Models, DTOs &    │                         │ (Async Fan-Out)│ │  & Amazon S3  │
│  Network Request/Response │                         └────────────────┘ └───────────────┘
└───────────────────────────┘
```

### Architectural Highlights
* **Model-View-Presenter (MVP) Frontend:** React components act as passive Views that delegate all UI logic, state transitions, and pagination to testable TypeScript `Presenter` classes (`FeedPresenter`, `StoryPresenter`, `UserInfoPresenter`, `PostStatusPresenter`, etc.).
* **Data Access Object (DAO) Pattern:** Backend business services (`UserService`, `FollowService`, `StatusService`, `AuthorizationService`) interact with storage exclusively through DAO interfaces (`DAOFactory`), decoupling application logic from AWS DynamoDB and S3 implementations.
* **Shared Contract Library (`tweeter-shared`):** Centralizes domain entities (`User`, `Status`, `Follow`, `AuthToken`, `PostSegment`) and Data Transfer Objects (DTOs) so the client and server share identical data contracts.

---

## 🛠️ Tech Stack

* **Frontend (`tweeter-web`):** React, TypeScript, Vite, Bootstrap / CSS, Jest & React Testing Library
* **Shared Package (`tweeter-shared`):** TypeScript, Vite
* **Backend (`tweeter-server`):** Node.js, TypeScript, AWS SAM (`template.yaml`), AWS Lambda, API Gateway, Amazon SQS, Amazon DynamoDB, Amazon S3

---

## 📁 Repository Structure

```
CS340-Tweeter-master/
├── package.json                  # Root monorepo workspace configuration
├── tweeter-shared/               # Shared domain models, DTOs, and network contracts
│   └── src/
│       ├── model/
│       │   ├── domain/           # Core entities (User, Status, Follow, AuthToken, PostSegment)
│       │   ├── dto/              # Serialization Data Transfer Objects
│       │   └── net/              # Typed HTTP Request & Response payloads
│       └── util/                 # Shared utilities & fake data generators
├── tweeter-web/                  # React + MVP frontend application
│   ├── src/
│   │   ├── components/           # Passive React UI views (Navbar, Auth, MainLayout, StatusItem, UserInfo)
│   │   ├── presenter/            # MVP Presenters handling UI logic & infinite-scroll pagination
│   │   ├── model.service/        # Frontend service layer
│   │   └── network/              # ServerFacade & ClientCommunicator for REST API calls
│   └── test/                     # Unit & integration tests (Components, Presenters, Network, Services)
└── tweeter-server/               # AWS Serverless backend
    ├── template.yaml             # AWS SAM infrastructure-as-code definition
    ├── samconfig.toml            # SAM deployment configuration
    └── src/
        ├── lambda/               # AWS Lambda handlers (user, follow, status, SQS workers)
        ├── model/service/        # Backend business logic & authorization checks
        ├── dataAccess/           # DAO interfaces, DAOFactory, DynamoDB & S3 implementations
        ├── Error/                # Custom HTTP error classes (BadRequest, ServerError)
        └── scripts/              # Batch load scripts for seeding DynamoDB tables
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18+ recommended) and **npm**
* **AWS CLI** and **AWS SAM CLI** (if deploying or running the serverless backend on AWS)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd CS340-Tweeter-master
```

### 3. Build the Shared Library (`tweeter-shared`)
Because both the frontend and backend depend on `tweeter-shared`, install its dependencies and compile it first:
```bash
cd tweeter-shared
npm install
npm run build
```

### 4. Set Up & Deploy the Backend (`tweeter-server`)
```bash
cd ../tweeter-server
npm install
npm run build
```
To deploy the Lambda functions, API Gateway endpoints, DynamoDB tables, and SQS queues to your AWS account using AWS SAM:
```bash
sam build
sam deploy --guided
```
*(Optional)* To populate your DynamoDB tables with sample users and follow relationships for load testing:
```bash
npx ts-node src/scripts/BatchLoadScript.ts
```

### 5. Configure & Run the Frontend (`tweeter-web`)
```bash
cd ../tweeter-web
npm install
```
Update the API Gateway base URL in `tweeter-web/src/network/ClientCommunicator.ts` to point to your deployed AWS API Gateway endpoint, then start the local development server:
```bash
npm run dev
```

---

## 🧪 Running Tests

The frontend includes unit and integration tests covering Presenters, React components, Services, and `ServerFacade`:

```bash
cd tweeter-web
npm test
```

---

## 📄 License

This project was built for **CS 340 (Software Design)**.
# Policy Management System

This project was developed as part of a Node.jsc.

The application reads the provided insurance policy CSV/XLSX file, stores the data in MongoDB using separate collections, provides policy search and aggregation APIs, monitors Node.js CPU usage, and supports scheduled messages.

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* Worker Threads
* Multer
* XLSX
* node-cron
* PM2


## MongoDB Collections

The assessment required the data to be stored in separate collections.

### Agent

Stores agent information from the `agent` and `agency_id` fields.

### User

Stores user/customer information such as:

* first name
* DOB
* email
* phone
* address
* city
* state
* ZIP
* user type

### Account

Stores account name/type and its related user.

### LOB

Stores the policy category from `category_name`.

### Carrier

Stores the insurance company from `company_name`.

### Policy

Stores policy-specific information such as:

* policy number
* policy mode
* producer
* premium
* policy type
* start date
* end date
* CSR

It also contains references to the related:

* Agent
* User
* Account
* LOB
* Carrier

### ScheduledMessage

Stores scheduled messages with their scheduled time and processing status.

## Setup

Clone the repository:

```bash
git clone <your-github-repository-url>
cd policy-management-system
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/policy_management

CPU_THRESHOLD=70
CPU_CHECK_INTERVAL=5000

TIMEZONE=Asia/Kolkata
```

## Run Locally

Development:

```bash
npm run dev
```

PM2:

```bash
npm run pm2:start
```

View PM2 logs:

```bash
npm run pm2:logs
```

Restart:

```bash
npm run pm2:restart
```

Stop:

```bash
npm run pm2:stop
```

## APIs

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### Upload CSV/XLSX

```http
POST /api/upload
```

Use `multipart/form-data` with:

```text
file = <CSV/XLSX file>
```

The upload flow is:

```text
Upload
  ↓
Multer
  ↓
Worker Thread
  ↓
Parse and transform data
  ↓
MongoDB
```

The worker is used for CSV/XLSX parsing so that the main Node.js thread is not responsible for the CPU-intensive parsing work.

Maximum upload size is 20 MB.

### Search Policy by Username

```http
GET /api/policies/search?username=Lura
```

This first finds the user and then retrieves the policies associated with that user.

The response also contains related agent, account, LOB and carrier information.

### Policy Aggregation

```http
GET /api/policies/aggregate/users
```

This uses MongoDB aggregation to group policies by user.

The aggregation uses MongoDB stages such as `$lookup`, `$unwind`, `$group` and `$project`.

### Schedule Message

```http
POST /api/messages/schedule
```

Request:

```json
{
  "message": "Assessment reminder",
  "date": "2026-08-23",
  "time": "10:30"
}
```

The scheduled message is first stored in MongoDB with `pending` status.

`node-cron` checks for due messages and processes them.

The basic flow is:

```text
pending
   ↓
processing
   ↓
completed
```

If processing fails, the job is marked as `failed`.

The job is stored in MongoDB instead of using only an in-memory timer, so the scheduled record is still available if the Node.js process is restarted.

## CPU Monitoring

The application checks Node.js process CPU usage periodically.

The threshold is configured using:

```env
CPU_THRESHOLD=70
```

The monitoring interval is:

```env
CPU_CHECK_INTERVAL=5000
```

CPU usage is calculated using `process.cpuUsage()`.

When CPU usage stays above the configured threshold for the required checks, PM2 is used to restart the application.

A cooldown is included to avoid continuous restart loops.

## Duplicate Handling

The import process uses MongoDB upserts and unique indexes for the entities that should not be duplicated.

For policies, `policyNumber` is treated as the unique identifier.

This allows the same file to be uploaded again without creating a second policy document for the same policy number.

## Error Handling

The application has centralized error handling for common cases such as:

* Invalid request data
* Unsupported upload files
* File size limits
* MongoDB validation errors
* Duplicate key errors
* Invalid IDs
* Worker errors
* Scheduler errors

## Author

Rajendra Bhojak

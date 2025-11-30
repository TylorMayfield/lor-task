# LOR Task - Intelligent Task Management System

A Todoist/Any.do clone with advanced NLP capabilities for task creation, automated tagging, smart scheduling, and recurring task tracking.

## Features

- **NLP Task Creation**: Parse natural language input to create structured tasks
- **Automated Tagging**: AI-powered automatic tag assignment
- **Smart Scheduling**: Intelligent task scheduling based on priority, deadlines, and patterns
- **Daily Calendar**: Build daily task calendars from task repositories
- **Recurring Tasks**: Track repeated tasks over time (e.g., heating bills, monthly reviews)
- **Machine Learning**: KNN-based pattern learning that improves over time
- **User Customization**: Fully customizable preferences and settings
- **Webhook Integration**: Create tasks via webhooks and receive notifications on task events
- **Shared Boards**: Collaborative boards with cross-user permissions (Owner, Admin, Member, Viewer)
- **Swipe Interface**: Mobile-friendly swipeable task cards for quick task management
- **Cadence Scheduling**: Advanced recurring patterns like "first monday", "last friday", "every 2nd tuesday"
- **Category Hierarchy**: Nested category system for organizing tasks
- **Inbox**: Backlog for unsorted tasks that need organization
- **E2E Testing**: Comprehensive Playwright tests for all functionality

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **NLP**: Natural language processing for task parsing and tagging
- **ML**: KNN (K-Nearest Neighbors) algorithm for pattern learning
- **Styling**: Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string and NextAuth secret

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Running Tests

```bash
# Run all Playwright E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run KNN/ML specific tests
npm run test:knn
```

## Environment Variables

Create a `.env.local` file with:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## Project Structure

```
lor-task/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── auth/       # NextAuth routes
│   │   ├── tasks/      # Task CRUD and calendar
│   │   ├── boards/      # Board management
│   │   ├── categories/ # Category hierarchy
│   │   ├── webhooks/   # Webhook management
│   │   └── preferences/# User preferences
│   ├── (auth)/         # Auth pages
│   └── page.tsx        # Main dashboard
├── lib/                # Utility functions
│   ├── models/         # Mongoose models (User, Task, Tag, Board, Category, etc.)
│   ├── nlp/            # NLP services for task parsing
│   ├── ml/             # KNN-based pattern learning
│   ├── scheduling/     # Smart scheduling algorithms
│   ├── permissions/    # Board permission system
│   ├── webhooks/       # Webhook service
│   └── auth.ts         # NextAuth configuration
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard view
│   ├── TaskInput.tsx   # NLP task input
│   ├── TaskList.tsx    # Task display
│   ├── SwipeableTaskView.tsx # Swipe interface
│   ├── CalendarView.tsx# Daily calendar
│   ├── InboxView.tsx   # Inbox for unsorted tasks
│   ├── Boards.tsx      # Board management
│   ├── CategoryTree.tsx# Category hierarchy
│   ├── CadenceScheduler.tsx # Cadence scheduling UI
│   └── Settings.tsx    # User preferences
├── tests/              # Playwright E2E tests
│   ├── __unit__/       # Unit tests for ML logic
│   └── *.spec.ts       # E2E test suites
└── types/              # TypeScript types
```

## Key Features Explained

### NLP Task Creation
The system uses natural language processing to parse user input and extract:
- Task title and description
- Priority level (urgent, high, medium, low)
- Due dates and scheduled dates
- Recurring patterns (daily, weekly, monthly, yearly)
- Automatic tag assignment

### Machine Learning (KNN Pattern Learning)
The system uses K-Nearest Neighbors algorithm to:
- **Learn from past tasks**: Analyzes completed tasks to find patterns
- **Predict tags**: Suggests tags based on similar tasks
- **Predict scheduling**: Recommends optimal dates based on historical patterns
- **Predict priority**: Suggests priority based on similar tasks
- **Recurring pattern detection**: Identifies patterns in recurring tasks (e.g., heating bills)

**Testing**: Comprehensive unit and E2E tests ensure the KNN system works correctly:
- Unit tests for similarity calculation and feature extraction
- Integration tests for tag, schedule, and priority prediction
- Tests for recurring pattern learning
- Edge case handling tests

### Smart Scheduling
Tasks are automatically scheduled based on:
- Priority level
- Due dates
- User work hours and preferred days
- Historical patterns (via ML)

### User Customization
Users can customize:
- Default priority
- Work hours
- Preferred days
- Auto-tagging on/off
- Smart scheduling on/off
- ML learning on/off
- Notification preferences

### Webhook Integration

#### Outgoing Webhooks
Configure webhooks to receive notifications when:
- Tasks are created (`task.created`)
- Tasks are updated (`task.updated`)
- Tasks are completed (`task.completed`)
- Task status changes (`task.status_changed`)
- Tasks are deleted (`task.deleted`)

Webhook payloads include:
- Event type
- Timestamp
- Task data
- HMAC signature (if secret is configured)

#### Incoming Webhooks
Create tasks via webhook by sending a POST request to `/api/webhooks/incoming`:

```json
{
  "userId": "user-id",
  "task": {
    "title": "Task title",
    "description": "Optional description",
    "priority": "high",
    "tags": ["tag1", "tag2"],
    "dueDate": "2024-01-15T00:00:00Z"
  }
}
```

The system will automatically:
- Parse the task using NLP
- Apply smart scheduling
- Auto-tag the task
- Fire outgoing webhooks for the creation event

### Shared Boards

Create collaborative boards that span across multiple users with granular permissions:

- **Owner**: Full control, can delete board and manage all members
- **Admin**: Can manage members and edit all tasks
- **Member**: Can create and edit tasks
- **Viewer**: Read-only access to board tasks

Features:
- Public boards (visible to all users)
- Private boards (invite-only)
- Task association with boards
- Permission-based access control
- Member management UI

Tasks can belong to either a personal workspace or a shared board, with permissions automatically enforced at the API level.

### Swipe Interface

A mobile-friendly swipe interface for quick task management:
- **Swipe Left**: Delete task
- **Swipe Right**: Complete/Uncomplete task
- **Card Stack**: View multiple tasks in a stack with smooth transitions
- Works on both touch devices and desktop (mouse drag)

Access via the "Swipe" tab in the dashboard.

### Cadence Scheduling

Advanced recurring task patterns beyond simple daily/weekly/monthly:

- **Natural Language Cadences**: 
  - "first monday" - First Monday of each month
  - "last friday" - Last Friday of each month
  - "second tuesday" - Second Tuesday of each month
  - "every 2nd monday" - Every 2 weeks on Monday

- **Preset Cadences**: Quick selection of common patterns
- **Flexible Scheduling**: Combines with traditional frequency-based scheduling

### Category Hierarchy

Organize tasks with nested categories:

- **Parent-Child Relationships**: Create subcategories under main categories
- **Visual Tree**: Expandable category tree in the UI
- **Color Coding**: Each category can have a custom color
- **Icons**: Optional icons for categories
- **Task Association**: Assign tasks to categories for better organization

### Inbox

A dedicated space for unsorted tasks:

- **Automatic Assignment**: Tasks without category, board, or schedule go to inbox
- **Quick Organization**: Schedule, categorize, or move to boards with one click
- **Visual Indicators**: Clear inbox badge on unsorted tasks
- **Empty State**: Helpful guidance when inbox is empty

## Testing

### E2E Tests (Playwright)
- Task creation and NLP parsing
- Calendar view
- Recurring tasks
- Shared boards
- Webhooks
- Swipe interface
- Cadence scheduling
- Category hierarchy
- **KNN Pattern Learning** (comprehensive test suite)
  - Tag prediction based on similar tasks
  - Schedule prediction from historical patterns
  - Priority prediction
  - Recurring pattern learning
  - Similarity calculation verification
  - API integration tests

### KNN/ML Testing Coverage

The KNN pattern learning system has extensive test coverage:

1. **Tag Prediction Tests** (`tests/knn-pattern-learning.spec.ts`)
   - Predicts tags based on similar completed tasks
   - Verifies tag suggestions appear in UI
   - Tests with various task types (finance, work, shopping)

2. **Schedule Prediction Tests**
   - Predicts optimal scheduling based on historical patterns
   - Tests day-of-week pattern recognition
   - Verifies weighted average date calculation

3. **Priority Prediction Tests**
   - Predicts priority based on similar task priorities
   - Tests with urgent, high, medium, low priorities

4. **Recurring Pattern Learning Tests**
   - Learns patterns from recurring task history
   - Detects frequency (daily, weekly, monthly)
   - Identifies preferred days of week/month

5. **Similarity Calculation Tests** (`tests/knn-similarity-calculation.spec.ts`)
   - Tests title similarity (Jaccard similarity)
   - Tests tag similarity
   - Tests temporal similarity (day of week/month)
   - Tests priority matching
   - Edge cases (empty titles, no tags, etc.)

6. **API Integration Tests** (`tests/knn-api-integration.spec.ts`)
   - Tests `/api/tasks/learn` endpoint
   - Verifies response structure
   - Tests with various input types
   - Error handling

Run specific test suites:
```bash
npm run test:knn        # KNN/ML tests only
npm run test:e2e       # All E2E tests
npm run test:e2e:ui    # Interactive test runner
```

**Note**: Unit tests for core ML logic are documented in `tests/__unit__/patternLearner.test.ts` but require Jest to run. The E2E tests provide comprehensive coverage of the KNN system in action.

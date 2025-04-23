# Backend

A simple Express.js backend server for managing lessons and quizzes with comprehensive user activity tracking.

## Features

- RESTful API endpoints for lessons and quizzes
- File-based data storage using JSON
- Comprehensive user activity tracking
- Static file serving

## Prerequisites

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Project Structure

```
.
├── data/
│   ├── lessons.json    # Lesson content storage
│   └── quiz.json       # Quiz questions storage
├── public/             # Static files
├── server.js          # Main server file
└── user_data.json     # User activity logs
```

## API Endpoints

### Lessons

- `GET /lessons` - Get all lessons
- `GET /lessons/:id` - Get a specific lesson by ID
- `POST /lessons` - Create or update a lesson

Example lesson object:
```json
{
  "id": 1,
  "title": "Intro to JS",
  "content": "JS is the soul of web development"
}
```

### Quiz Questions

- `GET /quiz` - Get all quiz questions
- `GET /quiz/:id` - Get a specific quiz question by ID
- `POST /quiz` - Create or update a quiz question

Example quiz question object:
```json
{
  "id": 1,
  "question": "Which keyword is used to define a constant in JS?",
  "options": ["var", "let", "const"],
  "answer": "const"
}
```

### User Activity Tracking

#### Logging User Activities

The `/log` endpoint is used to track various user activities. Each log entry includes:
- Timestamp (automatically added)
- User ID
- Activity type
- Page information
- Activity-specific details

##### Endpoints
- `POST /log` - Log user activity
- `GET /user/:userId/activities` - Get activity history for a specific user
- `GET /activities` - Get all activities (admin only)

##### Response Format
```json
{
  "status": "logged",
  "activity": {
    "timestamp": "2024-04-22T12:00:00.000Z",
    "type": "quiz_answer",
    "page": "quiz",
    "details": {
      "questionId": 1,
      "selectedAnswer": "const",
      "isCorrect": true
    }
  }
}
```

##### Activity Types and Required Fields

1. Quiz Answers:
```json
{
  "userId": "user123",          // Required: Unique user identifier
  "type": "quiz_answer",        // Required: Must be "quiz_answer"
  "page": "quiz",              // Required: Current page
  "questionId": 1,             // Required: ID of the question
  "selectedAnswer": "const",    // Required: User's selected answer
  "isCorrect": true            // Required: Whether the answer is correct
}
```

2. Lesson Views:
```json
{
  "userId": "user123",          // Required: Unique user identifier
  "type": "lesson_view",        // Required: Must be "lesson_view"
  "page": "lesson",            // Required: Current page
  "lessonId": 1,               // Required: ID of the lesson
  "timeSpent": 120             // Optional: Time spent on lesson in seconds
}
```

3. Page Entries:
```json
{
  "userId": "user123",          // Required: Unique user identifier
  "type": "page_enter",         // Required: Must be "page_enter"
  "page": "quiz",              // Required: Current page
  "pageName": "quiz"           // Required: Name of the page
}
```

##### Error Handling
The logging system handles various error cases:
- Invalid activity type
- Missing required fields
- Invalid data format
- File system errors

##### Data Storage
Activities are stored in two places:
1. Per-user history in the `users` object
2. Global activity list in the `activities` array

Example stored data structure:
```json
{
  "users": {
    "user123": {
      "userId": "user123",
      "activities": [
        {
          "timestamp": "2024-04-22T12:00:00.000Z",
          "type": "quiz_answer",
          "page": "quiz",
          "details": {
            "questionId": 1,
            "selectedAnswer": "const",
            "isCorrect": true
          }
        }
      ]
    }
  },
  "activities": [
    {
      "userId": "user123",
      "timestamp": "2024-04-22T12:00:00.000Z",
      "type": "quiz_answer",
      "page": "quiz",
      "details": {
        "questionId": 1,
        "selectedAnswer": "const",
        "isCorrect": true
      }
    }
  ]
}
```

### Other Endpoints

- `GET /` - Serve the main index.html
- `GET /learn/:id` - Get a specific lesson (legacy endpoint)
- `GET /quiz/:id` - Get a specific quiz question (legacy endpoint)
- `GET /result` - Serve the result page

## Running the Server

Start the server with:
```bash
node server.js
```

The server will run on `http://localhost:3000`

## Data Storage

The application uses JSON files for data storage:
- `data/lessons.json` - Stores lesson content
- `data/quiz.json` - Stores quiz questions
- `user_data.json` - Stores user activities in the following structure:
  ```json
  {
    "users": {
      "userId1": {
        "userId": "userId1",
        "activities": []
      }
    },
    "activities": []
  }
  ```

## Error Handling

- 404 responses for not found resources
- Automatic ID generation for new items
- Safe file reading and writing operations
- User activity validation
- Detailed error messages for invalid log entries

## Notes

- The server uses Express.js for routing and middleware
- Body-parser middleware is used for JSON request handling
- Static files are served from the public directory
- All data is persisted in JSON files
- User activities are tracked with timestamps and detailed information
- The logging system automatically validates and formats activity data 
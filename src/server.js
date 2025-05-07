const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Helper function to read JSON file
const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return [];
  }
};

// Helper function to write JSON file
const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize user_data.json if it doesn't exist
const initializeUserData = () => {
  const userDataPath = './user_data.json';
  if (!fs.existsSync(userDataPath)) {
    writeJsonFile(userDataPath, {
      users: {},
      activities: []
    });
  }
};

initializeUserData();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/learn/:id',(req, res) => {
  const id = parseInt(req.params.id);
  if (id == 1) res.sendFile(path.join(__dirname, 'public', 'learn_intro.html'))
  else if (id === 2) res.sendFile(path.join(__dirname, 'public', 'learn_story.html'))
  else if (id === 3) res.sendFile(path.join(__dirname, 'public', 'learn_advanced.html'))
  else if (id === 4) res.sendFile(path.join(__dirname, 'public', 'learn_symbolism.html'))
  else res.status(404).send('Learning section not found');
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz_card.html'));
});

app.get('/quiz_result', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz_result.html'));
});

app.get('/about', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'about.html')));

// GET /api/getRandomCard
app.get('/api/getRandomCard', (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'cards.json');
  let cards = [];
  try {
    cards = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to load card_info.json:', err);
    return res.status(500).json({ error: 'Cannot load card data' });
  }

  const randomIndex = Math.floor(Math.random() * cards.length);
  const card = cards[randomIndex];

  res.json(card);
});

// GET /api/getCard
app.get('/api/getCard/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dataPath = path.join(__dirname, 'data', 'cards.json');
  let cards;

  try {
    cards = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (err) {
    console.error('Failed to load card_info.json:', err);
    return res.status(500).json({ error: 'Cannot load card data' });
  }

  const card = cards.find(c => c.id === id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(card);
});

// GET /api/quiz
app.get('/api/quiz', (req, res) => {
  const quiz = readJsonFile(path.join(__dirname, 'data', 'quiz.json'));
  if (!quiz) return res.status(500).json({ error: 'Cannot load quiz data' });
  res.json(quiz);
});

app.get('/quiz/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const quiz = JSON.parse(fs.readFileSync('./data/quiz.json'));
  // Support nested structure (e.g., section1)
  let question = null;
  for (const section of quiz) {
    for (const key in section) {
      question = section[key].find(q => q.id === id);
      if (question) break;
    }
    if (question) break;
  }
  if (question) res.json(question);
  else res.status(404).send('Question not found');
});

app.post('/log', (req, res) => {
  const userAction = req.body;
  const timestamp = new Date().toISOString();
  
  // Read existing user data
  const userData = readJsonFile('./user_data.json');
  
  // Ensure user exists in the data structure
  if (!userData.users[userAction.userId]) {
    userData.users[userAction.userId] = {
      userId: userAction.userId,
      activities: []
    };
  }
  
  // Create activity record
  const activity = {
    timestamp,
    type: userAction.type,
    page: userAction.page,
    details: {}
  };
  
  // Store specific details based on activity type
  switch (userAction.type) {
    case 'quiz_answer':
      activity.details = {
        questionId: userAction.questionId,
        selectedAnswer: userAction.selectedAnswer,
        isCorrect: userAction.isCorrect
      };
      break;
    case 'lesson_view':
      activity.details = {
        lessonId: userAction.lessonId,
        timeSpent: userAction.timeSpent || 0
      };
      break;
    case 'page_enter':
      activity.details = {
        pageName: userAction.pageName
      };
      break;
  }
  
  // Add activity to user's history
  userData.users[userAction.userId].activities.push(activity);
  
  // Add to global activities list
  userData.activities.push({
    userId: userAction.userId,
    ...activity
  });
  
  // Save updated data
  writeJsonFile('./user_data.json', userData);
  
  res.json({ status: 'logged', activity });
});

app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

// Get all lessons
app.get('/lessons', (req, res) => {
  const lessons = readJsonFile('./data/lessons.json');
  res.json(lessons);
});

// Get a specific lesson
app.get('/lessons/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const lessons = readJsonFile('./data/lessons.json');
  const lesson = lessons.find(l => l.id === id);
  if (lesson) res.json(lesson);
  else res.status(404).send('Lesson not found');
});

// Create or update a lesson
app.post('/lessons', (req, res) => {
  const newLesson = req.body;
  const lessons = readJsonFile('./data/lessons.json');
  
  if (newLesson.id) {
    // Update existing lesson
    const index = lessons.findIndex(l => l.id === newLesson.id);
    if (index !== -1) {
      lessons[index] = newLesson;
    } else {
      lessons.push(newLesson);
    }
  } else {
    // Create new lesson
    newLesson.id = lessons.length > 0 ? Math.max(...lessons.map(l => l.id)) + 1 : 1;
    lessons.push(newLesson);
  }
  
  writeJsonFile('./data/lessons.json', lessons);
  res.json(newLesson);
});

// Get all quiz questions
app.get('/quiz', (req, res) => {
  const quiz = readJsonFile('./data/quiz.json');
  res.json(quiz);
});

// Get a specific quiz question
app.get('/quiz/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const quiz = readJsonFile('./data/quiz.json');
  const question = quiz.find(q => q.id === id);
  if (question) res.json(question);
  else res.status(404).send('Question not found');
});

// Create or update a quiz question
app.post('/quiz', (req, res) => {
  const newQuestion = req.body;
  const quiz = readJsonFile('./data/quiz.json');
  
  if (newQuestion.id) {
    // Update existing question
    const index = quiz.findIndex(q => q.id === newQuestion.id);
    if (index !== -1) {
      quiz[index] = newQuestion;
    } else {
      quiz.push(newQuestion);
    }
  } else {
    // Create new question
    newQuestion.id = quiz.length > 0 ? Math.max(...quiz.map(q => q.id)) + 1 : 1;
    quiz.push(newQuestion);
  }
  
  writeJsonFile('./data/quiz.json', quiz);
  res.json(newQuestion);
});

// Get user activity history
app.get('/user/:userId/activities', (req, res) => {
  const userId = req.params.userId;
  const userData = readJsonFile('./user_data.json');
  
  if (userData.users[userId]) {
    res.json(userData.users[userId].activities);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Get all activities (for admin purposes)
app.get('/activities', (req, res) => {
  const userData = readJsonFile('./user_data.json');
  res.json(userData.activities);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

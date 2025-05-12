const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const USER_DATA_FILE = path.join(__dirname, 'data', 'user_data.json');
const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return [];
  }
};
const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const initializeUserData = () => {
  if (!fs.existsSync(USER_DATA_FILE)) {
    fs.mkdirSync(path.dirname(USER_DATA_FILE), { recursive: true });
    writeJsonFile(USER_DATA_FILE, []);
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

// API implementations
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

app.post('/api/logUserActivity', (req, res) => {
  const { action, timestamp, userId } = req.body;
  if (!action || !timestamp || !userId) {
    return res.status(400).json({ error: 'Missing action, timestamp or userId' });
  }

  // 3) Use your helpers here:
  const events = readJsonFile(USER_DATA_FILE);
  events.push({ action, timestamp, userId });
  writeJsonFile(USER_DATA_FILE, events);

  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const express    = require('express');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = 3000;

// 中间件
app.use(bodyParser.json());
app.use(express.static('public'));

// 用户日志文件路径
const USER_LOG = path.join(__dirname, 'user_data.json');

//
// —— 安全的 JSON 读写 ——
//
function readJsonFileSafe(filePath) {
  if (!fs.existsSync(filePath)) {
    return { users: {}, activities: [] };
  }
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const obj = JSON.parse(txt);
    // 保底字段
    obj.users      = obj.users      || {};
    obj.activities = obj.activities || [];
    return obj;
  } catch (err) {
    console.error(`Error parsing JSON from ${filePath}:`, err);
    return { users: {}, activities: [] };
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 初始化 user_data.json
if (!fs.existsSync(USER_LOG)) {
  writeJsonFile(USER_LOG, { users: {}, activities: [] });
}

//
// —— HTML 页面路由 ——
//
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 学习页：1 = intro, 2 = drag-drop
app.get('/learn/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === 1) res.sendFile(path.join(__dirname, 'public', 'learn_intro.html'));
  else if (id === 2) res.sendFile(path.join(__dirname, 'public', 'learn_story.html'));
  else res.redirect('/');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Quiz 页面（单页应用，同一个 HTML）
app.get('/quiz',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz_card.html')));
app.get('/quiz/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz_card.html')));

// Quiz 结果页
app.get('/quiz_result', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quiz_result.html'));
});

// 最终结果页
app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

//
// —— 静态数据 API 路由 ——
//

// Utility: 读 data 下的 JSON
function readDataJson(name) {
  const p = path.join(__dirname, 'data', name);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// 随机一张牌
app.get('/api/getRandomCard', (req, res) => {
  let cards;
  try {
    cards = readDataJson('cards.json');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cannot load card data' });
  }
  const card = cards[Math.floor(Math.random() * cards.length)];
  res.json(card);
});

// 指定 ID 的牌
app.get('/api/getCard/:id', (req, res) => {
  let cards;
  try {
    cards = readDataJson('cards.json');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cannot load card data' });
  }
  const id = parseInt(req.params.id, 10);
  const card = cards.find(c => c.id === id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

// 全部 quiz 题目
app.get('/api/quiz', (req, res) => {
  let quiz;
  try {
    quiz = readDataJson('quiz.json');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cannot load quiz data' });
  }
  res.json(quiz);
});

// 单题查询
app.get('/api/quiz/:id', (req, res) => {
  let quiz;
  try {
    quiz = readDataJson('quiz.json');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Cannot load quiz data' });
  }
  const id = parseInt(req.params.id, 10);
  const question = quiz.find(q => q.id === id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

//
// —— 日志系统 ——
//
app.post('/log', (req, res) => {
  const entry     = req.body;
  const timestamp = new Date().toISOString();

  // 读现有日志
  const data = readJsonFileSafe(USER_LOG);

  // 确保 user 对象存在
  if (!data.users[entry.userId]) {
    data.users[entry.userId] = { userId: entry.userId, activities: [] };
  }

  // 构建 activity
  const activity = {
    timestamp,
    type: entry.type,
    page: entry.page || null,
    details: {}
  };

  switch (entry.type) {
    case 'page_enter':
      activity.details = {
        pageName: entry.page || entry.pageName || 'unknown'
      };
      break;
    case 'lesson_view':
      activity.details = {
        lessonId: entry.lessonId,
        timeSpent: entry.timeSpent || 0
      };
      break;
    case 'quiz_answer':
      activity.details = {
        questionId: entry.questionId,
        selectedAnswer: entry.selectedAnswer,
        isCorrect: entry.isCorrect
      };
      break;
    default:
      activity.details = entry.details || {};
  }

  // 写入 per-user & global
  data.users[entry.userId].activities.push(activity);
  data.activities.push({ userId: entry.userId, ...activity });

  // 保存
  writeJsonFile(USER_LOG, data);

  res.status(201).json({ status: 'logged', activity });
});

// 获取单个用户日志
app.get('/user/:userId/activities', (req, res) => {
  const userId = req.params.userId;
  const data   = readJsonFileSafe(USER_LOG);

  const user = data.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found', activities: [] });
  }
  res.json({ activities: user.activities });
});

// 获取所有日志（管理员用）
app.get('/activities', (req, res) => {
  const data = readJsonFileSafe(USER_LOG);
  res.json({ activities: data.activities });
});

// （可选）Lessons CRUD，如果你还需要
app.get('/lessons', (req, res) => {
  const lessons = readDataJson('lessons.json');
  res.json(lessons);
});
app.get('/lessons/:id', (req, res) => {
  const lessons = readDataJson('lessons.json');
  const id      = parseInt(req.params.id, 10);
  const lesson  = lessons.find(l => l.id === id);
  if (!lesson) return res.status(404).send('Lesson not found');
  res.json(lesson);
});
app.post('/lessons', (req, res) => {
  const newLesson = req.body;
  const lessons   = readDataJson('lessons.json');
  if (newLesson.id) {
    const idx = lessons.findIndex(l => l.id === newLesson.id);
    if (idx !== -1) lessons[idx] = newLesson;
    else lessons.push(newLesson);
  } else {
    newLesson.id = lessons.length ? Math.max(...lessons.map(l => l.id)) + 1 : 1;
    lessons.push(newLesson);
  }
  writeJsonFile(path.join(__dirname, 'data', 'lessons.json'), lessons);
  res.json(newLesson);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

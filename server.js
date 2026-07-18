const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SQUAD_FILE = path.join(__dirname, 'data', 'squad.json');
const QUESTIONS_FILE = path.join(__dirname, 'data', 'questions.json');
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboard.json');

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/players', (req, res) => {
  try {
    const players = readJSON(SQUAD_FILE);
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read squad data.' });
  }
});

app.post('/api/players', (req, res) => {
  try {
    const { name, role, position, number, nation, flag, image, bio, stats } = req.body;

    if (!name || !role || !number || !image) {
      return res.status(400).json({
        error: 'Missing required fields. "name", "role", "number", and "image" are required.'
      });
    }

    const players = readJSON(SQUAD_FILE);

    const newPlayer = {
      id: players.length ? Math.max(...players.map(p => p.id)) + 1 : 1,
      name,
      number: Number(number),
      role,
      position: position || role,
      nation: nation || '',
      flag: flag || '',
      image,
      bio: bio || '',
      stats: stats && typeof stats === 'object' ? stats : {}
    };

    players.push(newPlayer);
    writeJSON(SQUAD_FILE, players);

    res.status(201).json(newPlayer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add player.' });
  }
});

app.put('/api/players/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const players = readJSON(SQUAD_FILE);
    const index = players.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    players[index] = { ...players[index], ...req.body, id };
    writeJSON(SQUAD_FILE, players);

    res.json(players[index]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player.' });
  }
});

app.delete('/api/players/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const players = readJSON(SQUAD_FILE);
    const filtered = players.filter(p => p.id !== id);

    if (filtered.length === players.length) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    writeJSON(SQUAD_FILE, filtered);
    res.json({ message: 'Player removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player.' });
  }
});

app.get('/api/quiz', (req, res) => {
  try {
    const questions = readJSON(QUESTIONS_FILE);
    const safeQuestions = questions.map(({ correctAnswer, ...rest }) => rest);
    res.json(safeQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load quiz questions.' });
  }
});

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers } = req.body;
    const questions = readJSON(QUESTIONS_FILE);

    let score = 0;
    const results = questions.map(q => {
      const submitted = answers ? answers[q.id] : undefined;
      const correct = submitted === q.correctAnswer;
      if (correct) score++;
      return { id: q.id, correct, correctAnswer: q.correctAnswer };
    });

    res.json({ score, total: questions.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grade quiz.' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = readJSON(LEADERBOARD_FILE);
    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read leaderboard.' });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { username, score } = req.body;

    if (!username || typeof score !== 'number') {
      return res.status(400).json({
        error: '"username" (string) and "score" (number) are required.'
      });
    }

    let leaderboard = readJSON(LEADERBOARD_FILE);

    leaderboard.push({
      username: String(username).slice(0, 30),
      score,
      date: new Date().toISOString()
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    writeJSON(LEADERBOARD_FILE, leaderboard);

    res.status(201).json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update leaderboard.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Real Madrid site backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const projectsRouter = require('./routes/projects');
const compileRouter = require('./routes/compile');
const authRouter = require('./routes/auth');

app.use('/api/projects', projectsRouter);
app.use('/api/compile', compileRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', compiler: 'ready' });
});

app.listen(PORT, () => {
  console.log(`EdTech API running on http://localhost:${PORT}`);
});

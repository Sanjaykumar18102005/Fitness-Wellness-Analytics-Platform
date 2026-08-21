const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/api/members', (req, res) => {
  console.log('Received new member:', req.body);
  res.status(201).json({ message: 'Member created successfully', member: req.body });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

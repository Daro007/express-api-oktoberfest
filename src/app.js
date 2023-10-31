const express = require('express');
const dispenserRoutes = require('./routes/dispenserRoutes');

const app = express();

app.use('/api', dispenserRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});
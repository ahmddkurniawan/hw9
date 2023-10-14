const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const winston = require('winston');
const expressWinston = require('express-winston');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const app = express();
const port = 3000;

// Setup middleware
app.use(bodyParser.json());

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Use Winston for logging HTTP requests
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
}));

// Sample database of users
const users = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
];

// JWT Secret Key
const secretKey = 'your-secret-key';

// Generate JWT token
function generateToken(user) {
  const payload = { sub: user.id, username: user.username };
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
}

// Define your API endpoints
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ token });
});

app.get('/users', authenticate, (req, res) => {
  // Implement pagination logic here
  // Example: const page = req.query.page || 1;
  // Example: const limit = req.query.limit || 10;
  // Example: const usersOnPage = users.slice((page - 1) * limit, page * limit);

  // For simplicity, we're returning all users here.
  res.json(users);
});

// Swagger configuration
const swaggerDefinition = {
  info: {
    title: 'Sample API',
    version: '1.0.0',
    description: 'Sample API with Swagger documentation',
  },
  host: `localhost:${port}`,
  basePath: '/',
};

const options = {
  swaggerDefinition,
  apis: ['app.js'], // Replace 'app.js' with the actual file name where your API routes are defined.
};

const swaggerSpec = swaggerJSDoc(options);

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

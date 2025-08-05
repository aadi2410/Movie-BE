const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all movies with pagination
router.get('/', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const offset = (page - 1) * limit;

  // Get total count
  db.get('SELECT COUNT(*) as total FROM movies', (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // Get movies for current page
    db.all(
      'SELECT * FROM movies ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset],
      (err, movies) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          movies,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit
          }
        });
      }
    );
  });
});

// Get single movie
router.get('/:id', authenticateToken, (req, res) => {
  const movieId = req.params.id;

  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  });
});

// Create new movie
router.post('/', authenticateToken, upload.single('poster'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('publishingYear').isInt({ min: 1900, max: new Date().getFullYear() + 10 })
    .withMessage('Publishing year must be a valid year')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const { title, publishingYear } = req.body;
  const poster = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO movies (title, publishing_year, poster) VALUES (?, ?, ?)',
    [title, publishingYear, poster],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      // Return the created movie
      db.get('SELECT * FROM movies WHERE id = ?', [this.lastID], (err, movie) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json(movie);
      });
    }
  );
});

// Update movie
router.patch('/:id', authenticateToken, upload.single('poster'), [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('publishingYear').optional().isInt({ min: 1900, max: new Date().getFullYear() + 10 })
    .withMessage('Publishing year must be a valid year')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  const movieId = req.params.id;
  const { title, publishingYear } = req.body;
  const poster = req.file ? `/uploads/${req.file.filename}` : undefined;

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }

  if (publishingYear !== undefined) {
    updates.push('publishing_year = ?');
    values.push(publishingYear);
  }

  if (poster !== undefined) {
    updates.push('poster = ?');
    values.push(poster);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(movieId);

  const query = `UPDATE movies SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Return the updated movie
    db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      res.json(movie);
    });
  });
});

// Delete movie
router.delete('/:id', authenticateToken, (req, res) => {
  const movieId = req.params.id;

  db.run('DELETE FROM movies WHERE id = ?', [movieId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  });
});

module.exports = router;


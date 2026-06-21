const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Attach io instance (if any) to each request so controllers can emit
app.use((req, res, next) => {
	try {
		const io = req.app.get('io');
		if (io) req.io = io;
	} catch (e) {
		// ignore
	}
	next();
});

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
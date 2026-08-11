const fs = require('fs');
const path = require('path');

const models = {};

// Core Container Models
models.AcademicYear = require('./AcademicYear');
models.MonthlyReport = require('./MonthlyReport');

// Load all 52 sheet schemas from the ./schema subfolder
const schemaDir = path.join(__dirname, 'schema');

fs.readdirSync(schemaDir).forEach((file) => {
  if (file.endsWith('.js')) {
    const modelName = path.basename(file, '.js');
    models[modelName] = require(`./schema/${file}`);
  }
});

module.exports = models;

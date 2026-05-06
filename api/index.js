// Punto de entrada para Vercel Serverless Functions
const app = require('../dist/server').default;
module.exports = app;

const app = require('../dist/server.js').default;
const { initDB } = require('../dist/server.js');

module.exports = async (req, res) => {
  try {
    // Ensure database connection is established
    await initDB();

    // Handle the request using the Express app
    return app(req, res);
  } catch (err) {
    console.error('Vercel Entry Point Error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'حدث خطأ في الاتصال بقاعدة البيانات أو التهيئة',
      });
    }
  }
};

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON Body Parsing (high limit for image payloads if needed)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const storeFile = path.join(dataDir, 'store.json');

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = Date.now() + '_' + Math.floor(Math.random() * 10000) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Default Initial Data
const defaultData = {
  config: {
    phone: "0782 642 0404",
    whatsapp: "+964 782 642 0404",
    email: "jdukeoldid@gmail.com",
    instagram: "@os__mk",
    address_ar: "الأنبار – الفلوجة – النزيزة – السوق العصري",
    hero_slogan_ar: "لاستيراد الذهب والمجوهرات. ذهب أصيل، وزنٌ أمام عينك، وسعرٌ مربوط بسعر السوق يوم المعاملة."
  },
  items: []
};

// Helper to Read Store Data
function readStore() {
  try {
    if (fs.existsSync(storeFile)) {
      const content = fs.readFileSync(storeFile, 'utf8');
      const parsed = JSON.parse(content);
      return {
        config: parsed.config || defaultData.config,
        items: Array.isArray(parsed.items) ? parsed.items : defaultData.items
      };
    }
  } catch (err) {
    console.error("Error reading store:", err);
  }
  return defaultData;
}

// Helper to Write Store Data
function writeStore(data) {
  try {
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing store:", err);
    return false;
  }
}

// API Routes

// 1. Get All Site Data (Items + Config)
app.get('/api/data', (req, res) => {
  res.json(readStore());
});

// 2. Upload Image Files (Direct Multer Multipart Upload)
app.post('/api/upload', upload.array('photos', 20), (req, res) => {
  try {
    const store = readStore();
    const files = req.files || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const cat = req.body.cat || 'merchandise';
    const baseAr = (req.body.ar || '').trim();
    const baseEn = (req.body.en || '').trim();
    const tall = req.body.tall === 'true';

    const newItems = files.map((file, i) => {
      const fileUrl = '/uploads/' + file.filename;
      const suffix = files.length > 1 ? ` (${i + 1})` : '';
      const ar = baseAr ? `${baseAr}${suffix}` : (cat === 'shop' ? `صورة واجهة المحل${suffix}` : `مجوهرات ذهب${suffix}`);
      const en = baseEn ? `${baseEn}${suffix}` : (cat === 'shop' ? `Showroom Facade${suffix}` : `Gold Jewelry${suffix}`);

      return {
        src: fileUrl,
        ar: ar,
        en: en,
        cat: cat,
        tall: tall
      };
    });

    // Add new uploaded items to top of items list
    store.items = [...newItems, ...store.items];
    writeStore(store);

    res.json({ success: true, count: files.length, items: store.items });
  } catch (err) {
    console.error('Upload API error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload' });
  }
});

// 3. Save Entire Items Array (Reordering, Deleting, etc.)
app.post('/api/save-items', (req, res) => {
  try {
    const store = readStore();
    if (Array.isArray(req.body.items)) {
      store.items = req.body.items;
      writeStore(store);
      res.json({ success: true, items: store.items });
    } else {
      res.status(400).json({ error: 'Invalid items array' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Save Shop Contact & Info Config
app.post('/api/save-config', (req, res) => {
  try {
    const store = readStore();
    if (req.body.config && typeof req.body.config === 'object') {
      store.config = { ...store.config, ...req.body.config };
      writeStore(store);
      res.json({ success: true, config: store.config });
    } else {
      res.status(400).json({ error: 'Invalid config object' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Uploaded Media
app.use('/uploads', express.static(uploadsDir));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname)));

// Fallback for all other routes to index.html (eliminates 404 errors)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 Lumaa Gold Web Server is running on port ${PORT}`);
  console.log(`🌐 Local Website: http://localhost:${PORT}`);
  console.log(`⚙️ Admin Panel: http://localhost:${PORT}/lumaa-c1657249b574.html`);
  console.log(`================================================`);
});

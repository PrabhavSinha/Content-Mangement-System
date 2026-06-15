const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────────
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://parvchess786_db_user:YkBIb3JBYjDBNHGD@cluster0.366v3q9.mongodb.net/content_db?appName=Cluster0';

mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ Connected to MongoDB Successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─────────────────────────────────────────────
// Schemas & Models
// ─────────────────────────────────────────────
const VersionSchema = new mongoose.Schema({
    contentId:  Number,
    title:      String,
    body:       String,
    authorId:   Number,
    version:    { type: Number, default: 1 },
    status:     { type: String, default: 'published' },
    timestamp:  { type: Date, default: Date.now }
});

const EmbeddingSchema = new mongoose.Schema({
    contentId:  Number,
    title:      String,
    body:       String,
    embedding:  [Number],   // vector of floats
    timestamp:  { type: Date, default: Date.now }
});

const EditLogSchema = new mongoose.Schema({
    contentId:  Number,
    action:     String,     // 'draft_saved', 'published', 'searched'
    query:      String,     // for search logs
    timestamp:  { type: Date, default: Date.now }
});

const Version   = mongoose.model('Version',   VersionSchema,   'content_versions');
const Embedding = mongoose.model('Embedding', EmbeddingSchema, 'content_embeddings');
const EditLog   = mongoose.model('EditLog',   EditLogSchema,   'edit_logs');

// ─────────────────────────────────────────────
// HELPER: Generate a simple TF-based embedding
// Converts text into a 128-dimension float vector
// using term frequency of character n-grams
// (No external AI API needed — works offline)
// ─────────────────────────────────────────────
function generateEmbedding(text) {
    const vector = new Array(128).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const words = normalized.split(/\s+/);

    words.forEach(word => {
        for (let i = 0; i < word.length; i++) {
            const charCode = word.charCodeAt(i);
            const idx = (charCode * 31 + i * 7) % 128;
            vector[idx] += 1;
        }
    });

    // Normalize to unit vector (for cosine similarity)
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => parseFloat((v / magnitude).toFixed(6)));
}

// ─────────────────────────────────────────────
// HELPER: Cosine Similarity between two vectors
// ─────────────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot  += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// 1. Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        port: PORT
    });
});

// 2. Log a new content version + store embedding
app.post('/api/mongo/version', async (req, res) => {
    try {
        const { contentId, title, body, version, authorId, status } = req.body;

        // Save version log
        const newVersion = new Version({ contentId, title, body, authorId, version, status });
        await newVersion.save();

        // Generate and store embedding for vector search
        const text = `${title} ${body}`;
        const embedding = generateEmbedding(text);
        await Embedding.findOneAndUpdate(
            { contentId },
            { contentId, title, body, embedding, timestamp: new Date() },
            { upsert: true, new: true }
        );

        // Log the action
        await EditLog.create({ contentId, action: 'published' });

        res.status(201).json({
            message: "Version logged and embedding stored in MongoDB",
            contentId,
            version
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Fetch all versions for a specific content ID
app.get('/api/mongo/versions/:contentId', async (req, res) => {
    try {
        const versions = await Version.find({
            contentId: req.params.contentId
        }).sort({ version: -1 });
        res.json(versions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Vector Semantic Search using cosine similarity
app.post('/api/mongo/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || query.trim() === '') {
            return res.json([]);
        }

        // Log the search action
        await EditLog.create({ action: 'searched', query });

        // Generate embedding for the search query
        const queryEmbedding = generateEmbedding(query);

        // Fetch all stored embeddings
        const allEmbeddings = await Embedding.find({});

        if (allEmbeddings.length === 0) {
            // Fallback: regex search on versions collection
            const regexResults = await Version.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { body:  { $regex: query, $options: 'i' } }
                ]
            }).limit(10);
            return res.json(regexResults);
        }

        // Compute cosine similarity for each stored embedding
        const scored = allEmbeddings.map(doc => ({
            contentId:  doc.contentId,
            title:      doc.title,
            body:       doc.body,
            version:    1,
            score:      cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        // Sort by similarity score descending, return top 5
        const topResults = scored
            .filter(r => r.score > 0.1)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // If no vector matches, fallback to regex
        if (topResults.length === 0) {
            const regexResults = await Version.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { body:  { $regex: query, $options: 'i' } }
                ]
            }).limit(10);
            return res.json(regexResults);
        }

        res.json(topResults);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get all edit logs (for documentation/demo)
app.get('/api/mongo/logs', async (req, res) => {
    try {
        const logs = await EditLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get all stored embeddings (for documentation/demo)
app.get('/api/mongo/embeddings', async (req, res) => {
    try {
        const embeddings = await Embedding.find({}, { embedding: 0 }); // hide raw vectors
        res.json(embeddings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Node.js MongoDB service running on port ${PORT}`);
    console.log(`   Version API : http://localhost:${PORT}/api/mongo/version`);
    console.log(`   Search API  : http://localhost:${PORT}/api/mongo/search`);
    console.log(`   Health      : http://localhost:${PORT}/health`);
});
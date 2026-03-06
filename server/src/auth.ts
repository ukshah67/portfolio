import express from 'express';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import { User } from './models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// Middleware for authentication
export function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jsonwebtoken.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Initial setup route to create the very first admin if none exists (safeguard)
router.post('/setup-admin', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({ error: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminUser = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        res.status(201).json({ message: 'Default admin account created successfully' });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ error: 'Failed to setup admin' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jsonwebtoken.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role,
                portfolioOwnerName: user.portfolioOwnerName
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Token lasts 7 days
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                username: user.username,
                role: user.role,
                portfolioOwnerName: user.portfolioOwnerName
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Create User Route (Admin Only)
router.post('/register', authenticateToken, async (req, res) => {
    try {
        // We will secure this with authenticateToken middleware on the main index.ts mounting point later
        // But for double safety, check the user object we inject into req
        if (!(req as any).user || (req as any).user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        const { username, password, portfolioOwnerName } = req.body;

        if (!username || !password || !portfolioOwnerName) {
            return res.status(400).json({ error: 'Username, password, and portfolioOwnerName are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'user',
            portfolioOwnerName
        });

        await newUser.save();
        res.status(201).json({ message: `User ${username} created successfully for owner ${portfolioOwnerName}` });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Get All Users (Admin Only)
router.get('/users', authenticateToken, async (req, res) => {
    try {
        if (!(req as any).user || (req as any).user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        // Exclude the password hashes from the result!
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;

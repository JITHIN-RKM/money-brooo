import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// ----------------------------------------------------
// Authentication Middleware
// ----------------------------------------------------
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: { email, passwordHash, name }
        });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------------------------------------
// Transactions Routes
// ----------------------------------------------------
app.post('/api/v1/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, amount, category, description, transactionDate } = req.body;
        
        const transaction = await prisma.transaction.create({
            data: {
                type,
                amount: parseFloat(amount),
                category,
                description,
                transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
                userId: req.user.id
            }
        });

        res.status(201).json({ status: 'success', transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { transactionDate: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/v1/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, category, description, transactionDate } = req.body;

        const updated = await prisma.transaction.updateMany({
            where: { id, userId: req.user.id },
            data: {
                ...(type && { type }),
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(category && { category }),
                ...(description !== undefined && { description }),
                ...(transactionDate && { transactionDate: new Date(transactionDate) })
            }
        });

        if (updated.count === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ status: 'updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/v1/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await prisma.transaction.deleteMany({
            where: { id, userId: req.user.id }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ status: 'deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/transactions/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Simplified: gets all-time summary. You could filter by month.
        const transactions = await prisma.transaction.findMany({
            where: { userId }
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(t => {
            if (t.type === 'INCOME') totalIncome += t.amount;
            if (t.type === 'EXPENSE') totalExpenses += t.amount;
        });

        const spendLimit = totalIncome * 0.6;
        const savingsAllocation = totalIncome * 0.4;
        
        let status = 'OK';
        if (totalExpenses >= spendLimit) {
            status = 'OVER_LIMIT';
        } else if (totalExpenses >= (spendLimit * 0.83)) { // approx 50% of total income
            status = 'APPROACHING_LIMIT';
        }

        res.json({
            total_income: totalIncome,
            total_expenses: totalExpenses,
            spend_limit: spendLimit,
            savings_allocation: savingsAllocation,
            status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------------------------------------
// Ledger Routes
// ----------------------------------------------------
app.post('/api/v1/ledger', authenticateToken, async (req, res) => {
    try {
        const { contactName, contactPhone, type, amount, dueDate } = req.body;
        
        const entry = await prisma.ledgerEntry.create({
            data: {
                contactName,
                contactPhone,
                type,
                amount: parseFloat(amount),
                dueDate: dueDate ? new Date(dueDate) : null,
                userId: req.user.id
            }
        });

        res.status(201).json({ status: 'recorded', entry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/ledger/contacts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const entries = await prisma.ledgerEntry.findMany({
            where: { userId, status: 'PENDING' }
        });

        const balances = {};
        entries.forEach(e => {
            if (!balances[e.contactName]) balances[e.contactName] = 0;
            if (e.type === 'GAVE') {
                balances[e.contactName] += e.amount;
            } else {
                balances[e.contactName] -= e.amount;
            }
        });

        const result = Object.entries(balances).map(([contactName, netBalance]) => {
            let status = netBalance > 0 ? 'YOU_ARE_OWED' : (netBalance < 0 ? 'YOU_OWE' : 'SETTLED');
            return {
                contactName,
                netBalance: Math.abs(netBalance),
                status
            };
        }).filter(item => item.status !== 'SETTLED');

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rename contact across all entries
app.put('/api/v1/ledger/contacts/:name', authenticateToken, async (req, res) => {
    try {
        const originalName = req.params.name;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({ error: 'newName is required' });
        }

        await prisma.ledgerEntry.updateMany({
            where: { userId: req.user.id, contactName: originalName },
            data: { contactName: newName }
        });

        res.json({ status: 'contact_updated', originalName, newName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settle all debts for a contact
app.post('/api/v1/ledger/contacts/:name/settle', authenticateToken, async (req, res) => {
    try {
        const contactName = req.params.name;

        await prisma.ledgerEntry.updateMany({
            where: { userId: req.user.id, contactName, status: 'PENDING' },
            data: { status: 'SETTLED' }
        });

        res.json({ status: 'contact_settled', contactName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


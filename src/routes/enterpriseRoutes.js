const express = require('express');
const router = express.Router();
const Enterprise = require('../models/Enterprise');
const jwt = require('jsonwebtoken');

// Register Enterprise
router.post('/register', async (req, res) => {
    try {
        const { enterpriseName, phone, email, address, password } = req.body;

        // Check if enterprise already exists
        const enterpriseExists = await Enterprise.findOne({ email });
        if (enterpriseExists) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Create new enterprise
        const enterprise = await Enterprise.create({
            enterpriseName,
            phone,
            email,
            address,
            password
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: enterprise._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: "Enterprise registered successfully",
            enterprise: enterprise.toJSON(),
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login Enterprise
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find enterprise
        const enterprise = await Enterprise.findOne({ email });
        if (!enterprise) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check password
        const isMatch = await enterprise.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: enterprise._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: "Login successful",
            enterprise: enterprise.toJSON(),
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Enterprise Profile
router.get('/profile', async (req, res) => {
    try {
        const enterprise = await Enterprise.findById(req.enterprise.id);
        if (!enterprise) {
            return res.status(404).json({ error: "Enterprise not found" });
        }
        res.json(enterprise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Enterprise Profile
router.put('/profile', async (req, res) => {
    try {
        const { enterpriseName, phone, address } = req.body;
        const enterprise = await Enterprise.findById(req.enterprise.id);

        if (!enterprise) {
            return res.status(404).json({ error: "Enterprise not found" });
        }

        enterprise.enterpriseName = enterpriseName || enterprise.enterpriseName;
        enterprise.phone = phone || enterprise.phone;
        enterprise.address = address || enterprise.address;

        await enterprise.save();
        res.json({
            success: "Profile updated successfully",
            enterprise: enterprise.toJSON()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
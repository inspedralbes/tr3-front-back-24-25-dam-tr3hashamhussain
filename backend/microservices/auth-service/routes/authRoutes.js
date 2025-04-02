const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');

router.post('/register', [
    check('firstName', 'El nombre es requerido').not().isEmpty(),
    check('lastName', 'El apellido es requerido').not().isEmpty(),
    check('email', 'Por favor incluye un email válido').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { firstName, lastName, email, password } = req.body;
        
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no está configurado en las variables de entorno');
        }

        const user = await User.create({ firstName, lastName, email, password });
        
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        console.error('Error en registro:', err.message);
        res.status(500).send('Error en el servidor: ' + err.message);
    }
});

router.post('/login', [
    check('email', 'Por favor incluye un email válido').isEmail(),
    check('password', 'La contraseña es requerida').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    try {
        let user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '1h' }
        );

        res.json({ 
            token, 
            expiresIn: rememberMe ? 604800 : 3600,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
        
    } catch (err) {
        console.error('Error en el servidor durante login:', err);
        res.status(500).send('Error en el servidor');
    }
});

// Añade esto al final de authRoutes.js, antes de module.exports
router.get('/check', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token no proporcionado' });
  }

  try {
    // Verificar el token y obtener los datos del usuario
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.user.id);
    
    if (!user) {
      return res.status(401).json({ valid: false, message: 'Usuario no encontrado' });
    }
    
    res.json({ 
      valid: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error verificando token:', err);
    res.status(401).json({ valid: false, message: 'Token inválido o expirado' });
  }
});
module.exports = router;
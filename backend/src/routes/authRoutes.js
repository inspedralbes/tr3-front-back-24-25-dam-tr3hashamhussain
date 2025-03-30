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
        
        // Verifica que el JWT_SECRET esté configurado
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
    console.log('Solicitud de login recibida:', req.body); // Debug
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación:', errors.array()); // Debug
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email, password } = req.body;
  
    try {
      console.log('Buscando usuario:', email); // Debug
      let user = await User.findOne({ where: { email } });
  
      if (!user) {
        console.log('Usuario no encontrado'); // Debug
        return res.status(400).json({ msg: 'Credenciales inválidas' });
      }
  
      const isMatch = await user.validPassword(password);
      console.log('Contraseña válida?:', isMatch); // Debug
  
      if (!isMatch) {
        return res.status(400).json({ msg: 'Credenciales inválidas' });
      }
  
      const payload = {
        user: {
          id: user.id
        }
      };
  
      console.log('Generando token JWT...'); // Debug
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600 }
      );
      
      console.log('Login exitoso para usuario:', user.id); // Debug
      res.json({ token });
      
    } catch (err) {
      console.error('Error en el servidor durante login:', err); // Debug
      res.status(500).send('Error en el servidor');
    }
  });
module.exports = router;
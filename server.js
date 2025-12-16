const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Crear carpeta data si no existe
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Inicializar archivos de datos
const usuariosFile = './data/usuarios.json';
const empleadosFile = './data/empleados.json';
const ticketsFile = './data/tickets.json';

if (!fs.existsSync(usuariosFile)) {
    fs.writeFileSync(usuariosFile, JSON.stringify([
        { id: 1, nombre: 'Admin', usuario: 'admin', password: 'admin123', rol: 'admin' },
        { id: 2, nombre: 'Recursos Humanos', usuario: 'rrhh', password: 'rrhh123', rol: 'rrhh' }
    ], null, 2));
}

if (!fs.existsSync(empleadosFile)) {
    fs.writeFileSync(empleadosFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(ticketsFile)) {
    fs.writeFileSync(ticketsFile, JSON.stringify([], null, 2));
}

// ===== RUTAS DE AUTENTICACIÓN =====

app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    const usuarios = JSON.parse(fs.readFileSync(usuariosFile, 'utf8'));
    
    const user = usuarios.find(u => u.usuario === usuario && u.password === password);
    
    if (user) {
        res.json({ 
            success: true, 
            usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
        });
    } else {
        res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
});

// ===== RUTAS DE EMPLEADOS =====

// Obtener todos los empleados
app.get('/api/empleados', (req, res) => {
    const empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
    res.json(empleados);
});

// Obtener un empleado específico
app.get('/api/empleados/:id', (req, res) => {
    const empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
    const empleado = empleados.find(e => e.id === parseInt(req.params.id));
    
    if (empleado) {
        res.json(empleado);
    } else {
        res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
    }
});

// Crear nuevo empleado
app.post('/api/empleados', (req, res) => {
    const empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
    
    const nuevoEmpleado = {
        id: empleados.length > 0 ? Math.max(...empleados.map(e => e.id)) + 1 : 1,
        ...req.body,
        fechaRegistro: new Date().toISOString()
    };
    
    empleados.push(nuevoEmpleado);
    fs.writeFileSync(empleadosFile, JSON.stringify(empleados, null, 2));
    
    res.json({ success: true, data: nuevoEmpleado });
});

// Actualizar empleado
app.put('/api/empleados/:id', (req, res) => {
    let empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
    const index = empleados.findIndex(e => e.id === parseInt(req.params.id));
    
    if (index !== -1) {
        empleados[index] = { ...empleados[index], ...req.body };
        fs.writeFileSync(empleadosFile, JSON.stringify(empleados, null, 2));
        res.json({ success: true, data: empleados[index] });
    } else {
        res.status(404).json({ success: false, mensaje: 'Empleado no encontrado' });
    }
});

// Eliminar empleado
app.delete('/api/empleados/:id', (req, res) => {
    let empleados = JSON.parse(fs.readFileSync(empleadosFile, 'utf8'));
    empleados = empleados.filter(e => e.id !== parseInt(req.params.id));
    fs.writeFileSync(empleadosFile, JSON.stringify(empleados, null, 2));
    res.json({ success: true, mensaje: 'Empleado eliminado' });
});

// ===== RUTAS DE TICKETS =====

// Obtener tickets de un empleado
app.get('/api/tickets/:empleadoId', (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    const ticketsEmpleado = tickets.filter(t => t.empleadoId === parseInt(req.params.empleadoId));
    res.json(ticketsEmpleado);
});

// Crear nuevo ticket
app.post('/api/tickets', (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    
    const nuevoTicket = {
        id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
        ...req.body,
        fechaCreacion: new Date().toISOString()
    };
    
    tickets.push(nuevoTicket);
    fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
    
    res.json({ success: true, data: nuevoTicket });
});

// Obtener todos los tickets
app.get('/api/tickets', (req, res) => {
    const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    res.json(tickets);
});

// ===== INICIAR SERVIDOR =====

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Frontend disponible en http://localhost:${PORT}`);
});

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// Crear/abrir base de datos
const dbPath = path.join(__dirname, 'rrhh.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('✅ Base de datos SQLite inicializada:', dbPath);

// Crear tablas si no existen
const initDatabase = () => {
    // Tabla usuarios
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nombre TEXT NOT NULL,
            email TEXT,
            rol TEXT CHECK(rol IN ('admin', 'rrhh', 'manager', 'usuario')) DEFAULT 'usuario',
            activo BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla empleados
    db.exec(`
        CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE,
            telefono TEXT,
            fecha_nacimiento DATE,
            fecha_ingreso DATE,
            puesto TEXT,
            area TEXT,
            salario DECIMAL(10,2),
            activo BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla tickets
    db.exec(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL,
            tipo TEXT CHECK(tipo IN (
                'vacaciones', 'viaje', 'licencia_medica', 'licencia_maternidad', 
                'permiso', 'cambio_puesto', 'cambio_area', 'cambio_salario', 
                'desvinculacion', 'reincorporacion', 'cambio_personal', 
                'capacitacion', 'reconocimiento', 'amonestacion', 'suspension', 'otro'
            )) NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT CHECK(estado IN ('pendiente', 'aprobado', 'rechazado', 'en_proceso', 'completado', 'cancelado')) DEFAULT 'pendiente',
            fecha_evento DATE,
            fecha_desde DATE,
            fecha_hasta DATE,
            valor_anterior TEXT,
            valor_nuevo TEXT,
            datos_adicionales TEXT,
            actualiza_empleado BOOLEAN DEFAULT 0,
            creado_por INTEGER,
            aprobado_por INTEGER,
            aprobado_en DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id),
            FOREIGN KEY (aprobado_por) REFERENCES usuarios(id)
        )
    `);

    console.log('✅ Tablas creadas correctamente');
    
    // Insertar usuarios por defecto si no existen
    const checkUser = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    
    if (checkUser.count === 0) {
        console.log('📝 Creando usuarios por defecto...');
        const hashPassword = (password) => bcrypt.hashSync(password, 10);
        
        const insertUser = db.prepare(`
            INSERT INTO usuarios (username, password, nombre, email, rol) 
            VALUES (?, ?, ?, ?, ?)
        `);
        
        insertUser.run('admin', hashPassword('admin123'), 'Administrador', 'admin@empresa.com', 'admin');
        insertUser.run('rrhh', hashPassword('rrhh123'), 'Recursos Humanos', 'rrhh@empresa.com', 'rrhh');
        insertUser.run('manager', hashPassword('manager123'), 'Manager General', 'manager@empresa.com', 'manager');
        insertUser.run('usuario', hashPassword('user123'), 'Usuario Demo', 'usuario@empresa.com', 'usuario');
        
        console.log('✅ Usuarios creados');
        
        // Insertar empleados de ejemplo
        const insertEmpleado = db.prepare(`
            INSERT INTO empleados (nombre, apellido, email, telefono, fecha_nacimiento, fecha_ingreso, puesto, area, salario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertEmpleado.run('Juan', 'Pérez', 'juan.perez@empresa.com', '555-0101', '1985-03-15', '2020-01-15', 'Desarrollador Senior', 'TI', 75000);
        insertEmpleado.run('María', 'González', 'maria.gonzalez@empresa.com', '555-0102', '1990-07-22', '2021-03-10', 'Analista de RRHH', 'Recursos Humanos', 55000);
        insertEmpleado.run('Carlos', 'Rodríguez', 'carlos.rodriguez@empresa.com', '555-0103', '1988-11-05', '2019-06-20', 'Gerente de Ventas', 'Ventas', 85000);
        insertEmpleado.run('Ana', 'Martínez', 'ana.martinez@empresa.com', '555-0104', '1992-02-18', '2022-01-05', 'Diseñadora UX', 'Diseño', 65000);
        insertEmpleado.run('Luis', 'Fernández', 'luis.fernandez@empresa.com', '555-0105', '1987-09-30', '2018-11-12', 'Contador', 'Finanzas', 70000);
        
        console.log('✅ Empleados de ejemplo creados');
    }
};

// Adapter para queries tipo PostgreSQL
const query = async (text, params = []) => {
    try {
        // Convertir placeholders de PostgreSQL ($1, $2) a SQLite (?, ?)
        const sqliteQuery = text.replace(/\$\d+/g, '?');
        
        if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
            const stmt = db.prepare(sqliteQuery);
            const rows = stmt.all(...params);
            return { rows, rowCount: rows.length };
        } else {
            const stmt = db.prepare(sqliteQuery);
            const info = stmt.run(...params);
            return { rowCount: info.changes, rows: [], lastID: info.lastInsertRowid };
        }
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        throw error;
    }
};

// Inicializar
initDatabase();

module.exports = {
    query,
    db
};

// Estado de la aplicación
let currentUser = null;
let empleados = [];
let tickets = [];
let currentEmpleadoId = null;
let charts = {};

// Paginación
let currentPage = 1;
let itemsPerPage = 25;
let currentFilteredList = [];

// Ordenamiento
let currentSort = '';

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const empleadoForm = document.getElementById('empleado-form');
const ticketForm = document.getElementById('ticket-form');
const logoutBtn = document.getElementById('sidebar-logout-btn');
const userNameSpan = document.getElementById('sidebar-user-name');
const empleadosList = document.getElementById('empleados-list');
const ticketsList = document.getElementById('tickets-list');
const searchInput = document.getElementById('search-input');
const pageTitle = document.getElementById('page-title');

// Modales
const modalPerfil = document.getElementById('modal-perfil');
const modalTicket = document.getElementById('modal-ticket');
const modalClose = document.querySelector('.modal-close');
const modalCloseTicket = document.querySelector('.modal-close-ticket');

// API Base URL
const API_URL = 'http://localhost:3000/api';

// ===== NAVEGACIÓN SIDEBAR =====

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Actualizar título
        const titles = {
            'dashboard': '<i class="fas fa-chart-line"></i> Dashboard',
            'lista': '<i class="fas fa-users"></i> Personal',
            'nuevo': '<i class="fas fa-user-plus"></i> Nuevo Empleado',
            'tickets': '<i class="fas fa-clipboard-list"></i> Tickets',
            'reportes': '<i class="fas fa-file-pdf"></i> Reportes',
            'alertas': '<i class="fas fa-bell"></i> Alertas'
        };
        pageTitle.innerHTML = titles[tabName];
        
        // Cargar datos según la tab
        if (tabName === 'dashboard') {
            loadDashboard();
        } else if (tabName === 'lista') {
            loadEmpleados();
        } else if (tabName === 'tickets') {
            loadAllTickets();
        } else if (tabName === 'alertas') {
            loadAlertas();
        }
    });
});

// ===== AUTENTICACIÓN =====

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.usuario;
            showMainScreen();
            aplicarPermisos(); // Aplicar permisos según rol
            loadDashboard();
        } else {
            showToast('error', 'Error de Login', data.mensaje);
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo conectar con el servidor');
        console.error(error);
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    empleados = [];
    tickets = [];
    showLoginScreen();
    loginForm.reset();
    showToast('info', 'Sesión Cerrada', 'Has cerrado sesión correctamente');
});

// ===== TOAST NOTIFICATIONS =====

function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ===== SISTEMA DE PERMISOS =====

function tienePermiso(modulo, accion) {
    if (!currentUser || !currentUser.permisos) return false;
    return currentUser.permisos[modulo]?.[accion] === true;
}

function aplicarPermisos() {
    if (!currentUser) return;
    
    const rol = currentUser.rol || 'viewer';
    
    // Mostrar rol en sidebar
    const userInfoDiv = document.querySelector('.sidebar-footer small');
    if (userInfoDiv) {
        const rolesNombres = {
            'superadmin': 'Super Admin',
            'admin': 'Administrador',
            'manager': 'Gerente RRHH',
            'viewer': 'Consultor'
        };
        userInfoDiv.textContent = rolesNombres[rol] || 'Usuario';
    }
    
    // Mostrar badge de rol en top bar
    const roleBadge = document.getElementById('role-badge');
    const roleText = document.getElementById('role-text');
    if (roleBadge && roleText) {
        const rolesNombres = {
            'superadmin': 'Super Admin',
            'admin': 'Admin RRHH',
            'manager': 'Gerente',
            'viewer': 'Consultor'
        };
        
        // Remover clases anteriores
        roleBadge.className = 'role-badge';
        
        // Agregar clase específica del rol
        roleBadge.classList.add(`role-${rol}`);
        
        // Actualizar texto
        roleText.textContent = rolesNombres[rol] || 'Usuario';
        
        // Mostrar badge
        roleBadge.style.display = 'flex';
    }
    
    // Ocultar tab "Nuevo Empleado" si no tiene permisos
    if (!tienePermiso('empleados', 'crear')) {
        const nuevoTab = document.querySelector('[data-tab="nuevo"]');
        if (nuevoTab) nuevoTab.style.display = 'none';
    }
    
    // Ocultar botones de exportación si no tiene permisos
    if (!tienePermiso('exportar', 'pdf')) {
        document.querySelectorAll('[onclick*="exportarAPDF"]').forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    if (!tienePermiso('exportar', 'excel')) {
        document.querySelectorAll('[onclick*="exportarAExcel"]').forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Deshabilitar botones de eliminar si no tiene permisos
    if (!tienePermiso('empleados', 'eliminar')) {
        aplicarPermisoEliminacion();
    }
    
    // Deshabilitar botones de edición si no tiene permisos
    if (!tienePermiso('empleados', 'editar')) {
        aplicarPermisoEdicion();
    }
}

function aplicarPermisoEliminacion() {
    // Se aplicará cuando se carguen los empleados
    const interval = setInterval(() => {
        const deleteButtons = document.querySelectorAll('.btn-danger');
        if (deleteButtons.length > 0) {
            deleteButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                btn.style.cursor = 'not-allowed';
                btn.title = 'No tiene permisos para eliminar';
            });
            clearInterval(interval);
        }
    }, 500);
}

function aplicarPermisoEdicion() {
    // Deshabilitar inputs en formulario de edición
    const interval = setInterval(() => {
        const editButtons = document.querySelectorAll('.btn-warning');
        if (editButtons.length > 0) {
            editButtons.forEach(btn => {
                if (btn.textContent.includes('Editar')) {
                    btn.disabled = true;
                    btn.style.opacity = '0.3';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'No tiene permisos para editar';
                }
            });
            clearInterval(interval);
        }
    }, 500);
}

// Función auxiliar para verificar permisos antes de acciones críticas
function verificarYEjecutar(modulo, accion, callback) {
    if (tienePermiso(modulo, accion)) {
        callback();
    } else {
        alert(`⛔ No tiene permisos para ${accion} en ${modulo}`);
    }
}

// ===== DASHBOARD Y ESTADÍSTICAS =====

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/empleados`);
        empleados = await response.json();
        
        // Calcular KPIs
        const kpis = calcularKPIs(empleados);
        mostrarKPIs(kpis);
        
        // Crear gráficos
        crearGraficos(empleados);
        
        // Mostrar alertas prioritarias
        mostrarAlertasDashboard(empleados);
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}

function calcularKPIs(empleados) {
    const extranjeros = empleados.filter(e => e.esExtranjero === 'si').length;
    const conAntecedentes = empleados.filter(e => e.antecedentesPenales === 'si').length;
    const conProblemasSalud = empleados.filter(e => e.problemasSalud && e.problemasSalud.trim() !== '').length;
    
    // Calcular menores en familias (estimación basada en composición familiar)
    let menoresEstimados = 0;
    empleados.forEach(e => {
        if (e.integracionFamiliar) {
            const match = e.integracionFamiliar.toLowerCase().match(/(\d+)\s*(hijo|hija|menor|niño)/gi);
            if (match) {
                match.forEach(m => {
                    const num = parseInt(m.match(/\d+/)[0]);
                    menoresEstimados += num;
                });
            }
        }
    });
    
    // Empleados de viaje (basado en tickets recientes)
    const deViaje = tickets.filter(t => 
        t.tipo === 'vacaciones' && 
        new Date(t.fecha) > new Date(Date.now() - 30*24*60*60*1000)
    ).length;
    
    return {
        total: empleados.length,
        extranjeros,
        conAntecedentes,
        menores: menoresEstimados,
        conProblemasSalud,
        deViaje
    };
}

function mostrarKPIs(kpis) {
    document.getElementById('kpi-total').textContent = kpis.total;
    document.getElementById('kpi-extranjeros').textContent = kpis.extranjeros;
    document.getElementById('kpi-antecedentes').textContent = kpis.conAntecedentes;
    document.getElementById('kpi-menores').textContent = kpis.menores;
    document.getElementById('kpi-salud').textContent = kpis.conProblemasSalud;
    document.getElementById('kpi-viaje').textContent = kpis.deViaje;
    
    // Calcular y mostrar métricas avanzadas
    calcularMetricasAvanzadas();
}

function calcularMetricasAvanzadas() {
    if (empleados.length === 0) return;
    
    // Edad promedio
    const edades = empleados.map(e => {
        const datos = e.datosPersonales || e;
        return calcularEdad(datos.fechaNacimiento);
    }).filter(edad => edad > 0);
    
    const edadPromedio = edades.length > 0 
        ? (edades.reduce((sum, edad) => sum + edad, 0) / edades.length).toFixed(1)
        : 0;
    
    document.getElementById('kpi-edad-promedio').textContent = `${edadPromedio} años`;
    
    // Antigüedad promedio
    const antiguedades = empleados
        .filter(e => e.laboral && e.laboral.fechaIngreso)
        .map(e => calcularAntiguedad(e.laboral.fechaIngreso));
    
    const antiguedadPromedio = antiguedades.length > 0
        ? (antiguedades.reduce((sum, ant) => sum + ant, 0) / antiguedades.length).toFixed(1)
        : 0;
    
    document.getElementById('kpi-antiguedad-promedio').textContent = `${antiguedadPromedio} años`;
    
    // Salario promedio
    const salarios = empleados
        .filter(e => e.laboral && e.laboral.salario)
        .map(e => e.laboral.salario);
    
    const salarioPromedio = salarios.length > 0
        ? Math.round(salarios.reduce((sum, sal) => sum + sal, 0) / salarios.length)
        : 0;
    
    document.getElementById('kpi-salario-promedio').textContent = 
        `$${salarioPromedio.toLocaleString('es-AR')}`;
    
    // Costo laboral total
    const costoTotal = salarios.reduce((sum, sal) => sum + sal, 0);
    document.getElementById('kpi-costo-total').textContent = 
        `$${costoTotal.toLocaleString('es-AR')}`;
    
    // Área con más personal
    const areaCount = {};
    empleados.forEach(e => {
        if (e.laboral && e.laboral.area) {
            areaCount[e.laboral.area] = (areaCount[e.laboral.area] || 0) + 1;
        }
    });
    
    let areaMayor = '-';
    let maxCount = 0;
    Object.entries(areaCount).forEach(([area, count]) => {
        if (count > maxCount) {
            maxCount = count;
            areaMayor = `${area} (${count})`;
        }
    });
    
    document.getElementById('kpi-area-mayor').textContent = areaMayor;
    
    // Porcentaje con estudios superiores
    const conEstudiosSuperiores = empleados.filter(e => {
        const nivel = e.educacion?.nivelMaximo || e.nivelEducativo || '';
        return nivel.toLowerCase().includes('universitario') || 
               nivel.toLowerCase().includes('terciario');
    }).length;
    
    const porcentajeSuperiores = empleados.length > 0
        ? ((conEstudiosSuperiores / empleados.length) * 100).toFixed(0)
        : 0;
    
    document.getElementById('kpi-educacion-alta').textContent = `${porcentajeSuperiores}%`;
}

function crearGraficos(empleados) {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    // Gráfico: Nacionalidad
    const nacionalidades = {};
    empleados.forEach(e => {
        const pais = e.esExtranjero === 'si' ? (e.paisOrigen || 'Desconocido') : 'Argentina';
        nacionalidades[pais] = (nacionalidades[pais] || 0) + 1;
    });
    
    charts.nacionalidad = new Chart(document.getElementById('chart-nacionalidad'), {
        type: 'pie',
        data: {
            labels: Object.keys(nacionalidades),
            datasets: [{
                data: Object.values(nacionalidades),
                backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Gráfico: Educación
    const educacion = {};
    empleados.forEach(e => {
        const nivel = e.nivelEducativo || 'Sin especificar';
        educacion[nivel] = (educacion[nivel] || 0) + 1;
    });
    
    charts.educacion = new Chart(document.getElementById('chart-educacion'), {
        type: 'bar',
        data: {
            labels: Object.keys(educacion),
            datasets: [{
                label: 'Cantidad',
                data: Object.values(educacion),
                backgroundColor: '#2196f3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Gráfico: Residencia
    const residencias = {};
    empleados.forEach(e => {
        const tipo = e.tipoResidencia || 'No aplica';
        residencias[tipo] = (residencias[tipo] || 0) + 1;
    });
    
    charts.residencia = new Chart(document.getElementById('chart-residencia'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(residencias),
            datasets: [{
                data: Object.values(residencias),
                backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Gráfico: Edad (distribución por rangos)
    const edades = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    empleados.forEach(e => {
        if (e.fechaNacimiento) {
            const edad = calcularEdad(e.fechaNacimiento);
            if (edad >= 18 && edad <= 25) edades['18-25']++;
            else if (edad >= 26 && edad <= 35) edades['26-35']++;
            else if (edad >= 36 && edad <= 45) edades['36-45']++;
            else if (edad >= 46 && edad <= 55) edades['46-55']++;
            else if (edad >= 56) edades['56+']++;
        }
    });
    
    charts.edad = new Chart(document.getElementById('chart-edad'), {
        type: 'bar',
        data: {
            labels: Object.keys(edades),
            datasets: [{
                label: 'Empleados',
                data: Object.values(edades),
                backgroundColor: '#4caf50'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function mostrarAlertasDashboard(empleados) {
    const alertasContainer = document.getElementById('alertas-dashboard');
    const alertas = [];
    
    // Generar alertas
    empleados.forEach(emp => {
        // Antecedentes penales
        if (emp.antecedentesPenales === 'si') {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-exclamation-triangle',
                titulo: 'Antecedentes Penales',
                descripcion: `${emp.nombreCompleto} tiene antecedentes penales registrados.`,
                empleadoId: emp.id
            });
        }
        
        // Problemas de salud
        if (emp.problemasSalud && emp.problemasSalud.trim() !== '') {
            alertas.push({
                tipo: 'info',
                icono: 'fas fa-heartbeat',
                titulo: 'Problema de Salud',
                descripcion: `${emp.nombreCompleto}: ${emp.problemasSalud.substring(0, 60)}...`,
                empleadoId: emp.id
            });
        }
        
        // Residencia temporaria o precaria
        if (emp.tipoResidencia === 'temporaria' || emp.tipoResidencia === 'precaria') {
            alertas.push({
                tipo: 'warning',
                icono: 'fas fa-id-card',
                titulo: 'Residencia ' + emp.tipoResidencia,
                descripcion: `${emp.nombreCompleto} tiene residencia ${emp.tipoResidencia}. Verificar vencimiento.`,
                empleadoId: emp.id
            });
        }
    });
    
    if (alertas.length === 0) {
        alertasContainer.innerHTML = '<p class="empty-state">✅ No hay alertas prioritarias.</p>';
        return;
    }
    
    alertasContainer.innerHTML = alertas.slice(0, 5).map(a => `
        <div class="alerta-item ${a.tipo}" onclick="verPerfil(${a.empleadoId})">
            <i class="${a.icono}"></i>
            <div class="alerta-content">
                <h4>${a.titulo}</h4>
                <p>${a.descripcion}</p>
            </div>
        </div>
    `).join('');
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// ===== VALIDACIONES =====

function validarCUIL(cuil) {
    // Formato: XX-XXXXXXXX-X
    const regex = /^\d{2}-\d{8}-\d{1}$/;
    if (!regex.test(cuil)) {
        return { valido: false, mensaje: 'Formato de CUIL inválido. Debe ser XX-XXXXXXXX-X' };
    }
    
    // Validar dígito verificador
    const nums = cuil.replace(/-/g, '');
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    
    for (let i = 0; i < 10; i++) {
        suma += parseInt(nums[i]) * multiplicadores[i];
    }
    
    const resto = suma % 11;
    const digito = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
    
    if (digito !== parseInt(nums[10])) {
        return { valido: false, mensaje: 'CUIL inválido: dígito verificador incorrecto' };
    }
    
    return { valido: true, mensaje: '' };
}

function validarEmail(email) {
    if (!email) return { valido: true, mensaje: '' }; // Email opcional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { valido: false, mensaje: 'Email inválido' };
    }
    return { valido: true, mensaje: '' };
}

function validarFecha(fecha, nombre) {
    if (!fecha) return { valido: false, mensaje: `${nombre} es obligatoria` };
    
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    
    if (isNaN(fechaObj.getTime())) {
        return { valido: false, mensaje: `${nombre} inválida` };
    }
    
    if (nombre === 'Fecha de Nacimiento' && fechaObj > hoy) {
        return { valido: false, mensaje: 'La fecha de nacimiento no puede ser futura' };
    }
    
    if (nombre === 'Fecha de Nacimiento') {
        const edad = hoy.getFullYear() - fechaObj.getFullYear();
        if (edad < 18 || edad > 100) {
            return { valido: false, mensaje: 'La edad debe estar entre 18 y 100 años' };
        }
    }
    
    return { valido: true, mensaje: '' };
}

function mostrarErrorCampo(inputId, mensaje) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Eliminar error anterior
    const errorAnterior = input.parentElement.querySelector('.error-mensaje');
    if (errorAnterior) errorAnterior.remove();
    
    // Agregar borde rojo
    input.style.borderColor = '#ef4444';
    
    // Agregar mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-mensaje';
    errorDiv.textContent = mensaje;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '4px';
    input.parentElement.appendChild(errorDiv);
}

function limpiarErrorCampo(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.style.borderColor = '';
    const errorAnterior = input.parentElement.querySelector('.error-mensaje');
    if (errorAnterior) errorAnterior.remove();
}

function validarFormulario() {
    let errores = [];
    
    // Validar nombre completo
    const nombre = document.getElementById('nombreCompleto').value.trim();
    if (!nombre || nombre.length < 3) {
        errores.push({ campo: 'nombreCompleto', mensaje: 'Nombre completo debe tener al menos 3 caracteres' });
    } else {
        limpiarErrorCampo('nombreCompleto');
    }
    
    // Validar CUIL
    const cuil = document.getElementById('cuil').value.trim();
    if (cuil) {
        const validacionCUIL = validarCUIL(cuil);
        if (!validacionCUIL.valido) {
            errores.push({ campo: 'cuil', mensaje: validacionCUIL.mensaje });
        } else {
            limpiarErrorCampo('cuil');
        }
    }
    
    // Validar fecha de nacimiento
    const fechaNac = document.getElementById('fechaNacimiento').value;
    const validacionFecha = validarFecha(fechaNac, 'Fecha de Nacimiento');
    if (!validacionFecha.valido) {
        errores.push({ campo: 'fechaNacimiento', mensaje: validacionFecha.mensaje });
    } else {
        limpiarErrorCampo('fechaNacimiento');
    }
    
    // Mostrar todos los errores
    errores.forEach(error => {
        mostrarErrorCampo(error.campo, error.mensaje);
    });
    
    return errores.length === 0;
}

// ===== GESTIÓN DE EMPLEADOS =====

empleadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validarFormulario()) {
        alert('⚠️ Por favor corrige los errores en el formulario');
        return;
    }
    
    const empleadoData = {
        nombreCompleto: document.getElementById('nombreCompleto').value,
        cuil: document.getElementById('cuil').value,
        fechaNacimiento: document.getElementById('fechaNacimiento').value,
        documento: document.getElementById('documento').value,
        
        estadoCivil: document.getElementById('estadoCivil').value,
        integracionFamiliar: document.getElementById('integracionFamiliar').value,
        escolaridadFamiliar: document.getElementById('escolaridadFamiliar').value,
        
        nivelEducativo: document.getElementById('nivelEducativo').value,
        
        problemasSalud: document.getElementById('problemasSalud').value,
        
        esExtranjero: document.getElementById('esExtranjero').value,
        paisOrigen: document.getElementById('paisOrigen').value,
        fechaEntradaPais: document.getElementById('fechaEntradaPais').value,
        tipoResidencia: document.getElementById('tipoResidencia').value,
        entradasSalidasPais: document.getElementById('entradasSalidasPais').value,
        
        experienciaLaboral: document.getElementById('experienciaLaboral').value,
        fechaIngreso: document.getElementById('fechaIngreso').value,
        puesto: document.getElementById('puesto').value,
        
        antecedentesPenales: document.getElementById('antecedentesPenales').value,
        observacionesAntecedentes: document.getElementById('observacionesAntecedentes').value,
        
        observaciones: document.getElementById('observaciones').value
    };
    
    // Obtener botón de submit y mostrar loading
    const submitBtn = empleadoForm.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.textContent;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/empleados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('success', 'Empleado Registrado', 'El empleado se ha registrado correctamente');
            empleadoForm.reset();
            // Cambiar a la tab de lista
            document.querySelector('[data-tab="lista"]').click();
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo registrar el empleado');
        console.error(error);
    } finally {
        // Restaurar botón
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
            document.querySelector('[data-tab="lista"]').click();
        }
    } catch (error) {
        alert('❌ Error al registrar empleado');
        console.error(error);
    } finally {
        // Restaurar botón
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
        alert('❌ Error al registrar empleado');
        console.error(error);
    }
});

async function loadEmpleados() {
    try {
        const response = await fetch(`${API_URL}/empleados`);
        empleados = await response.json();
        displayEmpleados(empleados);
        
        // Generar notificaciones inteligentes
        generarNotificaciones();
    } catch (error) {
        empleadosList.innerHTML = '<p class="loading">❌ Error al cargar empleados</p>';
        console.error(error);
    }
}

function displayEmpleados(lista) {
    currentFilteredList = lista;
    
    if (lista.length === 0) {
        empleadosList.innerHTML = '<p class="empty-state">📭 No hay empleados registrados aún.</p>';
        return;
    }
    
    // Calcular paginación
    const totalPages = Math.ceil(lista.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedList = lista.slice(startIndex, endIndex);
    
    empleadosList.innerHTML = `
        <div class="empleados-header">
            <div class="empleados-count">
                Total de empleados: <strong>${lista.length}</strong> 
                <span class="page-info">| Mostrando ${startIndex + 1}-${Math.min(endIndex, lista.length)}</span>
            </div>
            <div class="pagination-controls">
                <select id="items-per-page" onchange="cambiarItemsPorPagina(this.value)">
                    <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10 por página</option>
                    <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25 por página</option>
                    <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50 por página</option>
                    <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100 por página</option>
                </select>
            </div>
        </div>
        
        <table class="empleados-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>CUIL</th>
                    <th>Puesto</th>
                    <th>Fecha Ingreso</th>
                    <th>Extranjero</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedList.map(emp => `
                    <tr>
                        <td><strong>${escapeHtml(emp.nombreCompleto)}</strong></td>
                        <td>${escapeHtml(emp.cuil)}</td>
                        <td>${escapeHtml(emp.puesto || '-')}</td>
                        <td>${emp.fechaIngreso ? formatDate(emp.fechaIngreso) : '-'}</td>
                        <td>${emp.esExtranjero === 'si' ? '🌍 Sí' : 'No'}</td>
                        <td>
                            <button class="btn-small btn-info" onclick="verPerfil(${emp.id})">👁️ Ver</button>
                            <button class="btn-small btn-warning" onclick="crearTicket(${emp.id})">📋 Ticket</button>
                            <button class="btn-small btn-danger" onclick="eliminarEmpleado(${emp.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        ${totalPages > 1 ? `
            <div class="pagination">
                <button class="pagination-btn" onclick="cambiarPagina(1)" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-left"></i> Primera
                </button>
                <button class="pagination-btn" onclick="cambiarPagina(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-left"></i> Anterior
                </button>
                
                <div class="pagination-pages">
                    ${generarBotonesPagina(currentPage, totalPages)}
                </div>
                
                <button class="pagination-btn" onclick="cambiarPagina(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-btn" onclick="cambiarPagina(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Última <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        ` : ''}
    `;
}

function generarBotonesPagina(current, total) {
    let buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        buttons.push(`
            <button class="pagination-page ${i === current ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `);
    }
    
    return buttons.join('');
}

function cambiarPagina(page) {
    const totalPages = Math.ceil(currentFilteredList.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayEmpleados(currentFilteredList);
    
    // Scroll suave al inicio de la tabla
    document.querySelector('.empleados-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cambiarItemsPorPagina(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1;
    displayEmpleados(currentFilteredList);
}

// Función de ordenamiento
function aplicarOrdenamiento() {
    const sortValue = document.getElementById('sort-select').value;
    currentSort = sortValue;
    
    if (!sortValue) {
        displayEmpleados(currentFilteredList);
        return;
    }
    
    const [campo, orden] = sortValue.split('-');
    const sorted = [...currentFilteredList];
    
    sorted.sort((a, b) => {
        let valorA, valorB;
        
        switch(campo) {
            case 'nombre':
                valorA = a.nombreCompleto?.toLowerCase() || '';
                valorB = b.nombreCompleto?.toLowerCase() || '';
                break;
                
            case 'fecha':
                valorA = a.laboral?.fechaIngreso ? new Date(a.laboral.fechaIngreso) : new Date(0);
                valorB = b.laboral?.fechaIngreso ? new Date(b.laboral.fechaIngreso) : new Date(0);
                break;
                
            case 'salario':
                valorA = parseFloat(a.laboral?.salario) || 0;
                valorB = parseFloat(b.laboral?.salario) || 0;
                break;
                
            case 'area':
                valorA = a.laboral?.area?.toLowerCase() || '';
                valorB = b.laboral?.area?.toLowerCase() || '';
                break;
                
            case 'edad':
                if (a.fechaNacimiento) {
                    const hoy = new Date();
                    const nacimiento = new Date(a.fechaNacimiento);
                    valorA = hoy.getFullYear() - nacimiento.getFullYear();
                } else {
                    valorA = 0;
                }
                
                if (b.fechaNacimiento) {
                    const hoy = new Date();
                    const nacimiento = new Date(b.fechaNacimiento);
                    valorB = hoy.getFullYear() - nacimiento.getFullYear();
                } else {
                    valorB = 0;
                }
                break;
                
            default:
                return 0;
        }
        
        // Aplicar orden ascendente o descendente
        if (orden === 'asc') {
            if (valorA < valorB) return -1;
            if (valorA > valorB) return 1;
            return 0;
        } else {
            if (valorA > valorB) return -1;
            if (valorA < valorB) return 1;
            return 0;
        }
    });
    
    currentPage = 1;
    displayEmpleados(sorted);
}

// Búsqueda en tiempo real
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = empleados.filter(emp => 
        emp.nombreCompleto.toLowerCase().includes(query) ||
        emp.cuil.toLowerCase().includes(query) ||
        (emp.documento && emp.documento.toLowerCase().includes(query)) ||
        (emp.puesto && emp.puesto.toLowerCase().includes(query))
    );
    currentPage = 1; // Resetear a la primera página al buscar
    displayEmpleados(filtered);
});

async function eliminarEmpleado(id) {
    // Verificar permisos
    if (!tienePermiso('empleados', 'eliminar')) {
        alert('⛔ No tiene permisos para eliminar empleados');
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/empleados/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Empleado eliminado');
            loadEmpleados();
        }
    } catch (error) {
        alert('❌ Error al eliminar empleado');
        console.error(error);
    }
}

// ===== VER PERFIL COMPLETO =====

async function verPerfil(id) {
    try {
        const response = await fetch(`${API_URL}/empleados/${id}`);
        const emp = await response.json();
        
        // Funciones auxiliares para formatear
        const dp = emp.datosPersonales || {};
        const dir = emp.direccion || {};
        const cont = emp.contacto || {};
        const edu = emp.educacion || {};
        const sal = emp.salud || {};
        const inm = emp.inmigracion || {};
        const lab = emp.laboral || {};
        const ant = emp.antecedentes || {};
        
        const perfilHTML = `
            <div class="perfil-header">
                <h2><i class="fas fa-user-circle"></i> ${escapeHtml(dp.nombreCompleto || emp.nombreCompleto || 'Sin nombre')}</h2>
                <span class="badge ${lab.estadoActual === 'Activo' ? 'badge-success' : 'badge-danger'}">
                    ${lab.estadoActual || 'Activo'}
                </span>
            </div>
            
            <div class="perfil-tabs">
                <button class="perfil-tab active" data-tab="personal">📋 Personal</button>
                <button class="perfil-tab" data-tab="contacto">📞 Contacto</button>
                <button class="perfil-tab" data-tab="familiares">👨‍👩‍👧 Familia</button>
                <button class="perfil-tab" data-tab="laboral">💼 Laboral</button>
                <button class="perfil-tab" data-tab="documentos">📄 Documentos</button>
                <button class="perfil-tab" data-tab="historial">📊 Historial</button>
            </div>
            
            <div class="perfil-tab-content active" id="perfil-tab-personal">
                <div class="perfil-grid">
                    <div class="perfil-section">
                        <h3><i class="fas fa-id-card"></i> Datos Personales</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>CUIL:</label>
                                <span>${escapeHtml(dp.cuil || emp.cuil || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Documento:</label>
                                <span>${escapeHtml(dp.documento || emp.documento || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Nacimiento:</label>
                                <span>${dp.fechaNacimiento ? formatDate(dp.fechaNacimiento) : '-'} (${dp.edad || 'N/A'} años)</span>
                            </div>
                            <div class="info-item">
                                <label>Sexo:</label>
                                <span>${dp.sexo === 'M' ? 'Masculino' : dp.sexo === 'F' ? 'Femenino' : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Estado Civil:</label>
                                <span>${escapeHtml(dp.estadoCivil || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Nacionalidad:</label>
                                <span>${escapeHtml(dp.nacionalidad || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Lugar de Nacimiento:</label>
                                <span>${escapeHtml(dp.lugarNacimiento || '-')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Dirección</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Calle:</label>
                                <span>${escapeHtml(dir.calle || '-')} ${escapeHtml(dir.numero || '')}</span>
                            </div>
                            <div class="info-item">
                                <label>Barrio:</label>
                                <span>${escapeHtml(dir.barrio || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Localidad:</label>
                                <span>${escapeHtml(dir.localidad || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Provincia:</label>
                                <span>${escapeHtml(dir.provincia || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Código Postal:</label>
                                <span>${escapeHtml(dir.codigoPostal || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Tipo de Vivienda:</label>
                                <span>${escapeHtml(dir.tipoVivienda || '-')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-graduation-cap"></i> Educación</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Nivel Educativo:</label>
                                <span>${escapeHtml(edu.nivelEducativo || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Título:</label>
                                <span>${escapeHtml(edu.tituloObtenido || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Institución:</label>
                                <span>${escapeHtml(edu.institucion || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Año de Egreso:</label>
                                <span>${escapeHtml(edu.añoEgreso || '-')}</span>
                            </div>
                        </div>
                        ${edu.cursos && edu.cursos.length > 0 ? `
                            <p><strong>Cursos:</strong> ${edu.cursos.join(', ')}</p>
                        ` : ''}
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-heartbeat"></i> Salud</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Grupo Sanguíneo:</label>
                                <span>${escapeHtml(sal.grupoSanguineo || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Obra Social:</label>
                                <span>${escapeHtml(sal.obraSocial || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Nro. Afiliado:</label>
                                <span>${escapeHtml(sal.nroAfiliado || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Aptitud Laboral:</label>
                                <span class="badge ${sal.aptitudLaboral === 'Apto' ? 'badge-success' : 'badge-warning'}">
                                    ${escapeHtml(sal.aptitudLaboral || '-')}
                                </span>
                            </div>
                            <div class="info-item">
                                <label>Último Examen:</label>
                                <span>${sal.ultimoExamenMedico ? formatDate(sal.ultimoExamenMedico) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Próximo Examen:</label>
                                <span>${sal.proximoExamenMedico ? formatDate(sal.proximoExamenMedico) : '-'}</span>
                            </div>
                        </div>
                        ${sal.problemasSalud && sal.problemasSalud !== 'Ninguno' ? `
                            <div class="alert alert-warning">
                                <strong>⚠️ Problemas de Salud:</strong> ${escapeHtml(sal.problemasSalud)}
                            </div>
                        ` : ''}
                        ${sal.alergias && sal.alergias !== 'Ninguna' ? `
                            <div class="alert alert-info">
                                <strong>🔔 Alergias:</strong> ${escapeHtml(sal.alergias)}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${inm.esExtranjero ? `
                    <div class="perfil-section">
                        <h3><i class="fas fa-globe"></i> Información Migratoria</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>País de Origen:</label>
                                <span>${escapeHtml(inm.paisOrigen || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Entrada:</label>
                                <span>${inm.fechaEntradaPais ? formatDate(inm.fechaEntradaPais) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Tipo de Residencia:</label>
                                <span>${escapeHtml(inm.tipoResidencia || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Nro. Residencia:</label>
                                <span>${escapeHtml(inm.numeroResidencia || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Vencimiento:</label>
                                <span>${inm.fechaVencimientoResidencia ? formatDate(inm.fechaVencimientoResidencia) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Estado:</label>
                                <span class="badge ${inm.estadoResidencia === 'Vigente' ? 'badge-success' : 'badge-warning'}">
                                    ${escapeHtml(inm.estadoResidencia || '-')}
                                </span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${ant.tieneAntecedentes ? `
                    <div class="perfil-section">
                        <h3><i class="fas fa-exclamation-triangle"></i> Antecedentes</h3>
                        <div class="alert alert-danger">
                            <strong>⚠️ Tiene antecedentes penales</strong><br>
                            ${escapeHtml(ant.detalles || 'Ver detalles en documentación')}
                        </div>
                        <p><strong>Fecha de Consulta:</strong> ${ant.fechaConsulta ? formatDate(ant.fechaConsulta) : '-'}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-contacto">
                <div class="perfil-section">
                    <h3><i class="fas fa-phone"></i> Información de Contacto</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Teléfono Personal:</label>
                            <span>${escapeHtml(cont.telefonoPersonal || '-')}</span>
                        </div>
                        <div class="info-item">
                            <label>Celular:</label>
                            <span>${escapeHtml(cont.telefonoCelular || '-')}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${escapeHtml(cont.email || '-')}</span>
                        </div>
                        <div class="info-item">
                            <label>Email Alternativo:</label>
                            <span>${escapeHtml(cont.emailAlternativo || '-')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="perfil-section">
                    <h3><i class="fas fa-ambulance"></i> Contacto de Emergencia</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Nombre:</label>
                            <span>${escapeHtml(cont.contactoEmergencia || '-')}</span>
                        </div>
                        <div class="info-item">
                            <label>Relación:</label>
                            <span>${escapeHtml(cont.relacionEmergencia || '-')}</span>
                        </div>
                        <div class="info-item">
                            <label>Teléfono:</label>
                            <span>${escapeHtml(cont.telefonoEmergencia || '-')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-familiares">
                <div class="perfil-section">
                    <h3><i class="fas fa-users"></i> Grupo Familiar</h3>
                    ${emp.familiares && emp.familiares.length > 0 ? `
                        <div class="familiares-list">
                            ${emp.familiares.map(fam => `
                                <div class="familiar-card">
                                    <div class="familiar-header">
                                        <h4><i class="fas fa-user"></i> ${escapeHtml(fam.nombre || '')} ${escapeHtml(fam.apellido || '')}</h4>
                                        <span class="badge badge-info">${escapeHtml(fam.relacion || '')}</span>
                                    </div>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <label>Documento:</label>
                                            <span>${escapeHtml(fam.documento || 'No registrado')}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>CUIL:</label>
                                            <span>${escapeHtml(fam.cuil || 'No registrado')}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Fecha de Nacimiento:</label>
                                            <span>${fam.fechaNacimiento ? formatDate(fam.fechaNacimiento) : '-'} ${fam.edad ? `(${fam.edad} años)` : ''}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Sexo:</label>
                                            <span>${fam.sexo === 'M' ? 'Masculino' : fam.sexo === 'F' ? 'Femenino' : '-'}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>Nivel Educativo:</label>
                                            <span>${escapeHtml(fam.nivelEducativo || '-')}</span>
                                        </div>
                                        ${fam.escuela ? `
                                        <div class="info-item">
                                            <label>Escuela:</label>
                                            <span>${escapeHtml(fam.escuela)}</span>
                                        </div>
                                        ` : ''}
                                        <div class="info-item">
                                            <label>Ocupación:</label>
                                            <span>${escapeHtml(fam.ocupacion || '-')}</span>
                                        </div>
                                        <div class="info-item">
                                            <label>A Cargo:</label>
                                            <span class="badge ${fam.aCargo ? 'badge-success' : 'badge-secondary'}">
                                                ${fam.aCargo ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                        <div class="info-item">
                                            <label>Obra Social:</label>
                                            <span>${escapeHtml(fam.obraSocial || 'No tiene')}</span>
                                        </div>
                                    </div>
                                    ${fam.observaciones ? `<p><strong>Observaciones:</strong> ${escapeHtml(fam.observaciones)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">No hay familiares registrados</p>'}
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-laboral">
                <div class="perfil-grid">
                    <div class="perfil-section">
                        <h3><i class="fas fa-briefcase"></i> Información Laboral</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Legajo:</label>
                                <span>${escapeHtml(lab.legajo || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Puesto:</label>
                                <span>${escapeHtml(lab.puesto || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Área:</label>
                                <span>${escapeHtml(lab.area || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Sector:</label>
                                <span>${escapeHtml(lab.sector || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Ingreso:</label>
                                <span>${lab.fechaIngreso ? formatDate(lab.fechaIngreso) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Antigüedad:</label>
                                <span>${escapeHtml(lab.antiguedad || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Tipo de Contrato:</label>
                                <span>${escapeHtml(lab.tipoContrato || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Jornada:</label>
                                <span>${escapeHtml(lab.jornada || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Horario:</label>
                                <span>${escapeHtml(lab.horario || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Salario Básico:</label>
                                <span>$${lab.salarioBasico ? lab.salarioBasico.toLocaleString('es-AR') : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Banco:</label>
                                <span>${escapeHtml(lab.banco || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>CBU:</label>
                                <span>${escapeHtml(lab.cbu || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Supervisor:</label>
                                <span>${escapeHtml(lab.supervisor || '-')}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${emp.experienciaPrevia && emp.experienciaPrevia.length > 0 ? `
                    <div class="perfil-section">
                        <h3><i class="fas fa-history"></i> Experiencia Previa</h3>
                        ${emp.experienciaPrevia.map(exp => `
                            <div class="experiencia-card">
                                <h4>${escapeHtml(exp.puesto || '')}</h4>
                                <p class="text-muted">${escapeHtml(exp.empresa || '')} | ${exp.desde || ''} - ${exp.hasta || ''} (${exp.duracion || ''})</p>
                                <p><strong>Tareas:</strong> ${escapeHtml(exp.tareas || '')}</p>
                                <p><strong>Motivo de Salida:</strong> ${escapeHtml(exp.motivoSalida || '')}</p>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-documentos">
                <div class="perfil-section">
                    <h3><i class="fas fa-file-alt"></i> Documentos</h3>
                    ${emp.documentos && emp.documentos.length > 0 ? `
                        <div class="documentos-list">
                            ${emp.documentos.map(doc => `
                                <div class="documento-card">
                                    <div class="documento-header">
                                        <h4><i class="fas fa-file"></i> ${escapeHtml(doc.tipo || '')}</h4>
                                        <span class="badge ${doc.estado === 'Vigente' ? 'badge-success' : 'badge-danger'}">
                                            ${escapeHtml(doc.estado || '')}
                                        </span>
                                    </div>
                                    <div class="info-grid">
                                        ${doc.numero ? `
                                        <div class="info-item">
                                            <label>Número:</label>
                                            <span>${escapeHtml(doc.numero)}</span>
                                        </div>
                                        ` : ''}
                                        ${doc.fechaEmision ? `
                                        <div class="info-item">
                                            <label>Emisión:</label>
                                            <span>${formatDate(doc.fechaEmision)}</span>
                                        </div>
                                        ` : ''}
                                        ${doc.fechaVencimiento ? `
                                        <div class="info-item">
                                            <label>Vencimiento:</label>
                                            <span>${formatDate(doc.fechaVencimiento)}</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                    ${doc.observaciones ? `<p class="text-muted">${escapeHtml(doc.observaciones)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">No hay documentos registrados</p>'}
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-historial">
                <div class="perfil-section">
                    <h3><i class="fas fa-timeline"></i> Historial Laboral y Eventos</h3>
                    ${emp.historialLaboral && emp.historialLaboral.length > 0 ? `
                        <div class="timeline">
                            ${emp.historialLaboral.map(evento => `
                                <div class="timeline-item">
                                    <div class="timeline-marker ${getEventoClass(evento.tipo)}"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-header">
                                            <strong>${getEventoIcon(evento.tipo)} ${escapeHtml(evento.descripcion || '')}</strong>
                                            <span class="timeline-date">${evento.fecha ? formatDate(evento.fecha) : ''}</span>
                                        </div>
                                        <p class="timeline-details">${escapeHtml(evento.detalles || '')}</p>
                                        <small class="text-muted">Registrado por: ${escapeHtml(evento.usuario || '')}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">No hay historial registrado</p>'}
                </div>
                
                <div class="perfil-section">
                    <h3><i class="fas fa-clipboard-list"></i> Tickets y Notificaciones</h3>
                    <div id="tickets-empleado-${emp.id}">
                        <p class="loading">Cargando tickets...</p>
                    </div>
                </div>
            </div>
            
            ${emp.observaciones ? `
            <div class="perfil-section">
                <h3><i class="fas fa-sticky-note"></i> Observaciones Generales</h3>
                <p>${escapeHtml(emp.observaciones)}</p>
            </div>
            ` : ''}
        `;
        
        document.getElementById('perfil-content').innerHTML = perfilHTML;
        modalPerfil.style.display = 'block';
        
        // Activar tabs del perfil
        activatePerfilTabs();
        
        // Cargar tickets del empleado
        loadTicketsEmpleado(emp.id);
        
    } catch (error) {
        alert('❌ Error al cargar perfil');
        console.error(error);
    }
}

async function loadTicketsEmpleado(empleadoId) {
    try {
        const response = await fetch(`${API_URL}/tickets/${empleadoId}`);
        const ticketsEmp = await response.json();
        
        const container = document.getElementById(`tickets-empleado-${empleadoId}`);
        
        if (ticketsEmp.length === 0) {
            container.innerHTML = '<p>No hay tickets registrados.</p>';
            return;
        }
        
        container.innerHTML = ticketsEmp.map(t => `
            <div class="ticket-item-small">
                <strong>${getTipoTicketIcon(t.tipo)} ${escapeHtml(t.tipo)}</strong> - ${formatDate(t.fechaCreacion)}<br>
                ${escapeHtml(t.descripcion)}
            </div>
        `).join('');
        
    } catch (error) {
        console.error(error);
    }
}

// Cerrar modal
modalClose.addEventListener('click', () => {
    modalPerfil.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modalPerfil) {
        modalPerfil.style.display = 'none';
    }
    if (e.target === modalTicket) {
        modalTicket.style.display = 'none';
    }
});

// ===== TICKETS =====

function crearTicket(empleadoId) {
    currentEmpleadoId = empleadoId;
    document.getElementById('ticket-empleadoId').value = empleadoId;
    ticketForm.reset();
    modalTicket.style.display = 'block';
}

function closeTicketModal() {
    modalTicket.style.display = 'none';
    currentEmpleadoId = null;
}

modalCloseTicket.addEventListener('click', closeTicketModal);

ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ticketData = {
        empleadoId: parseInt(document.getElementById('ticket-empleadoId').value),
        tipo: document.getElementById('ticket-tipo').value,
        descripcion: document.getElementById('ticket-descripcion').value,
        fecha: document.getElementById('ticket-fecha').value,
        creadoPor: currentUser.nombre
    };
    
    // Obtener nombre del empleado
    const empleado = empleados.find(e => e.id === ticketData.empleadoId);
    ticketData.empleadoNombre = empleado ? empleado.nombreCompleto : 'Desconocido';
    
    try {
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Ticket creado correctamente');
            closeTicketModal();
        }
    } catch (error) {
        alert('❌ Error al crear ticket');
        console.error(error);
    }
});

async function loadAllTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets`);
        tickets = await response.json();
        displayTickets(tickets);
    } catch (error) {
        ticketsList.innerHTML = '<p class="loading">❌ Error al cargar tickets</p>';
        console.error(error);
    }
}

function displayTickets(lista) {
    if (lista.length === 0) {
        ticketsList.innerHTML = '<p class="empty-state">📭 No hay tickets registrados.</p>';
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    lista.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    ticketsList.innerHTML = lista.map(t => `
        <div class="ticket-item">
            <div class="ticket-header">
                <span class="ticket-tipo">${getTipoTicketIcon(t.tipo)} ${escapeHtml(t.tipo)}</span>
                <span class="ticket-fecha">${formatDate(t.fechaCreacion)}</span>
            </div>
            <p><strong>Empleado:</strong> ${escapeHtml(t.empleadoNombre)}</p>
            <p><strong>Descripción:</strong> ${escapeHtml(t.descripcion)}</p>
            ${t.fecha ? `<p><strong>Fecha del evento:</strong> ${formatDate(t.fecha)}</p>` : ''}
            <p class="ticket-creador">Creado por: ${escapeHtml(t.creadoPor)}</p>
        </div>
    `).join('');
}

function getTipoTicketIcon(tipo) {
    const icons = {
        'inspeccion': '🔍',
        'vacaciones': '🏖️',
        'ausencia': '❌',
        'asistencia_social': '🤝',
        'salud': '🏥',
        'migratorio': '🌍',
        'otro': '📝'
    };
    return icons[tipo] || '📋';
}

// ===== NAVEGACIÓN =====

function showLoginScreen() {
    loginScreen.classList.add('active');
    mainScreen.classList.remove('active');
}

function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    userNameSpan.textContent = currentUser.nombre;
}

// ===== ALERTAS =====

async function loadAlertas() {
    try {
        const response = await fetch(`${API_URL}/empleados`);
        empleados = await response.json();
        
        mostrarAlertasCompletas(empleados);
    } catch (error) {
        console.error('Error al cargar alertas:', error);
    }
}

function mostrarAlertasCompletas(empleados) {
    const alertasContainer = document.getElementById('alertas-list');
    const alertas = [];
    
    empleados.forEach(emp => {
        // Antecedentes penales
        if (emp.antecedentesPenales === 'si') {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-exclamation-triangle',
                titulo: 'Antecedentes Penales',
                descripcion: `${emp.nombreCompleto} tiene antecedentes penales registrados.`,
                detalles: emp.observacionesAntecedentes || 'Sin detalles adicionales',
                empleadoId: emp.id,
                categoria: 'criticas'
            });
        }
        
        // Problemas de salud
        if (emp.problemasSalud && emp.problemasSalud.trim() !== '') {
            alertas.push({
                tipo: 'info',
                icono: 'fas fa-heartbeat',
                titulo: 'Problema de Salud Registrado',
                descripcion: `${emp.nombreCompleto}`,
                detalles: emp.problemasSalud,
                empleadoId: emp.id,
                categoria: 'salud'
            });
        }
        
        // Residencia temporaria o precaria
        if (emp.tipoResidencia === 'temporaria' || emp.tipoResidencia === 'precaria') {
            alertas.push({
                tipo: 'warning',
                icono: 'fas fa-id-card',
                titulo: `Residencia ${emp.tipoResidencia}`,
                descripcion: `${emp.nombreCompleto}`,
                detalles: `Tipo de residencia: ${emp.tipoResidencia}. Verificar fecha de vencimiento y renovación.`,
                empleadoId: emp.id,
                categoria: 'migratorio'
            });
        }
        
        // Turistas (situación irregular)
        if (emp.tipoResidencia === 'turista') {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-passport',
                titulo: 'Trabajando como Turista',
                descripcion: `${emp.nombreCompleto}`,
                detalles: 'Empleado registrado con visa de turista. Situación migratoria irregular que requiere atención inmediata.',
                empleadoId: emp.id,
                categoria: 'criticas,migratorio'
            });
        }
        
        // Sin antecedentes verificados
        if (emp.antecedentesPenales === 'pendiente') {
            alertas.push({
                tipo: 'warning',
                icono: 'fas fa-hourglass-half',
                titulo: 'Antecedentes Pendientes',
                descripcion: `${emp.nombreCompleto}`,
                detalles: 'Verificación de antecedentes penales pendiente.',
                empleadoId: emp.id,
                categoria: 'todas'
            });
        }
    });
    
    // Configurar filtros de alertas
    document.querySelectorAll('.alerta-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.alerta-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filtro = btn.dataset.alerta;
            mostrarAlertasFiltradas(alertas, filtro);
        });
    });
    
    mostrarAlertasFiltradas(alertas, 'todas');
}

function mostrarAlertasFiltradas(alertas, filtro) {
    const alertasContainer = document.getElementById('alertas-list');
    
    let alertasFiltradas = alertas;
    if (filtro !== 'todas') {
        alertasFiltradas = alertas.filter(a => a.categoria.includes(filtro));
    }
    
    if (alertasFiltradas.length === 0) {
        alertasContainer.innerHTML = '<p class="empty-state"><i class="fas fa-check-circle"></i><br>No hay alertas en esta categoría.</p>';
        return;
    }
    
    alertasContainer.innerHTML = alertasFiltradas.map(a => `
        <div class="alerta-item ${a.tipo}">
            <i class="${a.icono}"></i>
            <div class="alerta-content" style="flex: 1;">
                <h4>${a.titulo}</h4>
                <p><strong>${a.descripcion}</strong></p>
                <p>${a.detalles}</p>
                <button class="btn btn-small btn-info" onclick="verPerfil(${a.empleadoId})">
                    <i class="fas fa-eye"></i> Ver Perfil
                </button>
            </div>
        </div>
    `).join('');
}

// ===== REPORTES =====

function generarReporte(tipo) {
    let filteredData = [];
    let nombreReporte = '';
    
    switch(tipo) {
        case 'general':
            filteredData = empleados;
            nombreReporte = 'Reporte General de Personal';
            break;
        case 'extranjeros':
            filteredData = empleados.filter(e => e.esExtranjero === 'si');
            nombreReporte = 'Reporte de Personal Extranjero';
            break;
        case 'antecedentes':
            filteredData = empleados.filter(e => e.antecedentesPenales === 'si');
            nombreReporte = 'Reporte de Personal con Antecedentes';
            break;
        case 'salud':
            filteredData = empleados.filter(e => e.problemasSalud && e.problemasSalud.trim() !== '');
            nombreReporte = 'Reporte de Problemas de Salud';
            break;
        case 'familias':
            filteredData = empleados.filter(e => e.integracionFamiliar && e.integracionFamiliar.trim() !== '');
            nombreReporte = 'Reporte de Composición Familiar';
            break;
        case 'educacion':
            filteredData = empleados;
            nombreReporte = 'Reporte de Nivel Educativo';
            break;
    }
    
    if (filteredData.length === 0) {
        alert('⚠️ No hay datos para generar este reporte.');
        return;
    }
    
    // Crear tabla HTML para el reporte
    let html = `
        <div style="font-family: Arial; padding: 20px;">
            <h1 style="color: #1a73e8;">${nombreReporte}</h1>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            <p><strong>Total de registros:</strong> ${filteredData.length}</p>
            <hr>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #ddd; padding: 8px;">Nombre</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">CUIL</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">Puesto</th>
                        ${tipo === 'extranjeros' ? '<th style="border: 1px solid #ddd; padding: 8px;">País</th><th style="border: 1px solid #ddd; padding: 8px;">Residencia</th>' : ''}
                        ${tipo === 'salud' ? '<th style="border: 1px solid #ddd; padding: 8px;">Problema de Salud</th>' : ''}
                        ${tipo === 'educacion' ? '<th style="border: 1px solid #ddd; padding: 8px;">Nivel Educativo</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(emp => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${emp.nombreCompleto}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${emp.cuil}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${emp.puesto || '-'}</td>
                            ${tipo === 'extranjeros' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.paisOrigen || '-'}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.tipoResidencia || '-'}</td>
                            ` : ''}
                            ${tipo === 'salud' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.problemasSalud || '-'}</td>
                            ` : ''}
                            ${tipo === 'educacion' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.nivelEducativo || '-'}</td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Abrir en nueva ventana para imprimir
    const ventana = window.open('', '_blank');
    ventana.document.write(html);
    ventana.document.close();
    
    alert('✅ Reporte generado. Use Ctrl+P para imprimir o guardar como PDF.');
}

function exportarExcel() {
    if (empleados.length === 0) {
        alert('⚠️ No hay datos para exportar.');
        return;
    }
    
    // Crear CSV
    let csv = 'Nombre,CUIL,Fecha Nacimiento,Puesto,Es Extranjero,País Origen,Tipo Residencia,Nivel Educativo,Antecedentes,Fecha Ingreso\n';
    
    empleados.forEach(emp => {
        csv += `"${emp.nombreCompleto}","${emp.cuil}","${emp.fechaNacimiento || ''}","${emp.puesto || ''}","${emp.esExtranjero}","${emp.paisOrigen || ''}","${emp.tipoResidencia || ''}","${emp.nivelEducativo || ''}","${emp.antecedentesPenales}","${emp.fechaIngreso || ''}"\n`;
    });
    
    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert('✅ Archivo exportado correctamente.');
}

// ===== FUNCIONES AUXILIARES PARA PERFIL ENTERPRISE =====

function activatePerfilTabs() {
    const tabs = document.querySelectorAll('.perfil-tab');
    const contents = document.querySelectorAll('.perfil-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Activar el seleccionado
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`perfil-tab-${tabName}`).classList.add('active');
        });
    });
}

function getEventoIcon(tipo) {
    const icons = {
        'Ingreso': '🚪',
        'Ascenso': '⬆️',
        'Aumento Salarial': '💰',
        'Capacitación': '📚',
        'Examen Médico': '🏥',
        'Documentación': '📄',
        'Sanción': '⚠️',
        'Reconocimiento': '🏆',
        'Licencia': '📅',
        'Baja': '❌'
    };
    return icons[tipo] || '📌';
}

function getEventoClass(tipo) {
    const classes = {
        'Ingreso': 'marker-success',
        'Ascenso': 'marker-info',
        'Aumento Salarial': 'marker-success',
        'Capacitación': 'marker-info',
        'Examen Médico': 'marker-warning',
        'Documentación': 'marker-info',
        'Sanción': 'marker-danger',
        'Reconocimiento': 'marker-success',
        'Licencia': 'marker-warning',
        'Baja': 'marker-danger'
    };
    return classes[tipo] || 'marker-default';
}

// ===== UTILIDADES =====

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function resetForm() {
    empleadoForm.reset();
}

// ===== BÚSQUEDA AVANZADA ENTERPRISE =====

let advancedFiltersActive = {};

function toggleAdvancedSearch() {
    const advSearch = document.getElementById('advanced-search');
    if (advSearch.style.display === 'none' || advSearch.style.display === '') {
        advSearch.style.display = 'block';
        populateFilterDropdowns();
    } else {
        advSearch.style.display = 'none';
    }
}

function populateFilterDropdowns() {
    // Poblar dropdown de puestos únicos
    const puestos = [...new Set(empleados.map(e => {
        const laboral = e.laboral || {};
        return laboral.puesto || e.puesto;
    }).filter(p => p))];
    
    const puestoSelect = document.getElementById('filter-puesto');
    puestoSelect.innerHTML = '<option value="">Todos los puestos</option>' +
        puestos.map(p => `<option value="${p}">${p}</option>`).join('');
}

function applyAdvancedFilters() {
    const filters = {
        puesto: document.getElementById('filter-puesto')?.value || '',
        area: document.getElementById('filter-area')?.value || '',
        nacionalidad: document.getElementById('filter-nacionalidad')?.value || '',
        educacion: document.getElementById('filter-educacion')?.value || '',
        salud: document.getElementById('filter-salud')?.value || '',
        estado: document.getElementById('filter-estado')?.value || '',
        salario: document.getElementById('filter-salario')?.value || '',
        antecedentes: document.getElementById('filter-antecedentes')?.value || '',
        edadMin: document.getElementById('filter-edad-min')?.value || '',
        edadMax: document.getElementById('filter-edad-max')?.value || '',
        antiguedad: document.getElementById('filter-antiguedad')?.value || '',
        familia: document.getElementById('filter-familia')?.value || '',
        documentos: document.getElementById('filter-documentos')?.value || ''
    };
    
    advancedFiltersActive = filters;
    
    let filtered = [...empleados];
    
    // Aplicar filtros
    if (filters.puesto) {
        filtered = filtered.filter(e => {
            const laboral = e.laboral || {};
            return (laboral.puesto || e.puesto) === filters.puesto;
        });
    }
    
    if (filters.area) {
        filtered = filtered.filter(e => {
            const laboral = e.laboral || {};
            return (laboral.area || e.area) === filters.area;
        });
    }
    
    if (filters.nacionalidad) {
        filtered = filtered.filter(e => {
            const dp = e.datosPersonales || {};
            return (dp.nacionalidad || e.paisOrigen) === filters.nacionalidad;
        });
    }
    
    if (filters.educacion) {
        filtered = filtered.filter(e => {
            const edu = e.educacion || {};
            const nivel = edu.nivelEducativo || e.nivelEducativo || '';
            return nivel.toLowerCase().includes(filters.educacion.toLowerCase());
        });
    }
    
    if (filters.salud === 'sin-problemas') {
        filtered = filtered.filter(e => {
            const salud = e.salud || {};
            const problemas = salud.problemasSalud || e.problemasSalud || '';
            return !problemas || problemas === 'Ninguno' || problemas === '';
        });
    } else if (filters.salud === 'con-problemas') {
        filtered = filtered.filter(e => {
            const salud = e.salud || {};
            const problemas = salud.problemasSalud || e.problemasSalud || '';
            return problemas && problemas !== 'Ninguno' && problemas !== '';
        });
    }
    
    // Filtro de estado activo/inactivo
    if (filters.estado) {
        filtered = filtered.filter(e => {
            const laboral = e.laboral || {};
            const estado = laboral.estado || e.estado || 'activo';
            return estado.toLowerCase() === filters.estado;
        });
    }
    
    // Filtro de rango de salario
    if (filters.salario) {
        filtered = filtered.filter(e => {
            const laboral = e.laboral || {};
            const salario = parseFloat(laboral.salario || e.salario || 0);
            
            if (filters.salario === '200000+') {
                return salario > 200000;
            }
            
            const [min, max] = filters.salario.split('-').map(v => parseFloat(v));
            return salario >= min && salario <= max;
        });
    }
    
    if (filters.antecedentes) {
        filtered = filtered.filter(e => {
            const ant = e.antecedentes || {};
            const tiene = ant.tieneAntecedentes || e.antecedentesPenales === 'si';
            return filters.antecedentes === 'si' ? tiene : !tiene;
        });
    }
    
    if (filters.edadMin || filters.edadMax) {
        filtered = filtered.filter(e => {
            const dp = e.datosPersonales || {};
            const edad = dp.edad || calcularEdad(e.fechaNacimiento || dp.fechaNacimiento);
            if (!edad) return true;
            if (filters.edadMin && edad < parseInt(filters.edadMin)) return false;
            if (filters.edadMax && edad > parseInt(filters.edadMax)) return false;
            return true;
        });
    }
    
    if (filters.antiguedad) {
        filtered = filtered.filter(e => {
            const laboral = e.laboral || {};
            const fechaIngreso = laboral.fechaIngreso || e.fechaIngreso;
            if (!fechaIngreso) return false;
            
            const años = calcularAntiguedad(fechaIngreso);
            const [min, max] = filters.antiguedad.split('-');
            
            if (filters.antiguedad === '5+') {
                return años >= 5;
            }
            return años >= parseInt(min) && años < parseInt(max);
        });
    }
    
    if (filters.familia) {
        filtered = filtered.filter(e => {
            const familiares = e.familiares || [];
            const tieneACargo = familiares.some(f => f.aCargo);
            return filters.familia === 'si' ? tieneACargo : !tieneACargo;
        });
    }
    
    if (filters.documentos) {
        filtered = filtered.filter(e => {
            const docs = e.documentos || [];
            if (filters.documentos === 'vigentes') {
                return docs.every(d => d.estado === 'Vigente');
            } else if (filters.documentos === 'por-vencer') {
                return docs.some(d => {
                    if (!d.fechaVencimiento) return false;
                    const diasRestantes = calcularDiasHastaVencimiento(d.fechaVencimiento);
                    return diasRestantes > 0 && diasRestantes <= 30;
                });
            } else if (filters.documentos === 'vencidos') {
                return docs.some(d => d.estado === 'Vencido' || calcularDiasHastaVencimiento(d.fechaVencimiento) < 0);
            }
            return true;
        });
    }
    
    displayEmpleados(filtered);
    updateActiveFiltersDisplay();
    updateFilterResults(filtered.length);
}

function calcularAntiguedad(fechaIngreso) {
    if (!fechaIngreso) return 0;
    const fecha = new Date(fechaIngreso);
    const ahora = new Date();
    const años = (ahora - fecha) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(años);
}

function calcularDiasHastaVencimiento(fechaVencimiento) {
    if (!fechaVencimiento) return 999;
    const fecha = new Date(fechaVencimiento);
    const ahora = new Date();
    const dias = (fecha - ahora) / (1000 * 60 * 60 * 24);
    return Math.floor(dias);
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('active-filters');
    const chips = [];
    
    Object.entries(advancedFiltersActive).forEach(([key, value]) => {
        if (value) {
            const labels = {
                puesto: 'Puesto',
                area: 'Área',
                nacionalidad: 'Nacionalidad',
                educacion: 'Educación',
                salud: 'Salud',
                antecedentes: 'Antecedentes',
                edadMin: 'Edad mín',
                edadMax: 'Edad máx',
                antiguedad: 'Antigüedad',
                familia: 'Familia',
                documentos: 'Documentos'
            };
            
            chips.push(`
                <div class="filter-chip">
                    <span>${labels[key]}: ${value}</span>
                    <i class="fas fa-times" onclick="removeFilter('${key}')"></i>
                </div>
            `);
        }
    });
    
    if (chips.length > 0) {
        container.style.display = 'flex';
        container.innerHTML = chips.join('');
    } else {
        container.style.display = 'none';
    }
}

function removeFilter(filterKey) {
    const elementId = `filter-${filterKey === 'edadMin' ? 'edad-min' : filterKey === 'edadMax' ? 'edad-max' : filterKey}`;
    const element = document.getElementById(elementId);
    if (element) {
        element.value = '';
    }
    applyAdvancedFilters();
}

function updateFilterResults(count) {
    const resultsDiv = document.getElementById('filter-results');
    resultsDiv.textContent = `${count} resultado${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

function clearAllFilters() {
    // Limpiar todos los selects e inputs
    document.getElementById('filter-puesto').value = '';
    document.getElementById('filter-area').value = '';
    document.getElementById('filter-nacionalidad').value = '';
    document.getElementById('filter-educacion').value = '';
    document.getElementById('filter-salud').value = '';
    document.getElementById('filter-antecedentes').value = '';
    document.getElementById('filter-edad-min').value = '';
    document.getElementById('filter-edad-max').value = '';
    document.getElementById('filter-antiguedad').value = '';
    document.getElementById('filter-familia').value = '';
    document.getElementById('filter-documentos').value = '';
    
    advancedFiltersActive = {};
    displayEmpleados(empleados);
    updateActiveFiltersDisplay();
    updateFilterResults(empleados.length);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    displayEmpleados(empleados);
}

// ===== SISTEMA DE NOTIFICACIONES INTELIGENTES =====

let notificaciones = [];
let notifFilter = 'all';

function generarNotificaciones() {
    notificaciones = [];
    const hoy = new Date();
    
    empleados.forEach(emp => {
        const datos = emp.datosPersonales || emp;
        const documentos = emp.documentos || [];
        const salud = emp.salud || {};
        const inmigracion = emp.inmigracion || {};
        
        // 1. Documentos vencidos o por vencer
        documentos.forEach(doc => {
            if (doc.fechaVencimiento) {
                const diasHasta = calcularDiasHastaVencimiento(doc.fechaVencimiento);
                
                if (diasHasta < 0) {
                    notificaciones.push({
                        id: `doc-venc-${emp.id}-${doc.tipo}`,
                        tipo: 'critical',
                        icono: 'fas fa-file-contract',
                        titulo: `Documento Vencido - ${datos.nombre} ${datos.apellido}`,
                        mensaje: `${doc.tipo}: Vencido hace ${Math.abs(diasHasta)} días`,
                        empleadoId: emp.id,
                        fecha: new Date(doc.fechaVencimiento),
                        leida: false
                    });
                } else if (diasHasta <= 7) {
                    notificaciones.push({
                        id: `doc-7d-${emp.id}-${doc.tipo}`,
                        tipo: 'critical',
                        icono: 'fas fa-exclamation-circle',
                        titulo: `Documento por Vencer (7 días) - ${datos.nombre} ${datos.apellido}`,
                        mensaje: `${doc.tipo}: Vence en ${diasHasta} días`,
                        empleadoId: emp.id,
                        fecha: new Date(doc.fechaVencimiento),
                        leida: false
                    });
                } else if (diasHasta <= 15) {
                    notificaciones.push({
                        id: `doc-15d-${emp.id}-${doc.tipo}`,
                        tipo: 'warning',
                        icono: 'fas fa-exclamation-triangle',
                        titulo: `Documento por Vencer (15 días) - ${datos.nombre} ${datos.apellido}`,
                        mensaje: `${doc.tipo}: Vence en ${diasHasta} días`,
                        empleadoId: emp.id,
                        fecha: new Date(doc.fechaVencimiento),
                        leida: false
                    });
                } else if (diasHasta <= 30) {
                    notificaciones.push({
                        id: `doc-30d-${emp.id}-${doc.tipo}`,
                        tipo: 'info',
                        icono: 'fas fa-info-circle',
                        titulo: `Documento por Vencer (30 días) - ${datos.nombre} ${datos.apellido}`,
                        mensaje: `${doc.tipo}: Vence en ${diasHasta} días`,
                        empleadoId: emp.id,
                        fecha: new Date(doc.fechaVencimiento),
                        leida: false
                    });
                }
            }
        });
        
        // 2. Exámenes médicos vencidos
        if (salud.ultimoExamen) {
            const fechaExamen = new Date(salud.ultimoExamen);
            const mesesDesde = Math.floor((hoy - fechaExamen) / (1000 * 60 * 60 * 24 * 30));
            
            if (mesesDesde > 12) {
                notificaciones.push({
                    id: `salud-${emp.id}`,
                    tipo: 'warning',
                    icono: 'fas fa-heartbeat',
                    titulo: `Examen Médico Vencido - ${datos.nombre} ${datos.apellido}`,
                    mensaje: `Último examen hace ${mesesDesde} meses. Renovar control médico`,
                    empleadoId: emp.id,
                    fecha: fechaExamen,
                    leida: false
                });
            }
        }
        
        // 3. Problemas de salud activos
        if (salud.problemasSalud === 'si' && salud.descripcionProblemas) {
            notificaciones.push({
                id: `salud-prob-${emp.id}`,
                tipo: 'info',
                icono: 'fas fa-notes-medical',
                titulo: `Empleado con Problemas de Salud - ${datos.nombre} ${datos.apellido}`,
                mensaje: salud.descripcionProblemas,
                empleadoId: emp.id,
                fecha: hoy,
                leida: false
            });
        }
        
        // 4. Residencia por vencer (extranjeros)
        if (datos.nacionalidad && datos.nacionalidad !== 'Argentina' && inmigracion.residenciaVencimiento) {
            const diasHasta = calcularDiasHastaVencimiento(inmigracion.residenciaVencimiento);
            
            if (diasHasta < 0) {
                notificaciones.push({
                    id: `res-venc-${emp.id}`,
                    tipo: 'critical',
                    icono: 'fas fa-passport',
                    titulo: `Residencia Vencida - ${datos.nombre} ${datos.apellido}`,
                    mensaje: `Residencia vencida hace ${Math.abs(diasHasta)} días. URGENTE renovar`,
                    empleadoId: emp.id,
                    fecha: new Date(inmigracion.residenciaVencimiento),
                    leida: false
                });
            } else if (diasHasta <= 30) {
                notificaciones.push({
                    id: `res-30d-${emp.id}`,
                    tipo: 'critical',
                    icono: 'fas fa-passport',
                    titulo: `Residencia por Vencer - ${datos.nombre} ${datos.apellido}`,
                    mensaje: `Residencia vence en ${diasHasta} días`,
                    empleadoId: emp.id,
                    fecha: new Date(inmigracion.residenciaVencimiento),
                    leida: false
                });
            }
        }
        
        // 5. Cumpleaños próximos (7 días)
        if (datos.fechaNacimiento) {
            const cumple = new Date(datos.fechaNacimiento);
            const cumpleEsteAno = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());
            const diasHastaCumple = Math.ceil((cumpleEsteAno - hoy) / (1000 * 60 * 60 * 24));
            
            if (diasHastaCumple >= 0 && diasHastaCumple <= 7) {
                notificaciones.push({
                    id: `cumple-${emp.id}`,
                    tipo: 'info',
                    icono: 'fas fa-birthday-cake',
                    titulo: `Cumpleaños Próximo - ${datos.nombre} ${datos.apellido}`,
                    mensaje: `Cumpleaños en ${diasHastaCumple} día${diasHastaCumple !== 1 ? 's' : ''}`,
                    empleadoId: emp.id,
                    fecha: cumpleEsteAno,
                    leida: false
                });
            }
        }
        
        // 6. Aniversario laboral próximo
        if (emp.laboral && emp.laboral.fechaIngreso) {
            const ingreso = new Date(emp.laboral.fechaIngreso);
            const aniversario = new Date(hoy.getFullYear(), ingreso.getMonth(), ingreso.getDate());
            const diasHastaAniv = Math.ceil((aniversario - hoy) / (1000 * 60 * 60 * 24));
            const anos = hoy.getFullYear() - ingreso.getFullYear();
            
            if (diasHastaAniv >= 0 && diasHastaAniv <= 7 && anos > 0) {
                notificaciones.push({
                    id: `aniv-${emp.id}`,
                    tipo: 'info',
                    icono: 'fas fa-award',
                    titulo: `Aniversario Laboral - ${datos.nombre} ${datos.apellido}`,
                    mensaje: `${anos} año${anos !== 1 ? 's' : ''} en la empresa (en ${diasHastaAniv} días)`,
                    empleadoId: emp.id,
                    fecha: aniversario,
                    leida: false
                });
            }
        }
    });
    
    // Ordenar por fecha (más urgentes primero)
    notificaciones.sort((a, b) => a.fecha - b.fecha);
    
    actualizarBadgeNotificaciones();
    mostrarNotificaciones();
}

function actualizarBadgeNotificaciones() {
    const badge = document.getElementById('notif-badge');
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    
    if (noLeidas > 0) {
        badge.textContent = noLeidas;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
    
    // Actualizar contadores por tipo
    const critical = notificaciones.filter(n => n.tipo === 'critical').length;
    const warning = notificaciones.filter(n => n.tipo === 'warning').length;
    const info = notificaciones.filter(n => n.tipo === 'info').length;
    
    const criticalCount = document.getElementById('notif-critical-count');
    const warningCount = document.getElementById('notif-warning-count');
    const infoCount = document.getElementById('notif-info-count');
    
    if (criticalCount) criticalCount.textContent = critical;
    if (warningCount) warningCount.textContent = warning;
    if (infoCount) infoCount.textContent = info;
}

function mostrarNotificaciones() {
    const lista = document.getElementById('notificaciones-list');
    if (!lista) return;
    
    const notifFiltradas = notifFilter === 'all' 
        ? notificaciones 
        : notificaciones.filter(n => n.tipo === notifFilter);
    
    if (notifFiltradas.length === 0) {
        lista.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No hay notificaciones ${notifFilter !== 'all' ? 'de este tipo' : ''}</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = notifFiltradas.map(n => `
        <div class="notif-item ${n.tipo} ${n.leida ? 'leida' : ''}" onclick="verEmpleadoDesdeNotif('${n.empleadoId}')">
            <div class="notif-icon">
                <i class="${n.icono}"></i>
            </div>
            <div class="notif-content">
                <h4>${n.titulo}</h4>
                <p>${n.mensaje}</p>
                <small>${formatearFecha(n.fecha)}</small>
            </div>
            <button class="notif-mark-read" onclick="event.stopPropagation(); marcarLeida('${n.id}')">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `).join('');
}

function filtrarNotificaciones(tipo) {
    notifFilter = tipo;
    
    // Actualizar botones
    document.querySelectorAll('.notif-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === tipo);
    });
    
    mostrarNotificaciones();
}

function marcarLeida(notifId) {
    const notif = notificaciones.find(n => n.id === notifId);
    if (notif) {
        notif.leida = true;
        actualizarBadgeNotificaciones();
        mostrarNotificaciones();
    }
}

function marcarTodasLeidas() {
    notificaciones.forEach(n => n.leida = true);
    actualizarBadgeNotificaciones();
    mostrarNotificaciones();
}

function actualizarNotificaciones() {
    generarNotificaciones();
}

function verEmpleadoDesdeNotif(empleadoId) {
    const emp = empleados.find(e => e.id == empleadoId);
    if (emp) {
        viewProfile(emp);
    }
}

function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fecha.toLocaleDateString('es-AR', opciones);
}

// ===== EXPORTACIÓN PDF PROFESIONAL =====

async function exportarAPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;
        
        // Logo y encabezado
        doc.setFillColor(76, 175, 80);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('🌱 Sistema RRHH', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Empresas Hortícolas', pageWidth / 2, 25, { align: 'center' });
        
        // Fecha de generación
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        yPos = 45;
        doc.text(`Reporte generado: ${new Date().toLocaleDateString('es-AR')}`, 15, yPos);
        doc.text(`Total empleados: ${empleados.length}`, pageWidth - 15, yPos, { align: 'right' });
        
        yPos += 10;
        
        // Tabla de empleados
        const tableData = empleados.map(emp => {
            const datos = emp.datosPersonales || emp;
            const edad = calcularEdad(datos.fechaNacimiento);
            const antiguedad = emp.laboral ? calcularAntiguedad(emp.laboral.fechaIngreso) : 0;
            
            return [
                datos.nombre + ' ' + datos.apellido,
                datos.dni || datos.cuil || '-',
                datos.nacionalidad || '-',
                `${edad} años`,
                emp.laboral?.puesto || '-',
                `${antiguedad} años`,
                datos.estadoCivil || '-'
            ];
        });
        
        doc.autoTable({
            startY: yPos,
            head: [['Nombre', 'DNI/CUIL', 'Nacionalidad', 'Edad', 'Puesto', 'Antigüedad', 'Estado Civil']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 15, right: 15 }
        });
        
        // Pie de página
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Página ${i} de ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }
        
        // Guardar
        doc.save(`empleados_${new Date().toISOString().split('T')[0]}.pdf`);
        
        alert('✅ PDF exportado exitosamente');
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('❌ Error al exportar PDF: ' + error.message);
    }
}

// Agregar función para calcular edad
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// ===== EXPORTACIÓN EXCEL MEJORADA CON MÚLTIPLES HOJAS =====

function exportarAExcelMejorado() {
    try {
        if (empleados.length === 0) {
            alert('⚠️ No hay empleados para exportar');
            return;
        }

        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // ===== HOJA 1: RESUMEN EJECUTIVO =====
        const resumenData = [
            ['SISTEMA RRHH - EMPRESAS HORTÍCOLAS'],
            ['Reporte Generado:', new Date().toLocaleDateString('es-AR')],
            [''],
            ['RESUMEN GENERAL'],
            ['Total Empleados:', empleados.length],
            ['Extranjeros:', empleados.filter(e => (e.datosPersonales?.nacionalidad || e.nacionalidad) !== 'Argentina').length],
            ['Con Antecedentes:', empleados.filter(e => e.antecedentes?.tieneAntecedentes === 'si').length],
            ['Con Problemas de Salud:', empleados.filter(e => (e.salud?.problemasSalud || e.salud) === 'si').length],
            ['Total Familiares:', empleados.reduce((sum, e) => sum + (e.familiares?.length || 0), 0)],
            ['Menores a Cargo:', empleados.reduce((sum, e) => {
                return sum + (e.familiares?.filter(f => {
                    if (!f.fechaNacimiento) return false;
                    const edad = calcularEdad(f.fechaNacimiento);
                    return edad < 18 && f.aCargo;
                }).length || 0);
            }, 0)],
            [''],
            ['DISTRIBUCIÓN POR ÁREA'],
        ];

        // Agregar distribución por área
        const areaCount = {};
        empleados.forEach(e => {
            const area = e.laboral?.area || 'Sin área';
            areaCount[area] = (areaCount[area] || 0) + 1;
        });
        Object.entries(areaCount).forEach(([area, count]) => {
            resumenData.push([area, count]);
        });

        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        
        // Aplicar estilos al resumen
        wsResumen['!cols'] = [{ width: 30 }, { width: 20 }];
        
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

        // ===== HOJA 2: EMPLEADOS - DATOS PERSONALES =====
        const empleadosData = empleados.map(emp => {
            const datos = emp.datosPersonales || emp;
            const edad = calcularEdad(datos.fechaNacimiento);
            const antiguedad = emp.laboral ? calcularAntiguedad(emp.laboral.fechaIngreso) : 0;
            
            return {
                'ID': emp.id,
                'Nombre Completo': `${datos.nombre} ${datos.apellido}`,
                'DNI': datos.dni || '-',
                'CUIL': datos.cuil || '-',
                'Fecha Nacimiento': datos.fechaNacimiento || '-',
                'Edad': edad,
                'Nacionalidad': datos.nacionalidad || '-',
                'País Nacimiento': datos.paisNacimiento || '-',
                'Estado Civil': datos.estadoCivil || '-',
                'Género': datos.genero || '-',
                'Teléfono': emp.contacto?.telefono || '-',
                'Email': emp.contacto?.email || '-',
                'Dirección': emp.direccion ? `${emp.direccion.calle}, ${emp.direccion.ciudad}` : '-',
                'Provincia': emp.direccion?.provincia || '-',
                'CP': emp.direccion?.codigoPostal || '-',
                'Puesto': emp.laboral?.puesto || '-',
                'Área': emp.laboral?.area || '-',
                'Fecha Ingreso': emp.laboral?.fechaIngreso || '-',
                'Antigüedad (años)': antiguedad,
                'Tipo Contrato': emp.laboral?.tipoContrato || '-',
                'Salario': emp.laboral?.salario || '-'
            };
        });

        const wsEmpleados = XLSX.utils.json_to_sheet(empleadosData);
        
        // Anchos de columna
        wsEmpleados['!cols'] = [
            { width: 8 }, { width: 25 }, { width: 12 }, { width: 15 }, { width: 15 },
            { width: 8 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 10 },
            { width: 15 }, { width: 25 }, { width: 30 }, { width: 15 }, { width: 8 },
            { width: 20 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 15 },
            { width: 12 }
        ];
        
        XLSX.utils.book_append_sheet(wb, wsEmpleados, 'Empleados');

        // ===== HOJA 3: FAMILIARES =====
        const familiaresData = [];
        empleados.forEach(emp => {
            const datos = emp.datosPersonales || emp;
            if (emp.familiares && emp.familiares.length > 0) {
                emp.familiares.forEach(fam => {
                    const edadFam = calcularEdad(fam.fechaNacimiento);
                    familiaresData.push({
                        'Empleado': `${datos.nombre} ${datos.apellido}`,
                        'DNI Empleado': datos.dni || '-',
                        'Familiar': `${fam.nombre} ${fam.apellido}`,
                        'Relación': fam.relacion,
                        'DNI Familiar': fam.dni || '-',
                        'CUIL Familiar': fam.cuil || '-',
                        'Fecha Nacimiento': fam.fechaNacimiento || '-',
                        'Edad': edadFam,
                        'A Cargo': fam.aCargo ? 'SÍ' : 'NO',
                        'Menor': edadFam < 18 ? 'SÍ' : 'NO'
                    });
                });
            }
        });

        if (familiaresData.length > 0) {
            const wsFamiliares = XLSX.utils.json_to_sheet(familiaresData);
            wsFamiliares['!cols'] = [
                { width: 25 }, { width: 12 }, { width: 25 }, { width: 12 },
                { width: 12 }, { width: 15 }, { width: 15 }, { width: 8 },
                { width: 10 }, { width: 10 }
            ];
            XLSX.utils.book_append_sheet(wb, wsFamiliares, 'Familiares');
        }

        // ===== HOJA 4: DOCUMENTOS =====
        const documentosData = [];
        empleados.forEach(emp => {
            const datos = emp.datosPersonales || emp;
            if (emp.documentos && emp.documentos.length > 0) {
                emp.documentos.forEach(doc => {
                    const diasVenc = doc.fechaVencimiento ? calcularDiasHastaVencimiento(doc.fechaVencimiento) : null;
                    let estado = '-';
                    if (diasVenc !== null) {
                        if (diasVenc < 0) estado = '🔴 VENCIDO';
                        else if (diasVenc <= 7) estado = '🔴 VENCE EN 7 DÍAS';
                        else if (diasVenc <= 15) estado = '🟡 VENCE EN 15 DÍAS';
                        else if (diasVenc <= 30) estado = '🟢 VENCE EN 30 DÍAS';
                        else estado = '✅ VIGENTE';
                    }

                    documentosData.push({
                        'Empleado': `${datos.nombre} ${datos.apellido}`,
                        'DNI Empleado': datos.dni || '-',
                        'Tipo Documento': doc.tipo,
                        'Número': doc.numero || '-',
                        'Fecha Vencimiento': doc.fechaVencimiento || 'Sin vencimiento',
                        'Días Hasta Venc.': diasVenc !== null ? diasVenc : '-',
                        'Estado': estado
                    });
                });
            }
        });

        if (documentosData.length > 0) {
            const wsDocumentos = XLSX.utils.json_to_sheet(documentosData);
            wsDocumentos['!cols'] = [
                { width: 25 }, { width: 12 }, { width: 25 }, { width: 15 },
                { width: 18 }, { width: 15 }, { width: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, wsDocumentos, 'Documentos');
        }

        // ===== HOJA 5: SALUD =====
        const saludData = empleados.map(emp => {
            const datos = emp.datosPersonales || emp;
            const salud = emp.salud || {};
            
            return {
                'Empleado': `${datos.nombre} ${datos.apellido}`,
                'DNI': datos.dni || '-',
                'Grupo Sanguíneo': salud.grupoSanguineo || '-',
                'Problemas de Salud': salud.problemasSalud === 'si' ? 'SÍ' : 'NO',
                'Descripción': salud.descripcionProblemas || '-',
                'Discapacidad': salud.discapacidad === 'si' ? 'SÍ' : 'NO',
                'Tipo Discapacidad': salud.tipoDiscapacidad || '-',
                'Requiere Adaptación': salud.requiereAdaptacion === 'si' ? 'SÍ' : 'NO',
                'Último Examen': salud.ultimoExamen || '-',
                'Aptitud Física': salud.aptitudFisica || '-'
            };
        });

        const wsSalud = XLSX.utils.json_to_sheet(saludData);
        wsSalud['!cols'] = [
            { width: 25 }, { width: 12 }, { width: 15 }, { width: 18 },
            { width: 40 }, { width: 12 }, { width: 20 }, { width: 18 },
            { width: 15 }, { width: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsSalud, 'Salud');

        // ===== HOJA 6: EDUCACIÓN =====
        const educacionData = empleados.map(emp => {
            const datos = emp.datosPersonales || emp;
            const edu = emp.educacion || {};
            
            return {
                'Empleado': `${datos.nombre} ${datos.apellido}`,
                'DNI': datos.dni || '-',
                'Nivel Máximo': edu.nivelMaximo || '-',
                'Institución': edu.institucion || '-',
                'Título': edu.tituloObtenido || '-',
                'Año Egreso': edu.añoEgreso || '-',
                'Cursos Adicionales': (edu.cursosAdicionales || []).join(', ') || '-'
            };
        });

        const wsEducacion = XLSX.utils.json_to_sheet(educacionData);
        wsEducacion['!cols'] = [
            { width: 25 }, { width: 12 }, { width: 20 }, { width: 30 },
            { width: 25 }, { width: 12 }, { width: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, wsEducacion, 'Educación');

        // ===== HOJA 7: INMIGRACIÓN (Solo extranjeros) =====
        const inmigracionData = [];
        empleados.forEach(emp => {
            const datos = emp.datosPersonales || emp;
            if (datos.nacionalidad && datos.nacionalidad !== 'Argentina') {
                const inm = emp.inmigracion || {};
                const diasVenc = inm.residenciaVencimiento ? calcularDiasHastaVencimiento(inm.residenciaVencimiento) : null;
                let estadoRes = '-';
                if (diasVenc !== null) {
                    if (diasVenc < 0) estadoRes = '🔴 VENCIDA';
                    else if (diasVenc <= 30) estadoRes = '🟡 POR VENCER';
                    else estadoRes = '✅ VIGENTE';
                }

                inmigracionData.push({
                    'Empleado': `${datos.nombre} ${datos.apellido}`,
                    'Nacionalidad': datos.nacionalidad,
                    'País Origen': inm.paisOrigen || '-',
                    'Tipo Residencia': inm.tipoResidencia || '-',
                    'N° Residencia': inm.numeroResidencia || '-',
                    'Vencimiento': inm.residenciaVencimiento || '-',
                    'Días Hasta Venc.': diasVenc !== null ? diasVenc : '-',
                    'Estado': estadoRes,
                    'Fecha Ingreso': inm.fechaIngreso || '-'
                });
            }
        });

        if (inmigracionData.length > 0) {
            const wsInmigracion = XLSX.utils.json_to_sheet(inmigracionData);
            wsInmigracion['!cols'] = [
                { width: 25 }, { width: 15 }, { width: 15 }, { width: 18 },
                { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
                { width: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, wsInmigracion, 'Inmigración');
        }

        // Guardar archivo
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `RRHH_Completo_${fecha}.xlsx`);
        
        alert(`✅ Excel exportado exitosamente\n\n📊 Hojas incluidas:\n- Resumen Ejecutivo\n- Empleados (${empleados.length})\n- Familiares (${familiaresData.length})\n- Documentos (${documentosData.length})\n- Salud\n- Educación${inmigracionData.length > 0 ? '\n- Inmigración (' + inmigracionData.length + ')' : ''}`);
        
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        alert('❌ Error al exportar Excel: ' + error.message);
    }
}

// ===== VALIDACIÓN EN TIEMPO REAL =====
document.addEventListener('DOMContentLoaded', function() {
    // Validación en tiempo real para CUIL
    const cuilInput = document.getElementById('cuil');
    if (cuilInput) {
        cuilInput.addEventListener('blur', function() {
            const cuil = this.value.trim();
            if (cuil) {
                const validacion = validarCUIL(cuil);
                if (!validacion.valido) {
                    mostrarErrorCampo('cuil', validacion.mensaje);
                } else {
                    limpiarErrorCampo('cuil');
                }
            }
        });
        
        // Auto-formato CUIL mientras escribe
        cuilInput.addEventListener('input', function(e) {
            let valor = this.value.replace(/\D/g, ''); // Solo números
            if (valor.length > 2 && valor.length <= 10) {
                valor = valor.slice(0, 2) + '-' + valor.slice(2);
            }
            if (valor.length > 11) {
                valor = valor.slice(0, 11) + '-' + valor.slice(11, 12);
            }
            if (valor !== this.value) {
                this.value = valor;
            }
        });
    }
    
    // Validación para nombre
    const nombreInput = document.getElementById('nombreCompleto');
    if (nombreInput) {
        nombreInput.addEventListener('blur', function() {
            const nombre = this.value.trim();
            if (!nombre || nombre.length < 3) {
                mostrarErrorCampo('nombreCompleto', 'El nombre debe tener al menos 3 caracteres');
            } else {
                limpiarErrorCampo('nombreCompleto');
            }
        });
    }
    
    // Validación para fecha de nacimiento
    const fechaNacInput = document.getElementById('fechaNacimiento');
    if (fechaNacInput) {
        fechaNacInput.addEventListener('blur', function() {
            const fecha = this.value;
            const validacion = validarFecha(fecha, 'Fecha de Nacimiento');
            if (!validacion.valido) {
                mostrarErrorCampo('fechaNacimiento', validacion.mensaje);
            } else {
                limpiarErrorCampo('fechaNacimiento');
            }
        });
    }
});

// ===== BACKUP Y RECUPERACIÓN =====

function exportarBackup() {
    try {
        const backup = {
            version: '1.0',
            fecha: new Date().toISOString(),
            usuario: currentUser?.nombre || 'Desconocido',
            datos: {
                empleados: empleados,
                tickets: tickets,
                configuracion: {
                    paginacion: itemsPerPage,
                    ordenamiento: currentSort
                }
            }
        };
        
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_rrhh_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`✅ Backup exportado correctamente\n\n📦 Contenido:\n- ${empleados.length} empleados\n- ${tickets.length} tickets\n- Configuración del sistema`);
    } catch (error) {
        console.error('Error al exportar backup:', error);
        alert('❌ Error al exportar backup: ' + error.message);
    }
}

function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('⚠️ ADVERTENCIA: Importar un backup sobrescribirá todos los datos actuales.\n\n¿Desea continuar?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validar estructura del backup
            if (!backup.version || !backup.datos || !backup.datos.empleados) {
                throw new Error('Archivo de backup inválido o corrupto');
            }
            
            // Confirmar detalles del backup
            const mensaje = `📦 Información del Backup:\n\n` +
                          `Versión: ${backup.version}\n` +
                          `Fecha: ${new Date(backup.fecha).toLocaleString()}\n` +
                          `Usuario: ${backup.usuario}\n` +
                          `Empleados: ${backup.datos.empleados.length}\n` +
                          `Tickets: ${backup.datos.tickets?.length || 0}\n\n` +
                          `¿Confirma la importación?`;
            
            if (!confirm(mensaje)) {
                event.target.value = '';
                return;
            }
            
            // Importar empleados
            for (const empleado of backup.datos.empleados) {
                await fetch(`${API_URL}/empleados`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(empleado)
                });
            }
            
            // Importar tickets si existen
            if (backup.datos.tickets && backup.datos.tickets.length > 0) {
                for (const ticket of backup.datos.tickets) {
                    await fetch(`${API_URL}/tickets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ticket)
                    });
                }
            }
            
            // Aplicar configuración si existe
            if (backup.datos.configuracion) {
                if (backup.datos.configuracion.paginacion) {
                    itemsPerPage = backup.datos.configuracion.paginacion;
                    document.getElementById('items-per-page').value = itemsPerPage;
                }
            }
            
            alert(`✅ Backup importado correctamente\n\n📥 Datos restaurados:\n- ${backup.datos.empleados.length} empleados\n- ${backup.datos.tickets?.length || 0} tickets`);
            
            // Recargar datos
            await loadEmpleados();
            await loadTickets();
            
            // Limpiar input file
            event.target.value = '';
            
        } catch (error) {
            console.error('Error al importar backup:', error);
            alert('❌ Error al importar backup: ' + error.message);
            event.target.value = '';
        }
    };
    
    reader.onerror = function() {
        alert('❌ Error al leer el archivo');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Inicializar
showLoginScreen();
            const fecha = this.value;
            const validacion = validarFecha(fecha, 'Fecha de Nacimiento');
            if (!validacion.valido) {
                mostrarErrorCampo('fechaNacimiento', validacion.mensaje);
            } else {
                limpiarErrorCampo('fechaNacimiento');
            }
        });
    }
});

// Inicializar
showLoginScreen();

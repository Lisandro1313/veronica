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

// Tema
let darkMode = localStorage.getItem('darkMode') === 'true';

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

// API Base URL - Detecta automáticamente si está en local o producción
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// ===== MENÚ HAMBURGUESA MÓVIL =====

const hamburgerBtn = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Toggle del menú
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });
}

// Cerrar menú al hacer clic en el overlay
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
}

// ===== NAVEGACIÓN SIDEBAR =====

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Cerrar el menú en móvil después de seleccionar una opción
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }

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
    // 📊 EXPLICACIÓN DE CÁLCULOS DEL DASHBOARD:
    
    // 1. EXTRANJEROS: Cuenta empleados con campo "esExtranjero" = "si"
    const extranjeros = empleados.filter(e => e.esExtranjero === 'si').length;
    
    // 2. CON ANTECEDENTES: Cuenta empleados con campo "antecedentesPenales" = "si"
    const conAntecedentes = empleados.filter(e => e.antecedentesPenales === 'si').length;
    
    // 3. CON PROBLEMAS DE SALUD: Cuenta empleados que tienen texto en campo "problemasSalud"
    const conProblemasSalud = empleados.filter(e => e.problemasSalud && e.problemasSalud.trim() !== '').length;

    // 4. MENORES EN FAMILIAS: Busca números seguidos de palabras como "hijo", "hija", "menor", "niño"
    //    en el campo "integracionFamiliar" y suma los números encontrados
    //    Ejemplo: "2 hijos menores" → suma 2 al contador
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

    // 5. DE VIAJE: Cuenta tickets de tipo "vacaciones" creados en los últimos 30 días
    //    NOTA: Depende de la variable global "tickets" cargada previamente
    const deViaje = tickets.filter(t =>
        t.tipo === 'vacaciones' &&
        new Date(t.fecha) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
        total: empleados.length,              // Total de empleados en la base de datos
        extranjeros,                          // Empleados extranjeros
        conAntecedentes,                      // Empleados con antecedentes penales
        menores: menoresEstimados,            // Total estimado de menores en familias
        conProblemasSalud,                    // Empleados con problemas de salud registrados
        deViaje,                              // Empleados actualmente de vacaciones
        sueldoPromedio: calcularSueldoPromedio(empleados)  // Sueldo promedio de los empleados
    };
}

function mostrarKPIs(kpis) {
    document.getElementById('kpi-total').textContent = kpis.total;
    document.getElementById('kpi-extranjeros').textContent = kpis.extranjeros;
    document.getElementById('kpi-antecedentes').textContent = kpis.conAntecedentes;
    document.getElementById('kpi-menores').textContent = kpis.menores;
    document.getElementById('kpi-salud').textContent = kpis.conProblemasSalud;
    document.getElementById('kpi-viaje').textContent = kpis.deViaje;
    
    // Mostrar sueldo promedio formateado
    const sueldoElement = document.getElementById('kpi-sueldo-promedio');
    if (sueldoElement) {
        sueldoElement.textContent = kpis.sueldoPromedio > 0 
            ? `$${kpis.sueldoPromedio.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
            : '$0';
    }

    // Calcular y mostrar métricas avanzadas
    calcularMetricasAvanzadas();

    // Calcular y mostrar tendencias
    calcularTendencias();
}

function calcularSueldoPromedio(empleados) {
    if (!empleados || empleados.length === 0) return 0;
    
    const empleadosConSueldo = empleados.filter(e => e.sueldo && parseFloat(e.sueldo) > 0);
    
    if (empleadosConSueldo.length === 0) return 0;
    
    const totalSueldos = empleadosConSueldo.reduce((sum, e) => sum + parseFloat(e.sueldo), 0);
    return Math.round(totalSueldos / empleadosConSueldo.length);
}

function calcularMetricasAvanzadas() {
    if (empleados.length === 0) return;

    // 📈 MÉTRICAS AVANZADAS DEL DASHBOARD:

    // 1. EDAD PROMEDIO: Calcula la edad de cada empleado usando su fechaNacimiento
    //    y luego saca el promedio. Usa la función calcularEdad() definida más abajo.
    const edades = empleados.map(e => {
        return calcularEdad(e.fecha_nacimiento);
    }).filter(edad => edad > 0);

    const edadPromedio = edades.length > 0
        ? (edades.reduce((sum, edad) => sum + edad, 0) / edades.length).toFixed(1)
        : 0;

    document.getElementById('kpi-edad-promedio').textContent = `${edadPromedio} años`;

    // 2. ANTIGÜEDAD PROMEDIO: Calcula años trabajando desde la fecha_ingreso/fechaIngreso
    //    hasta hoy usando la función calcularAntiguedad()
    const antiguedades = empleados
        .filter(e => e.fecha_ingreso)
        .map(e => calcularAntiguedad(e.fecha_ingreso));

    const antiguedadPromedio = antiguedades.length > 0
        ? (antiguedades.reduce((sum, ant) => sum + ant, 0) / antiguedades.length).toFixed(1)
        : 0;

    document.getElementById('kpi-antiguedad-promedio').textContent = `${antiguedadPromedio} años`;

    // 3. SALARIO PROMEDIO: Suma todos los salarios y divide por cantidad de empleados con salario
    const salarios = empleados
        .filter(e => e.salario)
        .map(e => parseFloat(e.salario) || 0);

    const salarioPromedio = salarios.length > 0
        ? Math.round(salarios.reduce((sum, sal) => sum + sal, 0) / salarios.length)
        : 0;

    document.getElementById('kpi-salario-promedio').textContent =
        `$${salarioPromedio.toLocaleString('es-AR')}`;

    // 4. COSTO LABORAL TOTAL: Suma de todos los salarios de todos los empleados
    const costoTotal = salarios.reduce((sum, sal) => sum + sal, 0);
    document.getElementById('kpi-costo-total').textContent =
        `$${costoTotal.toLocaleString('es-AR')}`;

    // 5. ÁREA CON MÁS PERSONAL: Cuenta empleados por área y muestra la que tiene más
    const areaCount = {};
    empleados.forEach(e => {
        const area = e.area;
        if (area) {
            areaCount[area] = (areaCount[area] || 0) + 1;
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

    // 6. EDUCACIÓN SUPERIOR: Porcentaje de empleados con nivel educativo "universitario" o "terciario"
    const conEstudiosSuperiores = empleados.filter(e => {
        const nivel = e.nivel_educativo || e.nivelEducativo || '';
        return nivel.toLowerCase().includes('universitario') ||
            nivel.toLowerCase().includes('terciario');
    }).length;

    const porcentajeSuperiores = empleados.length > 0
        ? ((conEstudiosSuperiores / empleados.length) * 100).toFixed(0)
        : 0;

    document.getElementById('kpi-educacion-alta').textContent = `${porcentajeSuperiores}%`;
}

function calcularTendencias() {
    if (empleados.length === 0) return;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    // Calcular mes anterior
    const fechaMesAnterior = new Date(añoActual, mesActual - 1, 1);
    const mesAnterior = fechaMesAnterior.getMonth();
    const añoMesAnterior = fechaMesAnterior.getFullYear();

    // Filtrar empleados del mes actual
    const empleadosMesActual = empleados.filter(e => {
        const fechaIng = e.fecha_ingreso || e.fechaIngreso;
        if (!fechaIng) return false;
        const fecha = new Date(fechaIng);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    // Filtrar empleados del mes anterior
    const empleadosMesAnterior = empleados.filter(e => {
        const fechaIng = e.fecha_ingreso || e.fechaIngreso;
        if (!fechaIng) return false;
        const fecha = new Date(fechaIng);
        return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoMesAnterior;
    });

    // 1. Nuevos Ingresos
    const ingresosMesActual = empleadosMesActual.length;
    const ingresosMesAnterior = empleadosMesAnterior.length;
    const cambioIngresos = ingresosMesActual - ingresosMesAnterior;
    const porcentajeIngresos = ingresosMesAnterior > 0
        ? ((cambioIngresos / ingresosMesAnterior) * 100).toFixed(0)
        : 0;

    document.getElementById('tend-ingresos').textContent = ingresosMesActual;
    actualizarIndicadorCambio('tend-ingresos-change', cambioIngresos, porcentajeIngresos, true);

    // 2. Bajas (simuladas con tickets de baja si existen)
    const bajasMesActual = tickets.filter(t => {
        if (!t.tipo || t.tipo !== 'baja') return false;
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    }).length;

    const bajasMesAnterior = tickets.filter(t => {
        if (!t.tipo || t.tipo !== 'baja') return false;
        const fecha = new Date(t.fecha);
        return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoMesAnterior;
    }).length;

    const cambioBajas = bajasMesActual - bajasMesAnterior;
    const porcentajeBajas = bajasMesAnterior > 0
        ? ((cambioBajas / bajasMesAnterior) * 100).toFixed(0)
        : 0;

    document.getElementById('tend-bajas').textContent = bajasMesActual;
    actualizarIndicadorCambio('tend-bajas-change', cambioBajas, porcentajeBajas, false);

    // 3. Rotación (bajas / total * 100)
    const rotacionActual = empleados.length > 0
        ? ((bajasMesActual / empleados.length) * 100).toFixed(1)
        : 0;

    const totalMesAnterior = empleados.length + bajasMesAnterior - ingresosMesActual;
    const rotacionAnterior = totalMesAnterior > 0
        ? ((bajasMesAnterior / totalMesAnterior) * 100).toFixed(1)
        : 0;

    const cambioRotacion = (rotacionActual - rotacionAnterior).toFixed(1);

    document.getElementById('tend-rotacion').textContent = `${rotacionActual}%`;
    actualizarIndicadorCambio('tend-rotacion-change', parseFloat(cambioRotacion), cambioRotacion, false);

    // 4. Costo Promedio
    const salariosMesActual = empleadosMesActual
        .filter(e => e.salario)
        .map(e => parseFloat(e.salario) || 0);

    const salariosMesAnterior = empleadosMesAnterior
        .filter(e => e.salario)
        .map(e => parseFloat(e.salario) || 0);

    const costoPromedioActual = salariosMesActual.length > 0
        ? Math.round(salariosMesActual.reduce((sum, s) => sum + s, 0) / salariosMesActual.length)
        : 0;

    const costoPromedioAnterior = salariosMesAnterior.length > 0
        ? Math.round(salariosMesAnterior.reduce((sum, s) => sum + s, 0) / salariosMesAnterior.length)
        : 0;

    const cambioCosto = costoPromedioActual - costoPromedioAnterior;
    const porcentajeCosto = costoPromedioAnterior > 0
        ? ((cambioCosto / costoPromedioAnterior) * 100).toFixed(0)
        : 0;

    document.getElementById('tend-costo').textContent =
        `$${costoPromedioActual.toLocaleString('es-AR')}`;
    actualizarIndicadorCambio('tend-costo-change', cambioCosto, porcentajeCosto, false);
}

function actualizarIndicadorCambio(elementId, cambio, porcentaje, positivoEsBueno) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;

    // Limpiar clases previas
    elemento.classList.remove('positive', 'negative', 'neutral');

    if (cambio > 0) {
        elemento.classList.add(positivoEsBueno ? 'positive' : 'negative');
        elemento.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            <span>+${Math.abs(porcentaje)}% vs mes anterior</span>
        `;
    } else if (cambio < 0) {
        elemento.classList.add(positivoEsBueno ? 'negative' : 'positive');
        elemento.innerHTML = `
            <i class="fas fa-arrow-down"></i>
            <span>-${Math.abs(porcentaje)}% vs mes anterior</span>
        `;
    } else {
        elemento.classList.add('neutral');
        elemento.innerHTML = `
            <i class="fas fa-minus"></i>
            <span>Sin cambios vs mes anterior</span>
        `;
    }
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
        // Antecedentes penales (usar campos snake_case)
        if ((emp.antecedentes_penales || emp.antecedentesPenales) === 'si') {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-exclamation-triangle',
                titulo: 'Antecedentes Penales',
                descripcion: `${emp.nombre_completo || emp.nombreCompleto || 'Empleado'} tiene antecedentes penales registrados.`,
                empleadoId: emp.id
            });
        }

        // Problemas de salud
        const problemas = emp.problemas_salud || emp.problemasSalud || '';
        if (problemas.trim() !== '') {
            alertas.push({
                tipo: 'info',
                icono: 'fas fa-heartbeat',
                titulo: 'Problema de Salud',
                descripcion: `${emp.nombre_completo || emp.nombreCompleto || 'Empleado'}: ${problemas.substring(0, 60)}...`,
                empleadoId: emp.id
            });
        }

        // Residencia temporaria o precaria
        const residencia = emp.tipo_residencia || emp.tipoResidencia;
        if (residencia === 'temporaria' || residencia === 'precaria') {
            alertas.push({
                tipo: 'warning',
                icono: 'fas fa-id-card',
                titulo: 'Residencia ' + residencia,
                descripcion: `${emp.nombre_completo || emp.nombreCompleto || 'Empleado'} tiene residencia ${residencia}. Verificar vencimiento.`,
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

// ===== VALIDACIONES =====

function validarCUIL(cuil) {
    // Formato: solo números (10 u 11 dígitos, flexible)
    const regex = /^\d{10,13}$/;
    if (!regex.test(cuil)) {
        return { valido: false, mensaje: 'CUIL debe contener solo números (mínimo 10 dígitos)' };
    }

    // Validación básica aprobada - no validamos dígito verificador por flexibilidad
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

    // Validar CUIL (opcional, solo si se ingresó)
    const cuil = document.getElementById('cuil').value.trim();
    if (cuil) {
        const validacionCUIL = validarCUIL(cuil);
        if (!validacionCUIL.valido) {
            errores.push({ campo: 'cuil', mensaje: validacionCUIL.mensaje });
        } else {
            limpiarErrorCampo('cuil');
        }
    } else {
        limpiarErrorCampo('cuil');
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
        sueldo: document.getElementById('sueldo').value,

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
        // Detectar si es edición o creación
        const editId = empleadoForm.dataset.editId;
        const isEdit = editId && editId !== '';

        const url = isEdit ? `${API_URL}/actualizar-empleado?id=${editId}` : `${API_URL}/empleados`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', isEdit ? 'Empleado Actualizado' : 'Empleado Registrado',
                isEdit ? 'Los cambios se guardaron correctamente' : 'El empleado se ha registrado correctamente');

            empleadoForm.reset();
            delete empleadoForm.dataset.editId;

            // Restaurar títulos originales
            const navButton = document.querySelector('[data-tab="nuevo"]');
            if (navButton) {
                navButton.innerHTML = '<i class="fas fa-user-plus"></i><span>Nuevo Empleado</span>';
            }
            
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.innerHTML = '<i class="fas fa-users"></i> Gestión de Personal';
            }

            const registroTitle = document.querySelector('.tab-content[data-tab="nuevo"] h3');
            if (registroTitle) {
                registroTitle.innerHTML = '<i class="fas fa-user-plus"></i> Registrar Nuevo Empleado';
            }

            // Restaurar texto del botón
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registrar Empleado';

            // Cambiar a la tab de lista
            document.querySelector('[data-tab="lista"]').click();
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo guardar el empleado');
        console.error(error);
    } finally {
        // Restaurar botón
        if (submitBtn) {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
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
                        <td><strong>${escapeHtml(emp.nombre_completo || emp.nombreCompleto || 'Sin nombre')}</strong></td>
                        <td>${escapeHtml(emp.cuil || '-')}</td>
                        <td>${escapeHtml(emp.puesto || '-')}</td>
                        <td>${emp.fecha_ingreso ? formatDate(emp.fecha_ingreso) : (emp.fechaIngreso ? formatDate(emp.fechaIngreso) : '-')}</td>
                        <td>${emp.es_extranjero === 'si' || emp.esExtranjero === 'si' ? '🌍 Sí' : 'No'}</td>
                        <td>
                            <button class="btn-small btn-info" onclick="verPerfil(${emp.id})">👁️ Ver</button>
                            <button class="btn-small btn-warning" onclick="crearTicket(${emp.id})">📋 Ticket</button>
                            <button class="btn-small btn-primary" onclick="editarEmpleado(${emp.id})">✏️ Editar</button>
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

        switch (campo) {
            case 'nombre':
                valorA = (a.nombre_completo || a.nombreCompleto || '').toLowerCase();
                valorB = (b.nombre_completo || b.nombreCompleto || '').toLowerCase();
                break;

            case 'fecha':
                valorA = (a.fecha_ingreso || a.fechaIngreso) ? new Date(a.fecha_ingreso || a.fechaIngreso) : new Date(0);
                valorB = (b.fecha_ingreso || b.fechaIngreso) ? new Date(b.fecha_ingreso || b.fechaIngreso) : new Date(0);
                break;

            case 'salario':
                valorA = parseFloat(a.salario) || 0;
                valorB = parseFloat(b.salario) || 0;
                break;

            case 'area':
                valorA = (a.area || '').toLowerCase();
                valorB = (b.area || '').toLowerCase();
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
        (emp.nombre_completo || emp.nombreCompleto || '').toLowerCase().includes(query) ||
        (emp.cuil || '').toLowerCase().includes(query) ||
        (emp.documento || '').toLowerCase().includes(query) ||
        (emp.puesto || '').toLowerCase().includes(query)
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
        const response = await fetch(`${API_URL}/eliminar-empleado?id=${id}`, {
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

// ===== IMPRIMIR PERFIL =====

function imprimirPerfil() {
    window.print();
}

// ===== VER PERFIL COMPLETO =====

async function verPerfil(id) {
    try {
        const response = await fetch(`${API_URL}/empleado?id=${id}`);
        const emp = await response.json();
        console.log('👤 Datos del empleado:', emp);

        // Adaptar campos con guiones bajos de Supabase
        const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || 'Sin nombre';
        console.log('📝 Nombre completo construido:', nombreCompleto);
        const cuil = emp.cuil || '-';
        const documento = emp.documento || '-';
        const fechaNacimiento = emp.fecha_nacimiento || '-';
        const estadoCivil = emp.estado_civil || '-';
        const nivelEducativo = emp.nivel_educativo || '-';
        const problemasSalud = emp.problemas_salud || 'Ninguno';
        const esExtranjero = emp.es_extranjero || 'no';
        const paisOrigen = emp.pais_origen || '-';
        const puesto = emp.puesto || '-';
        const fechaIngreso = emp.fecha_ingreso || '-';
        const antecedentesPenales = emp.antecedentes_penales || 'no';

        const perfilHTML = `
            <div class="perfil-header">
                <h2><i class="fas fa-user-circle"></i> ${escapeHtml(nombreCompleto)}</h2>
                <span class="badge badge-success">Activo</span>
            </div>
            
            <div class="perfil-tabs">
                <button class="perfil-tab active" data-perfilTab="general">📋 General</button>
                <button class="perfil-tab" data-perfilTab="laboral">💼 Laboral</button>
                <button class="perfil-tab" data-perfilTab="salud">🏥 Salud</button>
                <button class="perfil-tab" data-perfilTab="historial">📜 Historial</button>
            </div>

            <div class="perfil-tab-content active" data-perfilTabContent="general">
                <h3>📋 Información Personal</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Nombre Completo:</label><span>${escapeHtml(nombreCompleto)}</span></div>
                    <div class="info-item"><label>CUIL:</label><span>${cuil}</span></div>
                    <div class="info-item"><label>Documento:</label><span>${documento}</span></div>
                    <div class="info-item"><label>Fecha Nacimiento:</label><span>${fechaNacimiento}</span></div>
                    <div class="info-item"><label>Estado Civil:</label><span>${estadoCivil}</span></div>
                    <div class="info-item"><label>Educación:</label><span>${nivelEducativo}</span></div>
                    <div class="info-item"><label>Extranjero:</label><span>${esExtranjero === 'si' ? 'Sí' : 'No'}</span></div>
                    ${esExtranjero === 'si' ? `<div class="info-item"><label>País Origen:</label><span>${paisOrigen}</span></div>` : ''}
                </div>
            </div>

            <div class="perfil-tab-content" data-perfilTabContent="laboral">
                <h3>💼 Información Laboral</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Puesto:</label><span>${puesto}</span></div>
                    <div class="info-item"><label>Fecha Ingreso:</label><span>${fechaIngreso}</span></div>
                    <div class="info-item"><label>Sueldo:</label><span>${emp.sueldo ? `$${parseFloat(emp.sueldo).toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-'}</span></div>
                    <div class="info-item"><label>Experiencia:</label><span>${emp.experiencia_laboral || '-'}</span></div>
                </div>
            </div>

            <div class="perfil-tab-content" data-perfilTabContent="salud">
                <h3>🏥 Información de Salud</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Problemas de Salud:</label><span>${problemasSalud}</span></div>
                    <div class="info-item"><label>Antecedentes Penales:</label><span>${antecedentesPenales === 'si' ? 'Sí' : 'No'}</span></div>
                    ${emp.observaciones ? `<div class="info-item"><label>Observaciones:</label><span>${escapeHtml(emp.observaciones)}</span></div>` : ''}
                </div>
            </div>

            <div class="perfil-tab-content" data-perfilTabContent="historial">
                <h3>📜 Historial de Tickets</h3>
                <div id="tickets-empleado-${id}">
                    <p class="loading">Cargando historial...</p>
                </div>
            </div>
        `;

        document.getElementById('perfil-content').innerHTML = perfilHTML;
        currentEmpleadoId = id;
        modalPerfil.style.display = 'flex';
        activatePerfilTabs();

        // Cargar tickets del empleado
        await cargarHistorialTickets(id);

    } catch (error) {
        console.error('Error al cargar perfil:', error);
        alert('Error al cargar el perfil del empleado');
    }
}

// Cargar historial de tickets de un empleado
async function cargarHistorialTickets(empleadoId) {
    try {
        console.log(`📋 Cargando tickets del empleado ${empleadoId}`);
        const response = await fetch(`${API_URL}/tickets/${empleadoId}`);
        const ticketsEmp = await response.json();
        console.log(`✅ Tickets recibidos:`, ticketsEmp);

        const container = document.getElementById(`tickets-empleado-${empleadoId}`);

        if (!Array.isArray(ticketsEmp) || ticketsEmp.length === 0) {
            console.log('ℹ️ No hay tickets para este empleado');
            container.innerHTML = '<p class="empty-state">📋 No hay tickets registrados para este empleado.</p>';
            return;
        }

        // Ordenar por fecha descendente
        ticketsEmp.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Crear timeline de tickets
        const timelineHTML = `
            <div class="timeline-tickets">
                ${ticketsEmp.map(t => `
                    <div class="timeline-item">
                        <div class="timeline-marker ${getTimelineMarkerClass(t.estado)}">
                            ${getTicketTipoIcon(t.tipo)}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h4>${escapeHtml(t.titulo || 'Sin título')}</h4>
                                <div class="timeline-badges">
                                    ${getTicketEstadoBadge(t.estado)}
                                    ${getTicketTipoBadge(t.tipo)}
                                </div>
                            </div>
                            
                            ${t.descripcion ? `<p>${escapeHtml(t.descripcion)}</p>` : ''}
                            
                            ${t.fecha_desde && t.fecha_hasta ? `
                                <div class="timeline-dates">
                                    <i class="fas fa-calendar"></i>
                                    ${formatDate(t.fecha_desde)} - ${formatDate(t.fecha_hasta)}
                                    <span class="timeline-duracion">(${calcularDias(t.fecha_desde, t.fecha_hasta)} días)</span>
                                </div>
                            ` : t.fecha_evento ? `
                                <div class="timeline-dates">
                                    <i class="fas fa-calendar-day"></i>
                                    ${formatDate(t.fecha_evento)}
                                </div>
                            ` : ''}
                            
                            ${t.valor_anterior && t.valor_nuevo ? `
                                <div class="timeline-cambio">
                                    <i class="fas fa-exchange-alt"></i>
                                    <span class="valor-anterior">${escapeHtml(t.valor_anterior)}</span>
                                    <i class="fas fa-arrow-right"></i>
                                    <span class="valor-nuevo">${escapeHtml(t.valor_nuevo)}</span>
                                </div>
                            ` : ''}
                            
                            ${t.observaciones ? `
                                <div class="timeline-observaciones">
                                    <i class="fas fa-comment"></i>
                                    ${escapeHtml(t.observaciones)}
                                </div>
                            ` : ''}
                            
                            <div class="timeline-footer">
                                <span><i class="fas fa-clock"></i> ${formatDate(t.created_at)}</span>
                                <button class="btn-small btn-info" onclick="verDetalleTicket(${t.id})">
                                    <i class="fas fa-eye"></i> Ver Detalle
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = timelineHTML;
    } catch (error) {
        console.error('Error al cargar tickets del empleado:', error);
        const container = document.getElementById(`tickets-empleado-${empleadoId}`);
        if (container) {
            container.innerHTML = '<p class="error-state">❌ Error al cargar historial de tickets</p>';
        }
    }
}

// ===== TICKETS =====

async function cargarTicketsEmpleado(empleadoId, ticketsEmp) {
    try {
        const container = document.getElementById(`tickets-empleado-${empleadoId}`);

        if (ticketsEmp.length === 0) {
            container.innerHTML = '<p class="empty-state">📋 No hay tickets registrados para este empleado.</p>';
            return;
        }

        // Crear timeline de tickets
        const timelineHTML = `
            <div class="timeline-tickets">
                ${ticketsEmp.map(t => `
                    <div class="timeline-item">
                        <div class="timeline-marker ${getTimelineMarkerClass(t.estado)}">
                            ${getTicketTipoIcon(t.tipo)}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h4>${escapeHtml(t.titulo)}</h4>
                                <div class="timeline-badges">
                                    ${getTicketEstadoBadge(t.estado)}
                                    ${getTicketTipoBadge(t.tipo)}
                                </div>
                            </div>
                            
                            ${t.descripcion ? `<p>${escapeHtml(t.descripcion)}</p>` : ''}
                            
                            ${t.fecha_desde && t.fecha_hasta ? `
                                <div class="timeline-dates">
                                    <i class="fas fa-calendar"></i>
                                    ${formatDate(t.fecha_desde)} - ${formatDate(t.fecha_hasta)}
                                    <span class="timeline-duracion">(${calcularDias(t.fecha_desde, t.fecha_hasta)} días)</span>
                                </div>
                            ` : t.fecha_evento ? `
                                <div class="timeline-dates">
                                    <i class="fas fa-calendar-day"></i>
                                    ${formatDate(t.fecha_evento)}
                                </div>
                            ` : ''}
                            
                            ${t.valor_anterior && t.valor_nuevo ? `
                                <div class="timeline-cambio">
                                    <i class="fas fa-exchange-alt"></i>
                                    <span class="valor-anterior">${escapeHtml(t.valor_anterior)}</span>
                                    <i class="fas fa-arrow-right"></i>
                                    <span class="valor-nuevo">${escapeHtml(t.valor_nuevo)}</span>
                                </div>
                            ` : ''}
                            
                            ${t.observaciones ? `
                                <div class="timeline-observaciones">
                                    <i class="fas fa-comment"></i>
                                    ${escapeHtml(t.observaciones)}
                                </div>
                            ` : ''}
                            
                            <div class="timeline-footer">
                                <span><i class="fas fa-user"></i> ${t.creado_por_nombre || 'Sistema'}</span>
                                <span><i class="fas fa-clock"></i> ${formatDate(t.created_at)}</span>
                                ${t.aprobado_por_nombre ? `
                                    <span><i class="fas fa-check-circle"></i> ${t.aprobado_por_nombre}</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="perfil-actions-tickets">
                <button class="btn btn-primary" onclick="mostrarModalNuevoTicket(${empleadoId})">
                    <i class="fas fa-plus"></i> Crear Nuevo Ticket
                </button>
            </div>
        `;

        container.innerHTML = timelineHTML;

    } catch (error) {
        console.error(error);
    }
}

// Cerrar modal
if (modalClose) {
    modalClose.addEventListener('click', () => {
        modalPerfil.style.display = 'none';
    });
}

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
    const modal = document.getElementById('modal-ticket');
    if (modal) modal.style.display = 'none';
    currentEmpleadoId = null;
}

if (modalCloseTicket) {
    modalCloseTicket.addEventListener('click', closeTicketModal);
}

// NOTA: El handler del formulario de tickets está más abajo (línea ~3252)
// para usar el sistema completo con todos los tipos de tickets

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
    loginScreen.style.display = 'flex';
    mainScreen.classList.remove('active');
    mainScreen.style.display = 'none';
}

function showMainScreen() {
    loginScreen.classList.remove('active');
    loginScreen.style.display = 'none';
    mainScreen.classList.add('active');
    mainScreen.style.display = 'flex';
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

    switch (tipo) {
        case 'general':
            filteredData = empleados;
            nombreReporte = 'Reporte General de Personal';
            break;
        case 'extranjeros':
            filteredData = empleados.filter(e => e.es_extranjero === 'si');
            nombreReporte = 'Reporte de Personal Extranjero';
            break;
        case 'antecedentes':
            filteredData = empleados.filter(e => e.antecedentes_penales === 'si');
            nombreReporte = 'Reporte de Personal con Antecedentes';
            break;
        case 'salud':
            filteredData = empleados.filter(e => e.problemas_salud && e.problemas_salud.trim() !== '');
            nombreReporte = 'Reporte de Problemas de Salud';
            break;
        case 'familias':
            filteredData = empleados.filter(e => e.integracion_familiar && e.integracion_familiar.trim() !== '');
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
                    ${filteredData.map(emp => {
                        const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || 'Sin nombre';
                        return `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${nombreCompleto}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${emp.cuil}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${emp.puesto || '-'}</td>
                            ${tipo === 'extranjeros' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.pais_origen || '-'}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.tipo_residencia || '-'}</td>
                            ` : ''}
                            ${tipo === 'salud' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.problemas_salud || '-'}</td>
                            ` : ''}
                            ${tipo === 'educacion' ? `
                                <td style="border: 1px solid #ddd; padding: 8px;">${emp.nivel_educativo || '-'}</td>
                            ` : ''}
                        </tr>
                    `}).join('')}
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
    let csv = 'Nombre,Apellido,CUIL,Fecha Nacimiento,Puesto,Es Extranjero,País Origen,Tipo Residencia,Nivel Educativo,Antecedentes,Fecha Ingreso\n';

    empleados.forEach(emp => {
        csv += `"${emp.nombre || ''}","${emp.apellido || ''}","${emp.cuil}","${emp.fecha_nacimiento || ''}","${emp.puesto || ''}","${emp.es_extranjero}","${emp.pais_origen || ''}","${emp.tipo_residencia || ''}","${emp.nivel_educativo || ''}","${emp.antecedentes_penales}","${emp.fecha_ingreso || ''}"\n`;
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
            const tabName = tab.getAttribute('data-perfiltab');
            const targetContent = document.querySelector(`[data-perfiltabcontent="${tabName}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
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
    const puestos = [...new Set(empleados.map(e => e.puesto || e.laboral?.puesto).filter(p => p))];

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
        filtered = filtered.filter(e => (e.puesto || e.laboral?.puesto) === filters.puesto);
    }

    if (filters.area) {
        filtered = filtered.filter(e => (e.area || e.laboral?.area) === filters.area);
    }

    if (filters.nacionalidad) {
        filtered = filtered.filter(e => (e.pais_origen || e.paisOrigen || e.datosPersonales?.nacionalidad) === filters.nacionalidad);
    }

    if (filters.educacion) {
        filtered = filtered.filter(e => {
            const nivel = e.nivel_educativo || e.nivelEducativo || e.educacion?.nivelEducativo || '';
            return nivel.toLowerCase().includes(filters.educacion.toLowerCase());
        });
    }

    if (filters.salud === 'sin-problemas') {
        filtered = filtered.filter(e => {
            const problemas = e.problemas_salud || e.problemasSalud || e.salud?.problemasSalud || '';
            return !problemas || problemas === 'Ninguno' || problemas === '';
        });
    } else if (filters.salud === 'con-problemas') {
        filtered = filtered.filter(e => {
            const problemas = e.problemas_salud || e.problemasSalud || e.salud?.problemasSalud || '';
            return problemas && problemas !== 'Ninguno' && problemas !== '';
        });
    }

    // Filtro de estado activo/inactivo
    if (filters.estado) {
        filtered = filtered.filter(e => {
            const estado = e.estado || e.laboral?.estado || 'activo';
            return estado.toLowerCase() === filters.estado;
        });
    }

    // Filtro de rango de salario
    if (filters.salario) {
        filtered = filtered.filter(e => {
            const salario = parseFloat(e.salario || e.laboral?.salario || 0);

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
            const fechaNac = e.fecha_nacimiento || e.fechaNacimiento || e.datosPersonales?.fechaNacimiento;
            const edad = fechaNac ? calcularEdad(fechaNac) : null;
            if (!edad) return true;
            if (filters.edadMin && edad < parseInt(filters.edadMin)) return false;
            if (filters.edadMax && edad > parseInt(filters.edadMax)) return false;
            return true;
        });
    }

    if (filters.antiguedad) {
        filtered = filtered.filter(e => {
            const fechaIngreso = e.fecha_ingreso || e.fechaIngreso || e.laboral?.fechaIngreso;
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
        const fechaIngreso = emp.fecha_ingreso || emp.fechaIngreso || emp.laboral?.fechaIngreso;
        if (fechaIngreso) {
            const ingreso = new Date(fechaIngreso);
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
        <div class="notif-item ${n.tipo} ${n.leida ? 'leida' : ''}">
            <div class="notif-icon">
                <i class="${n.icono}"></i>
            </div>
            <div class="notif-content">
                <h4>${n.titulo}</h4>
                <p>${n.mensaje}</p>
                <small>${formatearFecha(n.fecha)}</small>
            </div>
            <div class="notif-actions">
                <button class="btn-small btn-primary" onclick="event.stopPropagation(); verPerfil(${n.empleadoId})" title="Ver Perfil">
                    <i class="fas fa-user"></i>
                </button>
                <button class="notif-mark-read" onclick="event.stopPropagation(); marcarLeida('${n.id}')" title="Marcar como leída">
                    <i class="fas fa-check"></i>
                </button>
            </div>
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
        doc.text('Verapp', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema para Gestión de Personas', pageWidth / 2, 25, { align: 'center' });

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
            const fechaIngreso = emp.fecha_ingreso || emp.fechaIngreso || emp.laboral?.fechaIngreso;
            const antiguedad = fechaIngreso ? calcularAntiguedad(fechaIngreso) : 0;

            return [
                datos.nombre + ' ' + datos.apellido,
                datos.dni || datos.cuil || '-',
                datos.nacionalidad || '-',
                `${edad} años`,
                emp.puesto || emp.laboral?.puesto || '-',
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
            ['VERAPP - SISTEMA PARA GESTIÓN DE PERSONAS'],
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
            const fechaIngreso = emp.fecha_ingreso || emp.fechaIngreso || emp.laboral?.fechaIngreso;
            const antiguedad = fechaIngreso ? calcularAntiguedad(fechaIngreso) : 0;

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
                'Teléfono': emp.telefono || emp.contacto?.telefono || '-',
                'Email': emp.email || emp.contacto?.email || '-',
                'Dirección': emp.direccion_completa || (emp.direccion ? `${emp.direccion.calle}, ${emp.direccion.ciudad}` : '-'),
                'Provincia': emp.provincia || emp.direccion?.provincia || '-',
                'CP': emp.codigo_postal || emp.codigoPostal || emp.direccion?.codigoPostal || '-',
                'Puesto': emp.puesto || emp.laboral?.puesto || '-',
                'Área': emp.area || emp.laboral?.area || '-',
                'Fecha Ingreso': emp.fecha_ingreso || emp.fechaIngreso || emp.laboral?.fechaIngreso || '-',
                'Antigüedad (años)': antiguedad,
                'Tipo Contrato': emp.tipo_contrato || emp.tipoContrato || emp.laboral?.tipoContrato || '-',
                'Salario': emp.salario || emp.laboral?.salario || '-'
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
document.addEventListener('DOMContentLoaded', function () {
    // Validación en tiempo real para CUIL
    const cuilInput = document.getElementById('cuil');
    if (cuilInput) {
        cuilInput.addEventListener('blur', function () {
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
        cuilInput.addEventListener('input', function (e) {
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
        nombreInput.addEventListener('blur', function () {
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
        fechaNacInput.addEventListener('blur', function () {
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

    reader.onload = async function (e) {
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

    reader.onerror = function () {
        alert('❌ Error al leer el archivo');
        event.target.value = '';
    };

    reader.readAsText(file);
}

// ===== MODO OSCURO =====

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    applyTheme();
}

function applyTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle?.querySelector('i');

    if (darkMode) {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
        themeToggle.title = 'Modo Claro';
    } else {
        document.body.classList.remove('dark-mode');
        if (icon) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        themeToggle.title = 'Modo Oscuro';
    }
}

// Event listener para toggle de tema
document.addEventListener('DOMContentLoaded', function () {
    // Aplicar tema guardado
    applyTheme();

    // Agregar evento al botón
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
});

// Inicializar
showLoginScreen();
// ===== SISTEMA DE TICKETS =====

// Cargar todos los tickets
async function loadAllTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets`);
        const data = await response.json();
        
        // Verificar que data sea un array
        if (Array.isArray(data)) {
            tickets = data;
        } else if (data.success && Array.isArray(data.data)) {
            tickets = data.data;
        } else {
            console.warn('Respuesta inesperada del servidor:', data);
            tickets = [];
        }

        console.log(`📋 ${tickets.length} tickets cargados`);

        // Actualizar estadísticas
        actualizarEstadisticasTickets();

        // Mostrar tickets
        renderTicketsList(tickets);

        // Cargar empleados ausentes
        loadEmpleadosAusentes();
    } catch (error) {
        console.error('Error al cargar tickets:', error);
        tickets = [];  // Asegurar que tickets sea un array
        showToast('error', 'Error', 'Error al cargar tickets');
    }
}

// Actualizar estadísticas de tickets
function actualizarEstadisticasTickets() {
    if (!Array.isArray(tickets)) {
        console.error('tickets no es un array:', tickets);
        tickets = [];
    }
    
    const pendientes = tickets.filter(t => t.estado === 'pendiente').length;
    const aprobados = tickets.filter(t => t.estado === 'aprobado').length;
    const enProceso = tickets.filter(t => t.estado === 'en_proceso').length;

    document.getElementById('stat-tickets-pendientes').textContent = pendientes;
    document.getElementById('stat-tickets-aprobados').textContent = aprobados;
    document.getElementById('stat-tickets-proceso').textContent = enProceso;
}

// Renderizar lista de tickets
function renderTicketsList(ticketsData) {
    const container = document.getElementById('tickets-list');

    if (!ticketsData || ticketsData.length === 0) {
        container.innerHTML = '<p class="empty-state">📋 No hay tickets registrados</p>';
        return;
    }

    const ticketsHTML = ticketsData.map(ticket => `
        <div class="ticket-card" data-ticket-id="${ticket.id}">
            <div class="ticket-header">
                <div class="ticket-info">
                    ${getTicketTipoIcon(ticket.tipo)}
                    <div>
                        <h4>${ticket.titulo}</h4>
                        <p class="ticket-empleado">${ticket.empleado_nombre || 'Empleado'} ${ticket.puesto ? `- ${ticket.puesto}` : ''}</p>
                    </div>
                </div>
                <div class="ticket-badges">
                    ${getTicketEstadoBadge(ticket.estado)}
                    ${getTicketTipoBadge(ticket.tipo)}
                </div>
            </div>
            
            <div class="ticket-body">
                ${ticket.descripcion ? `<p>${ticket.descripcion}</p>` : ''}
                
                ${ticket.fecha_desde && ticket.fecha_hasta ? `
                    <p class="ticket-fecha">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(ticket.fecha_desde)} - ${formatDate(ticket.fecha_hasta)}
                        <span class="ticket-duracion">(${calcularDias(ticket.fecha_desde, ticket.fecha_hasta)} días)</span>
                    </p>
                ` : ''}
                
                ${ticket.fecha_evento ? `
                    <p class="ticket-fecha">
                        <i class="fas fa-calendar-day"></i>
                        ${formatDate(ticket.fecha_evento)}
                    </p>
                ` : ''}
                
                ${ticket.valor_anterior && ticket.valor_nuevo ? `
                    <p class="ticket-cambio">
                        <i class="fas fa-exchange-alt"></i>
                        <span class="valor-anterior">${ticket.valor_anterior}</span>
                        <i class="fas fa-arrow-right"></i>
                        <span class="valor-nuevo">${ticket.valor_nuevo}</span>
                    </p>
                ` : ''}
            </div>
            
            <div class="ticket-footer">
                <div class="ticket-meta">
                    <span><i class="fas fa-user"></i> ${ticket.creado_por_nombre || 'Sistema'}</span>
                    <span><i class="fas fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                </div>
                <div class="ticket-actions">
                    <button class="btn-icon" onclick="verDetalleTicket(${ticket.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${ticket.estado === 'pendiente' && canApproveTickets() ? `
                        <button class="btn-icon btn-success" onclick="aprobarTicket(${ticket.id})" title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="rechazarTicket(${ticket.id})" title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    ${canEditTickets() ? `
                        <button class="btn-icon" onclick="editarTicket(${ticket.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="eliminarTicket(${ticket.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = ticketsHTML;
}

// Obtener ícono según tipo de ticket
function getTicketTipoIcon(tipo) {
    const icons = {
        'vacaciones': '🏖️',
        'viaje': '✈️',
        'licencia_medica': '🏥',
        'licencia_maternidad': '👶',
        'permiso': '📋',
        'cambio_puesto': '📈',
        'cambio_area': '🏢',
        'cambio_salario': '💰',
        'desvinculacion': '🚪',
        'reincorporacion': '↩️',
        'cambio_personal': '👨‍👩‍👧',
        'capacitacion': '📚',
        'reconocimiento': '🏆',
        'amonestacion': '⚠️',
        'suspension': '⚠️',
        'otro': '📝'
    };
    return `<span class="ticket-icon">${icons[tipo] || '📋'}</span>`;
}

// Obtener badge de estado
function getTicketEstadoBadge(estado) {
    const badges = {
        'pendiente': '<span class="badge badge-warning">⏳ Pendiente</span>',
        'aprobado': '<span class="badge badge-success">✅ Aprobado</span>',
        'rechazado': '<span class="badge badge-danger">❌ Rechazado</span>',
        'en_proceso': '<span class="badge badge-info">🔄 En Proceso</span>',
        'completado': '<span class="badge badge-success">✔️ Completado</span>',
        'cancelado': '<span class="badge badge-secondary">🚫 Cancelado</span>'
    };
    return badges[estado] || '<span class="badge">Estado</span>';
}

// Obtener badge de tipo
function getTicketTipoBadge(tipo) {
    const nombres = {
        'vacaciones': 'Vacaciones',
        'viaje': 'Viaje',
        'licencia_medica': 'Licencia Médica',
        'licencia_maternidad': 'Maternidad/Paternidad',
        'permiso': 'Permiso',
        'cambio_puesto': 'Cambio Puesto',
        'cambio_area': 'Cambio Área',
        'cambio_salario': 'Cambio Salario',
        'desvinculacion': 'Desvinculación',
        'reincorporacion': 'Reincorporación',
        'cambio_personal': 'Cambio Personal',
        'capacitacion': 'Capacitación',
        'reconocimiento': 'Reconocimiento',
        'amonestacion': 'Amonestación',
        'suspension': 'Suspensión',
        'otro': 'Otro'
    };
    return `<span class="badge badge-type">${nombres[tipo] || tipo}</span>`;
}

// Calcular días entre fechas
function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin - inicio;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
}

// Obtener clase CSS para el marker del timeline
function getTimelineMarkerClass(estado) {
    return `estado-${estado}`;
}

// Mostrar modal para nuevo ticket
async function mostrarModalNuevoTicket(empleadoId = null) {
    // Cargar empleados en el select
    await cargarEmpleadosEnSelect();

    // Limpiar formulario
    document.getElementById('ticket-form').reset();
    document.getElementById('ticket-id').value = '';
    document.getElementById('ticket-modal-title').textContent = '📋 Crear Nuevo Ticket';

    // Si viene un empleado específico, pre-seleccionarlo
    if (empleadoId) {
        document.getElementById('ticket-empleado-select').value = empleadoId;
        document.getElementById('ticket-empleado-select').disabled = true;
    } else {
        document.getElementById('ticket-empleado-select').disabled = false;
    }

    // Mostrar modal
    document.getElementById('modal-ticket').classList.add('active');
}

// Cargar empleados en select
async function cargarEmpleadosEnSelect() {
    try {
        if (empleados.length === 0) {
            await loadEmpleados();
        }

        console.log('Cargando empleados en select. Total:', empleados.length);
        const select = document.getElementById('ticket-empleado-select');
        
        if (!select) {
            console.error('No se encontró el elemento ticket-empleado-select');
            return;
        }
        
        select.innerHTML = '<option value="">Seleccionar empleado...</option>' +
            empleados.map(emp =>
                `<option value="${emp.id}">${emp.nombre_completo || emp.nombreCompleto || 'Sin nombre'} - ${emp.puesto || 'Sin puesto'}</option>`
            ).join('');
        
        console.log('Select actualizado con', select.options.length - 1, 'empleados');
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
}

// Adaptar formulario según tipo de ticket
function adaptarFormularioTicket() {
    const tipo = document.getElementById('ticket-tipo').value;

    // Ocultar todos los campos especiales
    document.getElementById('ticket-campos-periodo').style.display = 'none';
    document.getElementById('ticket-campos-evento').style.display = 'none';
    document.getElementById('ticket-campos-cambio').style.display = 'none';

    // Mostrar campos según tipo
    const tiposConPeriodo = ['vacaciones', 'viaje', 'licencia_medica', 'licencia_maternidad', 'permiso', 'suspension', 'capacitacion'];
    const tiposConEvento = ['desvinculacion', 'reincorporacion', 'cambio_personal', 'reconocimiento', 'amonestacion'];
    const tiposConCambio = ['cambio_puesto', 'cambio_area', 'cambio_salario'];

    if (tiposConPeriodo.includes(tipo)) {
        document.getElementById('ticket-campos-periodo').style.display = 'block';
    } else if (tiposConEvento.includes(tipo)) {
        document.getElementById('ticket-campos-evento').style.display = 'block';
    } else if (tiposConCambio.includes(tipo)) {
        document.getElementById('ticket-campos-evento').style.display = 'block';
        document.getElementById('ticket-campos-cambio').style.display = 'block';
    }
}

// Cerrar modal de ticket
function closeTicketModal() {
    document.getElementById('modal-ticket').classList.remove('active');
    document.getElementById('ticket-form').reset();
}

// Guardar ticket (crear o editar)
if (document.getElementById('ticket-form')) {
    console.log('✅ Configurando handler de tickets (sistema completo)');
    document.getElementById('ticket-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Formulario de ticket enviado');

        const ticketId = document.getElementById('ticket-id').value;
        const empleadoId = document.getElementById('ticket-empleado-select').value;
        const tipo = document.getElementById('ticket-tipo').value;
        const titulo = document.getElementById('ticket-titulo').value;
        const descripcion = document.getElementById('ticket-descripcion').value;
        const observaciones = document.getElementById('ticket-observaciones').value;
        const estado = document.getElementById('ticket-estado').value;

        console.log('Datos del ticket:', { empleadoId, tipo, titulo });

        if (!empleadoId) {
            showToast('error', 'Error', 'Debes seleccionar un empleado');
            return;
        }

        const data = {
            empleadoId: parseInt(empleadoId),
            tipo,
            titulo,
            descripcion,
            observaciones,
            estado: estado || 'pendiente',
            creadoPor: currentUser ? currentUser.id : 1
        };

        // Agregar campos según tipo
        const tiposConPeriodo = ['vacaciones', 'viaje', 'licencia_medica', 'licencia_maternidad', 'permiso', 'suspension', 'capacitacion'];
        if (tiposConPeriodo.includes(tipo)) {
            data.fechaDesde = document.getElementById('ticket-fecha-desde').value;
            data.fechaHasta = document.getElementById('ticket-fecha-hasta').value;
        } else {
            data.fechaEvento = document.getElementById('ticket-fecha-evento').value;
        }

        const tiposConCambio = ['cambio_puesto', 'cambio_area', 'cambio_salario'];
        if (tiposConCambio.includes(tipo)) {
            data.valorAnterior = document.getElementById('ticket-valor-anterior').value;
            data.valorNuevo = document.getElementById('ticket-valor-nuevo').value;
            data.actualizaEmpleado = document.getElementById('ticket-actualiza-empleado').checked;
        }

        try {
            const url = ticketId ? `${API_URL}/tickets/${ticketId}` : `${API_URL}/tickets`;
            const method = ticketId ? 'PUT' : 'POST';

            console.log(`📤 Enviando ${method} a ${url}`);
            console.log('Datos:', data);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                showToast('success', ticketId ? 'Actualizado' : 'Creado', 
                    ticketId ? 'Ticket actualizado correctamente' : 'Ticket creado correctamente');
                closeTicketModal();
                loadAllTickets();
            } else {
                showToast('error', 'Error', 'Error al guardar ticket: ' + (result.mensaje || 'Error desconocido'));
            }
        } catch (error) {
            console.error('❌ Error al guardar ticket:', error);
            showToast('error', 'Error', 'Error al guardar ticket: ' + error.message);
        }
    });
}

// Aprobar ticket
async function aprobarTicket(ticketId) {
    if (!confirm('¿Deseas aprobar este ticket?')) return;

    try {
        const response = await fetch(`${API_URL}/actualizar-ticket?id=${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'aprobado',
                aprobadoPor: currentUser.id
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Ticket aprobado correctamente', 'success');
            loadAllTickets();
        } else {
            showToast('Error al aprobar ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al aprobar ticket', 'error');
    }
}

// Rechazar ticket
async function rechazarTicket(ticketId) {
    const motivo = prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return;

    try {
        const response = await fetch(`${API_URL}/actualizar-ticket?id=${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: 'rechazado',
                aprobadoPor: currentUser.id,
                observaciones: motivo
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Ticket rechazado', 'success');
            loadAllTickets();
        } else {
            showToast('Error al rechazar ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al rechazar ticket', 'error');
    }
}

// Eliminar ticket
async function eliminarTicket(ticketId) {
    if (!confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(`${API_URL}/eliminar-ticket?id=${ticketId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Ticket eliminado correctamente', 'success');
            loadAllTickets();
        } else {
            showToast('Error al eliminar ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar ticket', 'error');
    }
}

// Ver detalle de ticket
async function verDetalleTicket(ticketId) {
    try {
        const response = await fetch(`${API_URL}/ticket?id=${ticketId}`);
        const ticket = await response.json();

        const detalleHTML = `
            <div class="ticket-detalle">
                <h3>${getTicketTipoIcon(ticket.tipo)} ${ticket.titulo}</h3>
                ${getTicketEstadoBadge(ticket.estado)}
                ${getTicketTipoBadge(ticket.tipo)}
                
                <div class="detalle-section">
                    <h4><i class="fas fa-user"></i> Empleado</h4>
                    <p>${ticket.empleado_nombre} - ${ticket.puesto || 'Sin puesto'}</p>
                </div>
                
                ${ticket.descripcion ? `
                    <div class="detalle-section">
                        <h4><i class="fas fa-align-left"></i> Descripción</h4>
                        <p>${ticket.descripcion}</p>
                    </div>
                ` : ''}
                
                ${ticket.fecha_desde && ticket.fecha_hasta ? `
                    <div class="detalle-section">
                        <h4><i class="fas fa-calendar"></i> Período</h4>
                        <p>Desde: ${formatDate(ticket.fecha_desde)}</p>
                        <p>Hasta: ${formatDate(ticket.fecha_hasta)}</p>
                        <p>Duración: ${calcularDias(ticket.fecha_desde, ticket.fecha_hasta)} días</p>
                    </div>
                ` : ''}
                
                ${ticket.fecha_evento ? `
                    <div class="detalle-section">
                        <h4><i class="fas fa-calendar-day"></i> Fecha del Evento</h4>
                        <p>${formatDate(ticket.fecha_evento)}</p>
                    </div>
                ` : ''}
                
                ${ticket.valor_anterior && ticket.valor_nuevo ? `
                    <div class="detalle-section">
                        <h4><i class="fas fa-exchange-alt"></i> Cambio</h4>
                        <p>Anterior: <strong>${ticket.valor_anterior}</strong></p>
                        <p>Nuevo: <strong>${ticket.valor_nuevo}</strong></p>
                        ${ticket.actualiza_empleado ? '<p class="badge badge-info">Actualiza empleado automáticamente</p>' : ''}
                    </div>
                ` : ''}
                
                ${ticket.observaciones ? `
                    <div class="detalle-section">
                        <h4><i class="fas fa-sticky-note"></i> Observaciones</h4>
                        <p>${ticket.observaciones}</p>
                    </div>
                ` : ''}
                
                <div class="detalle-section">
                    <h4><i class="fas fa-info-circle"></i> Información</h4>
                    <p>Creado por: ${ticket.creado_por_nombre || 'Sistema'}</p>
                    <p>Fecha de creación: ${formatDate(ticket.created_at)}</p>
                    ${ticket.aprobado_por_nombre ? `
                        <p>Aprobado/Rechazado por: ${ticket.aprobado_por_nombre}</p>
                        <p>Fecha: ${formatDate(ticket.fecha_aprobacion)}</p>
                    ` : ''}
                </div>
                
                <div class="detalle-actions">
                    ${ticket.estado === 'pendiente' && canApproveTickets() ? `
                        <button class="btn btn-success" onclick="aprobarTicket(${ticket.id}); closeTicketDetalleModal();">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn btn-danger" onclick="rechazarTicket(${ticket.id}); closeTicketDetalleModal();">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    ` : ''}
                    ${(ticket.estado === 'aprobado' || ticket.estado === 'en_proceso') && canEditTickets() ? `
                        <button class="btn btn-info" onclick="cambiarEstadoTicket(${ticket.id}, 'completado'); closeTicketDetalleModal();">
                            <i class="fas fa-check-circle"></i> Completar
                        </button>
                    ` : ''}
                    ${ticket.estado !== 'cancelado' && ticket.estado !== 'completado' && canEditTickets() ? `
                        <button class="btn btn-warning" onclick="if(confirm('¿Cancelar este ticket?')) { cambiarEstadoTicket(${ticket.id}, 'cancelado'); closeTicketDetalleModal(); }">
                            <i class="fas fa-ban"></i> Cancelar
                        </button>
                    ` : ''}
                    ${canEditTickets() ? `
                        <button class="btn btn-primary" onclick="editarTicket(${ticket.id}); closeTicketDetalleModal();">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeTicketDetalleModal()">Cerrar</button>
                </div>
            </div>
        `;

        document.getElementById('ticket-detalle-content').innerHTML = detalleHTML;
        document.getElementById('modal-ticket-detalle').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', 'Error al cargar detalle del ticket');
    }
}

// Cerrar modal de detalle
function closeTicketDetalleModal() {
    document.getElementById('modal-ticket-detalle').style.display = 'none';
}

// Editar ticket
async function editarTicket(ticketId) {
    try {
        const response = await fetch(`${API_URL}/ticket?id=${ticketId}`);
        const ticket = await response.json();

        // Cargar empleados
        await cargarEmpleadosEnSelect();

        // Llenar formulario
        document.getElementById('ticket-id').value = ticket.id;
        document.getElementById('ticket-empleado-select').value = ticket.empleado_id;
        document.getElementById('ticket-tipo').value = ticket.tipo;
        document.getElementById('ticket-titulo').value = ticket.titulo;
        document.getElementById('ticket-descripcion').value = ticket.descripcion || '';
        document.getElementById('ticket-observaciones').value = ticket.observaciones || '';
        document.getElementById('ticket-estado').value = ticket.estado;

        // Adaptar formulario
        adaptarFormularioTicket();

        // Llenar campos específicos
        if (ticket.fecha_desde) document.getElementById('ticket-fecha-desde').value = ticket.fecha_desde.split('T')[0];
        if (ticket.fecha_hasta) document.getElementById('ticket-fecha-hasta').value = ticket.fecha_hasta.split('T')[0];
        if (ticket.fecha_evento) document.getElementById('ticket-fecha-evento').value = ticket.fecha_evento.split('T')[0];
        if (ticket.valor_anterior) document.getElementById('ticket-valor-anterior').value = ticket.valor_anterior;
        if (ticket.valor_nuevo) document.getElementById('ticket-valor-nuevo').value = ticket.valor_nuevo;
        if (ticket.actualiza_empleado) document.getElementById('ticket-actualiza-empleado').checked = true;

        document.getElementById('ticket-modal-title').textContent = '✏️ Editar Ticket';
        document.getElementById('modal-ticket').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar ticket', 'error');
    }
}

// Filtrar tickets
function filtrarTickets() {
    const searchText = document.getElementById('ticket-search').value.toLowerCase();
    const filterEstado = document.getElementById('ticket-filter-estado').value;
    const filterTipo = document.getElementById('ticket-filter-tipo').value;

    let filtrados = tickets;

    if (searchText) {
        filtrados = filtrados.filter(t => {
            const titulo = (t.titulo || '').toLowerCase();
            const empleadoNombre = (t.empleado_nombre || '').toLowerCase();
            const tipo = (t.tipo || '').toLowerCase();
            const descripcion = (t.descripcion || '').toLowerCase();
            
            return titulo.includes(searchText) ||
                   empleadoNombre.includes(searchText) ||
                   tipo.includes(searchText) ||
                   descripcion.includes(searchText);
        });
    }

    if (filterEstado) {
        filtrados = filtrados.filter(t => t.estado === filterEstado);
    }

    if (filterTipo) {
        filtrados = filtrados.filter(t => t.tipo === filterTipo);
    }

    renderTicketsList(filtrados);
}

// Cargar empleados ausentes
async function loadEmpleadosAusentes() {
    try {
        const response = await fetch(`${API_URL}/empleados/ausentes`);
        const data = await response.json();
        
        // Asegurar que ausentes sea un array
        const ausentes = Array.isArray(data) ? data : (data.success === false ? [] : []);

        document.getElementById('stat-empleados-ausentes').textContent = ausentes.length;

        const container = document.getElementById('empleados-ausentes-list');

        if (ausentes.length === 0) {
            container.innerHTML = '<p class="empty-state">✅ No hay empleados ausentes hoy</p>';
            return;
        }

        const ausentesHTML = ausentes.map(ausente => `
            <div class="ausente-card">
                <div class="ausente-info">
                    <h4>${ausente.empleado}</h4>
                    <p>${ausente.puesto} - ${ausente.area}</p>
                </div>
                <div class="ausente-detalle">
                    <span class="badge ${getBadgeClassForMotivo(ausente.motivo_ausencia)}">
                        ${getNombreTipo(ausente.motivo_ausencia)}
                    </span>
                    <p class="ausente-fechas">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(ausente.fecha_desde)} - ${formatDate(ausente.fecha_hasta)}
                    </p>
                    <p class="ausente-dias">
                        <strong>${ausente.dias_ausente}</strong> días ausente | 
                        <strong>${ausente.dias_restantes}</strong> días restantes
                    </p>
                </div>
            </div>
        `).join('');

        container.innerHTML = ausentesHTML;
    } catch (error) {
        console.error('Error:', error);
        // Si la API no existe, mostrar mensaje informativo
        if (document.getElementById('stat-empleados-ausentes')) {
            document.getElementById('stat-empleados-ausentes').textContent = '-';
        }
        document.getElementById('empleados-ausentes-list').innerHTML =
            '<p class="empty-state"><i class="fas fa-info-circle"></i> Función de ausentes pendiente de implementación</p>';
    }
}

// Obtener clase de badge según motivo
function getBadgeClassForMotivo(motivo) {
    const clases = {
        'vacaciones': 'badge-info',
        'licencia_medica': 'badge-warning',
        'licencia_maternidad': 'badge-success',
        'viaje': 'badge-primary',
        'suspension': 'badge-danger'
    };
    return clases[motivo] || 'badge-secondary';
}

// Obtener nombre del tipo
function getNombreTipo(tipo) {
    const nombres = {
        'vacaciones': '🏖️ Vacaciones',
        'viaje': '✈️ Viaje',
        'licencia_medica': '🏥 Licencia Médica',
        'licencia_maternidad': '👶 Maternidad/Paternidad',
        'suspension': '⚠️ Suspensión'
    };
    return nombres[tipo] || tipo;
}

// Permisos
function canApproveTickets() {
    const can = currentUser && (currentUser.rol === 'superadmin' || currentUser.rol === 'admin' || currentUser.rol === 'rrhh' || currentUser.rol === 'manager');
    console.log('canApproveTickets:', can, '(rol:', currentUser?.rol, ')');
    return can;
}

function canEditTickets() {
    const can = currentUser && (currentUser.rol === 'superadmin' || currentUser.rol === 'admin' || currentUser.rol === 'rrhh');
    console.log('canEditTickets:', can, '(rol:', currentUser?.rol, ')');
    return can;
}

// Cambiar estado de ticket
async function cambiarEstadoTicket(ticketId, nuevoEstado) {
    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const result = await response.json();
        if (result.success) {
            showToast(`✅ Ticket ${nuevoEstado}`, 'success');
            // Recargar tickets
            loadAllTickets();
        } else {
            showToast('❌ Error al actualizar ticket', 'error');
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        showToast('❌ Error al actualizar ticket', 'error');
    }
}

function canEditEmployees() {
    return currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'rrhh');
}

// Función para editar empleado
function editarEmpleado(id) {
    // Cerrar modal de perfil
    modalPerfil.style.display = 'none';

    // Cargar datos del empleado en el formulario
    const empleado = empleados.find(e => e.id === id);
    if (!empleado) {
        showToast('error', 'Error', 'No se encontró el empleado');
        return;
    }

    // Helper para formatear fechas (extraer solo YYYY-MM-DD)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    };

    // Datos personales (usar snake_case de Supabase)
    if (document.getElementById('nombreCompleto')) document.getElementById('nombreCompleto').value = empleado.nombre_completo || '';
    if (document.getElementById('cuil')) document.getElementById('cuil').value = empleado.cuil || '';
    if (document.getElementById('documento')) document.getElementById('documento').value = empleado.documento || '';
    if (document.getElementById('fechaNacimiento')) document.getElementById('fechaNacimiento').value = formatDate(empleado.fecha_nacimiento);
    if (document.getElementById('estadoCivil')) document.getElementById('estadoCivil').value = empleado.estado_civil || '';
    if (document.getElementById('integracionFamiliar')) document.getElementById('integracionFamiliar').value = empleado.integracion_familiar || '';
    if (document.getElementById('escolaridadFamiliar')) document.getElementById('escolaridadFamiliar').value = empleado.escolaridad_familiar || '';
    if (document.getElementById('nivelEducativo')) document.getElementById('nivelEducativo').value = empleado.nivel_educativo || '';
    if (document.getElementById('problemasSalud')) document.getElementById('problemasSalud').value = empleado.problemas_salud || '';
    if (document.getElementById('esExtranjero')) document.getElementById('esExtranjero').value = empleado.es_extranjero || 'no';
    if (document.getElementById('paisOrigen')) document.getElementById('paisOrigen').value = empleado.pais_origen || '';
    if (document.getElementById('fechaEntradaPais')) document.getElementById('fechaEntradaPais').value = formatDate(empleado.fecha_entrada_pais);
    if (document.getElementById('tipoResidencia')) document.getElementById('tipoResidencia').value = empleado.tipo_residencia || '';
    if (document.getElementById('entradasSalidasPais')) document.getElementById('entradasSalidasPais').value = empleado.entradas_salidas_pais || '';
    if (document.getElementById('experienciaLaboral')) document.getElementById('experienciaLaboral').value = empleado.experiencia_laboral || '';
    if (document.getElementById('fechaIngreso')) document.getElementById('fechaIngreso').value = formatDate(empleado.fecha_ingreso);
    if (document.getElementById('puesto')) document.getElementById('puesto').value = empleado.puesto || '';
    if (document.getElementById('sueldo')) document.getElementById('sueldo').value = empleado.sueldo || '';
    if (document.getElementById('antecedentesPenales')) document.getElementById('antecedentesPenales').value = empleado.antecedentes_penales || 'no';
    if (document.getElementById('observacionesAntecedentes')) document.getElementById('observacionesAntecedentes').value = empleado.observaciones_antecedentes || '';
    if (document.getElementById('observaciones')) document.getElementById('observaciones').value = empleado.observaciones || '';

    // Guardar el ID del empleado que estamos editando
    empleadoForm.dataset.editId = id;

    // Cambiar a la pestaña de edición
    document.querySelector('[data-tab="nuevo"]').click();

    // Cambiar el título del sidebar y de la página
    const navButton = document.querySelector('[data-tab="nuevo"]');
    if (navButton) {
        navButton.innerHTML = '<i class="fas fa-user-edit"></i><span>Editar Empleado</span>';
    }
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Empleado';
    }

    // Cambiar el título de la sección de registro
    const registroTitle = document.querySelector('.tab-content[data-tab="nuevo"] h3');
    if (registroTitle) {
        registroTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Información del Empleado';
    }

    // Cambiar el título y el botón
    const submitBtn = empleadoForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Empleado';
    }

    showToast('info', 'Modo Edición', 'Modifica los datos y guarda los cambios');
}

// Event listeners para tabs de tickets
document.querySelectorAll('.ticket-tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.ticket-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const tab = this.dataset.tickettab;
        filtrarPorTab(tab);
    });
});

function filtrarPorTab(tab) {
    let filtrados = tickets;

    switch (tab) {
        case 'pendientes':
            filtrados = tickets.filter(t => t.estado === 'pendiente');
            break;
        case 'ausentes':
            loadEmpleadosAusentes();
            return;
        case 'vacaciones':
            filtrados = tickets.filter(t => t.tipo === 'vacaciones');
            break;
        case 'cambios':
            filtrados = tickets.filter(t =>
                t.tipo.includes('cambio_') || t.tipo === 'desvinculacion' || t.tipo === 'reincorporacion'
            );
            break;
    }

    renderTicketsList(filtrados);
}

// Cerrar modales de tickets al hacer click fuera
document.getElementById('modal-ticket')?.addEventListener('click', function (e) {
    if (e.target === this) closeTicketModal();
});

document.getElementById('modal-ticket-detalle')?.addEventListener('click', function (e) {
    if (e.target === this) closeTicketDetalleModal();
});

document.querySelector('.modal-close-ticket')?.addEventListener('click', closeTicketModal);
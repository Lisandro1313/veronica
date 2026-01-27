// Estado de la aplicación
let currentUser = null;
let currentEmpresa = null;
let empresas = [];
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
const btnCambiarEmpresa = document.getElementById('btn-cambiar-empresa');
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
            'editar': '<i class="fas fa-user-edit"></i> Editar Empleado',
            'tickets': '<i class="fas fa-clipboard-list"></i> Tickets',
            'reportes': '<i class="fas fa-file-pdf"></i> Reportes',
            'alertas': '<i class="fas fa-bell"></i> Alertas',
            'auditoria': '<i class="fas fa-history"></i> Auditoría',
            'usuarios': '<i class="fas fa-users-cog"></i> Usuarios y Permisos'
        };
        pageTitle.innerHTML = titles[tabName];

        // Resetear formulario y botón cuando se cambia de tab
        if (tabName === 'nuevo') {
            if (empleadoForm.dataset.editId) {
                empleadoForm.removeAttribute('data-edit-id');
                empleadoForm.reset();
                const submitBtn = empleadoForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Empleado';
                }
            }
        }

        // Cargar datos según la tab
        if (tabName === 'dashboard') {
            loadDashboard();
        } else if (tabName === 'lista') {
            loadEmpleados();
        } else if (tabName === 'tickets') {
            loadAllTickets();
        } else if (tabName === 'alertas') {
            loadAlertas();
        } else if (tabName === 'auditoria') {
            loadAuditoria();
        } else if (tabName === 'usuarios') {
            loadUsuarios();
        }
    });
});

// ===== AUTENTICACIÓN =====

// Variables para el captcha de literatura/gramática
let captchaAnswer;

// Banco de preguntas con opciones múltiples
const captchaQuestions = [
    {
        question: '¿Quién escribió "Don Quijote de la Mancha"?',
        correct: 'Cervantes',
        options: ['Cervantes', 'Shakespeare', 'Borges']
    },
    {
        question: '¿Cuál es el sujeto en "El perro ladra fuerte"?',
        correct: 'El perro',
        options: ['El perro', 'Ladra', 'Fuerte']
    },
    {
        question: '¿Qué color tiene el caballo blanco de San Martín?',
        correct: 'Blanco',
        options: ['Blanco', 'Negro', 'Marrón']
    },
    {
        question: '¿Cuántas vocales tiene el abecedario español?',
        correct: '5',
        options: ['5', '7', '3']
    },
    {
        question: 'En "María canta bien", ¿cuál es el verbo?',
        correct: 'Canta',
        options: ['Canta', 'María', 'Bien']
    },
    {
        question: '¿Quién escribió "Martín Fierro"?',
        correct: 'José Hernández',
        options: ['José Hernández', 'Jorge Luis Borges', 'Julio Cortázar']
    },
    {
        question: '¿Cuál es la capital de Argentina?',
        correct: 'Buenos Aires',
        options: ['Buenos Aires', 'Córdoba', 'Rosario']
    },
    {
        question: 'En "Los niños juegan", ¿cuál es el sujeto?',
        correct: 'Los niños',
        options: ['Los niños', 'Juegan', 'Los']
    },
    {
        question: '¿Cómo se llama la montaña más alta de América?',
        correct: 'Aconcagua',
        options: ['Aconcagua', 'Everest', 'Kilimanjaro']
    },
    {
        question: '¿Cuántas letras tiene la palabra "casa"?',
        correct: '4',
        options: ['4', '5', '3']
    },
    {
        question: 'En "El gato duerme", ¿qué hace el gato?',
        correct: 'Duerme',
        options: ['Duerme', 'Come', 'Corre']
    },
    {
        question: '¿Qué animal hace "miau"?',
        correct: 'Gato',
        options: ['Gato', 'Perro', 'Vaca']
    }
];

function generateCaptcha() {
    const randomQuestion = captchaQuestions[Math.floor(Math.random() * captchaQuestions.length)];
    captchaAnswer = randomQuestion.correct;

    // Actualizar la pregunta
    document.getElementById('captcha-question').textContent = randomQuestion.question;

    // Limpiar y llenar el select con las opciones mezcladas
    const selectElement = document.getElementById('captcha');
    selectElement.innerHTML = '<option value="">-- Selecciona una respuesta --</option>';

    // Mezclar las opciones aleatoriamente
    const shuffledOptions = [...randomQuestion.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

// Generar captcha al cargar
generateCaptcha();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const captchaInput = document.getElementById('captcha').value;

    // Validar captcha
    if (!captchaInput || captchaInput !== captchaAnswer) {
        showToast('error', 'Error', 'Por favor selecciona la respuesta correcta.');
        generateCaptcha();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.usuario;

            // Ocultar botón de usuarios si no tiene permisos
            const navUsuarios = document.getElementById('nav-usuarios');
            if (navUsuarios) {
                if (currentUser.permisos.usuarios && currentUser.permisos.usuarios.ver) {
                    navUsuarios.style.display = 'flex';
                } else {
                    navUsuarios.style.display = 'none';
                }
            }

            // Si es supervisor, entrar directo a configuración sin elegir empresa
            if (currentUser.rol === 'supervisor') {
                currentEmpresa = { id: 1, nombre: 'Configuración Global' };
                localStorage.setItem('empresaId', JSON.stringify(currentEmpresa));
                showMainScreen();
                
                // Mostrar la sección de usuarios (configuración)
                setTimeout(() => {
                    document.querySelector('[data-tab="usuarios"]').click();
                }, 300);
            } else {
                // Mostrar pantalla de empresas
                showEmpresaScreen();
            }
            
            // Regenerar captcha para la próxima vez
            generateCaptcha();
            document.getElementById('captcha').value = '';
        } else {
            showToast('error', 'Error de Login', data.mensaje);
            // Regenerar captcha en caso de error
            generateCaptcha();
            document.getElementById('captcha').value = '';
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo conectar con el servidor');
        console.error(error);
        // Regenerar captcha en caso de error
        generateCaptcha();
        document.getElementById('captcha').value = '';
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentEmpresa = null;
    empleados = [];
    tickets = [];
    localStorage.removeItem('empresaId');
    showLoginScreen();
    loginForm.reset();
    generateCaptcha();
    showToast('info', 'Sesión Cerrada', 'Has cerrado sesión correctamente');
});

// Botón para cambiar de empresa
btnCambiarEmpresa?.addEventListener('click', () => {
    currentEmpresa = null;
    empleados = [];
    tickets = [];
    localStorage.removeItem('empresaId');
    showEmpresaScreen();
    showToast('info', 'Cambiar Empresa', 'Selecciona una empresa para continuar');
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
        if (!currentEmpresa || !currentEmpresa.id) {
            console.error('No hay empresa seleccionada para dashboard');
            return;
        }

        console.log('📊 Cargando dashboard de empresa:', currentEmpresa.nombre);
        const response = await fetch(`${API_URL}/empleados?empresa_id=${currentEmpresa.id}&t=${Date.now()}`);
        empleados = await response.json();
        console.log('📊 Empleados para dashboard:', empleados.length);

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
        new Date(t.fecha) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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

    // Calcular y mostrar tendencias
    calcularTendencias();
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
        if (!e.laboral || !e.laboral.fechaIngreso) return false;
        const fecha = new Date(e.laboral.fechaIngreso);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    // Filtrar empleados del mes anterior
    const empleadosMesAnterior = empleados.filter(e => {
        if (!e.laboral || !e.laboral.fechaIngreso) return false;
        const fecha = new Date(e.laboral.fechaIngreso);
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
        .filter(e => e.laboral && e.laboral.salario)
        .map(e => e.laboral.salario);

    const salariosMesAnterior = empleadosMesAnterior
        .filter(e => e.laboral && e.laboral.salario)
        .map(e => e.laboral.salario);

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

    // Alertas del sistema
    empleados.forEach(emp => {
        // Antecedentes penales
        if (emp.antecedentesPenales === 'si') {
            alertas.push({
                tipo: 'critica',
                icono: 'fas fa-exclamation-triangle',
                titulo: 'Antecedentes Penales',
                descripcion: `${emp.nombreCompleto} tiene antecedentes penales registrados.`,
                empleadoId: emp.id,
                esPersonalizada: false
            });
        }

        // Problemas de salud
        if (emp.problemasSalud && emp.problemasSalud.trim() !== '') {
            alertas.push({
                tipo: 'info',
                icono: 'fas fa-heartbeat',
                titulo: 'Problema de Salud',
                descripcion: `${emp.nombreCompleto}: ${emp.problemasSalud.substring(0, 60)}...`,
                empleadoId: emp.id,
                esPersonalizada: false
            });
        }

        // Residencia temporaria o precaria
        if (emp.tipoResidencia === 'temporaria' || emp.tipoResidencia === 'precaria') {
            alertas.push({
                tipo: 'warning',
                icono: 'fas fa-id-card',
                titulo: 'Residencia ' + emp.tipoResidencia,
                descripcion: `${emp.nombreCompleto} tiene residencia ${emp.tipoResidencia}. Verificar vencimiento.`,
                empleadoId: emp.id,
                esPersonalizada: false
            });
        }
    });

    // Alertas personalizadas del localStorage
    const alertasPersonalizadas = JSON.parse(localStorage.getItem('alertasPersonalizadas')) || [];
    alertasPersonalizadas.filter(a => a.estado === 'activa' && a.fecha && a.titulo && a.mensaje).forEach(alerta => {
        const empleado = alerta.empleadoId ? empleados.find(e => e.id == alerta.empleadoId) : null;

        // Si es alerta de empleado específico, verificar que el empleado exista
        if (alerta.empleadoId && !empleado) {
            return; // Skip esta alerta si el empleado no existe
        }

        const iconosMap = {
            'vacaciones': 'fas fa-umbrella-beach',
            'permiso': 'fas fa-clipboard-check',
            'licencia': 'fas fa-hospital',
            'vencimiento': 'fas fa-calendar-times',
            'cumpleaños': 'fas fa-birthday-cake',
            'aniversario': 'fas fa-calendar-star',
            'recordatorio': 'fas fa-bell',
            'urgente': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle'
        };

        const tipoMap = {
            'urgente': 'critica',
            'vencimiento': 'warning',
            'vacaciones': 'info',
            'permiso': 'info',
            'licencia': 'warning',
            'cumpleaños': 'info',
            'aniversario': 'info',
            'recordatorio': 'info',
            'info': 'info'
        };

        // Verificar si está vencida
        const hoy = new Date();
        const fechaAlerta = alerta.fechaVencimiento ? new Date(alerta.fechaVencimiento) : null;
        const estaVencida = fechaAlerta && fechaAlerta < hoy;

        alertas.push({
            tipo: estaVencida ? 'danger' : (tipoMap[alerta.tipo] || 'info'),
            icono: iconosMap[alerta.tipo] || 'fas fa-bell',
            titulo: alerta.titulo,
            descripcion: empleado ? `${empleado.nombreCompleto}: ${alerta.mensaje}` : alerta.mensaje,
            empleadoId: alerta.empleadoId,
            esPersonalizada: true,
            alertaId: alerta.id,
            fechaVencimiento: alerta.fechaVencimiento,
            estaVencida: estaVencida
        });
    });

    // Ordenar por prioridad y fecha
    alertas.sort((a, b) => {
        const prioridad = { 'critica': 1, 'danger': 2, 'warning': 3, 'info': 4 };
        return (prioridad[a.tipo] || 5) - (prioridad[b.tipo] || 5);
    });

    if (alertas.length === 0) {
        alertasContainer.innerHTML = '<p class="empty-state">✅ No hay alertas prioritarias.</p>';
        return;
    }

    alertasContainer.innerHTML = alertas.map(a => `
        <div class="alerta-item ${a.tipo} ${a.estaVencida ? 'vencida' : ''}" style="cursor: ${a.empleadoId ? 'pointer' : 'default'};" ${a.empleadoId ? `onclick="verPerfil(${a.empleadoId})"` : ''}>
            <i class="${a.icono}"></i>
            <div class="alerta-content" style="flex: 1;">
                <h4>${a.titulo} ${a.estaVencida ? '<span class="badge-vencida">VENCIDA</span>' : ''}</h4>
                <p>${a.descripcion}</p>
                ${a.fechaVencimiento ? `<small><i class="fas fa-calendar"></i> Vencimiento: ${formatDate(a.fechaVencimiento)}</small>` : ''}
            </div>
            ${a.esPersonalizada ? `
                <div class="alerta-actions" onclick="event.stopPropagation();">
                    <button class="btn-icon-small" onclick="editarAlerta(${a.alertaId})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-small btn-warning" onclick="anularAlerta(${a.alertaId})" title="Anular">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="btn-icon-small btn-danger" onclick="eliminarAlerta(${a.alertaId})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
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

    // Validar solo nombre completo (único campo obligatorio)
    const nombre = document.getElementById('nombreCompleto').value.trim();
    if (!nombre || nombre.length < 3) {
        errores.push({ campo: 'nombreCompleto', mensaje: 'Nombre completo es obligatorio (mínimo 3 caracteres)' });
    } else {
        limpiarErrorCampo('nombreCompleto');
    }

    // CUIL sin validación - acepta cualquier texto
    limpiarErrorCampo('cuil');

    // Fecha de nacimiento sin validación obligatoria
    limpiarErrorCampo('fechaNacimiento');

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
        empresaId: currentEmpresa?.id || currentUser?.empresaId || null,

        estadoCivil: document.getElementById('estadoCivil').value,
        tienePareja: document.getElementById('tienePareja')?.value || 'no',
        cantidadHijos: parseInt(document.getElementById('cantidadHijos')?.value || '0'),
        hijosACargo: parseInt(document.getElementById('hijosACargo')?.value || '0'),
        hijosConviven: parseInt(document.getElementById('hijosConviven')?.value || '0'),
        familiaresACargo: parseInt(document.getElementById('familiaresACargo')?.value || '0'),
        escolaridadFamiliar: document.getElementById('escolaridadFamiliar')?.value || '',

        // Datos de Vivienda
        vivienda: document.getElementById('vivienda')?.value || '',
        direccion: document.getElementById('direccion')?.value || '',
        provincia: document.getElementById('provincia')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        numeroLoteInvernaculo: document.getElementById('numeroLoteInvernaculo')?.value || '',

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
        sueldo: document.getElementById('sueldo')?.value || null,

        antecedentesPenales: document.getElementById('antecedentesPenales').value,
        observacionesAntecedentes: document.getElementById('observacionesAntecedentes').value,

        observaciones: document.getElementById('observaciones').value
    };

    // Agregar empresa_id
    empleadoData.empresa_id = currentEmpresa?.id || 1;

    // Obtener botón de submit y mostrar loading
    const submitBtn = empleadoForm.querySelector('button[type="submit"]');
    const textoOriginal = submitBtn.textContent;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    try {
        // Detectar si es edición o creación
        const editId = empleadoForm.dataset.editId;
        const isEdit = editId && editId !== '';

        const url = isEdit ? `${API_URL}/empleados/${editId}` : `${API_URL}/empleados`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData)
        });

        const data = await response.json();

        if (data.success) {
            // Registrar en auditoría
            registrarAuditoria(
                isEdit ? 'editado' : 'creado',
                'empleado',
                `${empleadoData.nombreCompleto} - CUIL: ${empleadoData.cuil}`,
                data.data?.id || editId
            );

            showToast('success', isEdit ? 'Empleado Actualizado' : 'Empleado Registrado',
                isEdit ? 'Los cambios se guardaron correctamente' : 'El empleado se ha registrado correctamente');

            empleadoForm.reset();
            delete empleadoForm.dataset.editId;

            // Restaurar texto del botón
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Empleado';

            // Cambiar a la tab de lista
            document.querySelector('[data-tab="lista"]').click();

            // Recargar empleados
            await loadEmpleados();
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo guardar el empleado');
        console.error(error);
    } finally {
        // Restaurar botón
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
});

// ===== MAPEO DE CAMPOS =====

// Función auxiliar para mapear campos snake_case a camelCase
function mapearEmpleado(emp) {
    return {
        ...emp,
        nombreCompleto: emp.nombre_completo || emp.nombreCompleto,
        fechaNacimiento: emp.fecha_nacimiento || emp.fechaNacimiento,
        estadoCivil: emp.estado_civil || emp.estadoCivil,
        tienePareja: emp.tiene_pareja || emp.tienePareja,
        cantidadHijos: emp.cantidad_hijos || emp.cantidadHijos,
        hijosACargo: emp.hijos_a_cargo || emp.hijosACargo,
        hijosConviven: emp.hijos_conviven || emp.hijosConviven,
        familiaresACargo: emp.familiares_a_cargo || emp.familiaresACargo,
        integracionFamiliar: emp.integracion_familiar || emp.integracionFamiliar,
        escolaridadFamiliar: emp.escolaridad_familiar || emp.escolaridadFamiliar,
        nivelEducativo: emp.nivel_educativo || emp.nivelEducativo,
        problemasSalud: emp.problemas_salud || emp.problemasSalud,
        esExtranjero: emp.es_extranjero || emp.esExtranjero,
        paisOrigen: emp.pais_origen || emp.paisOrigen,
        fechaEntradaPais: emp.fecha_entrada_pais || emp.fechaEntradaPais,
        tipoResidencia: emp.tipo_residencia || emp.tipoResidencia,
        entradasSalidasPais: emp.entradas_salidas_pais || emp.entradasSalidasPais,
        antecedentesPenales: emp.antecedentes_penales || emp.antecedentesPenales,
        observacionesAntecedentes: emp.observaciones_antecedentes || emp.observacionesAntecedentes,
        fechaIngreso: emp.fecha_ingreso || emp.fechaIngreso,
        experienciaLaboral: emp.experiencia_laboral || emp.experienciaLaboral,
        // Campos de contacto
        calle: emp.calle,
        numero: emp.numero,
        localidad: emp.localidad
    };
}

// ===== CARGAR Y MOSTRAR EMPLEADOS =====

async function loadEmpleados() {
    try {
        if (!currentEmpresa || !currentEmpresa.id) {
            console.error('No hay empresa seleccionada');
            empleadosList.innerHTML = '<p class="loading">⚠️ Selecciona una empresa primero</p>';
            return;
        }

        console.log('🔍 Cargando empleados de empresa:', currentEmpresa.nombre, 'ID:', currentEmpresa.id);
        const url = `${API_URL}/empleados?empresa_id=${currentEmpresa.id}&t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('📊 Empleados recibidos:', data.length);
        empleados = data.map(mapearEmpleado);
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
                            <button class="btn-small btn-warning" onclick="editarEmpleado(${emp.id})">✏️ Editar</button>
                            <button class="btn-small btn-primary" onclick="crearTicket(${emp.id})">📋 Ticket</button>
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

    const empleado = empleados.find(e => e.id === id);
    if (!empleado) {
        alert('❌ Empleado no encontrado');
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
            // Registrar en auditoría
            registrarAuditoria(
                'eliminado',
                'empleado',
                `${empleado.nombreCompleto} - CUIL: ${empleado.cuil}`,
                id
            );

            showToast('success', 'Empleado Eliminado', 'El empleado se ha eliminado correctamente');
            loadEmpleados();
        }
    } catch (error) {
        showToast('error', 'Error', 'No se pudo eliminar el empleado');
        console.error(error);
    }
}

// ===== IMPRIMIR PERFIL =====

function imprimirPerfil() {
    // Obtener el contenido del perfil desde el modal
    const perfilContent = document.getElementById('perfil-content');
    if (!perfilContent || !perfilContent.innerHTML) {
        console.error('No hay contenido de perfil para imprimir');
        return;
    }

    const ventana = window.open('', '_blank');
    const estilos = `
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            .perfil-header { border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-bottom: 20px; }
            .perfil-header h2 { margin: 0; color: #1a73e8; }
            .perfil-tabs { display: none; }
            .perfil-section { margin-bottom: 30px; page-break-inside: avoid; }
            .perfil-section h3 { color: #1a73e8; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
            .perfil-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .perfil-item { padding: 8px 0; }
            .perfil-item strong { color: #333; display: inline-block; min-width: 150px; }
            .timeline-item { border-left: 3px solid #1a73e8; padding-left: 15px; margin-bottom: 15px; }
            .perfil-actions { display: none !important; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-success { background: #4caf50; color: white; }
            @media print { 
                body { margin: 0; }
                .perfil-actions { display: none !important; }
            }
        </style>
    `;

    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Perfil de Empleado</title>
            <meta charset="UTF-8">
            ${estilos}
        </head>
        <body>
            ${perfilContent.innerHTML}
        </body>
        </html>
    `);
    ventana.document.close();

    // Imprimir automáticamente después de cargar
    setTimeout(() => {
        ventana.print();
    }, 500);
}

// ===== VER PERFIL COMPLETO =====

async function verPerfil(id) {
    try {
        const response = await fetch(`${API_URL}/empleados/${id}`);
        const empData = await response.json();
        const emp = mapearEmpleado(empData);

        const perfilHTML = `
            <div class="perfil-header">
                <h2><i class="fas fa-user-circle"></i> ${escapeHtml(emp.nombreCompleto || 'Sin nombre')}</h2>
                <span class="badge badge-success">Activo</span>
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
                                <span>${escapeHtml(emp.cuil || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Documento:</label>
                                <span>${escapeHtml(emp.documento || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Nacimiento:</label>
                                <span>${emp.fechaNacimiento ? formatDate(emp.fechaNacimiento) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Estado Civil:</label>
                                <span>${escapeHtml(emp.estadoCivil || '-')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-users"></i> Composición Familiar</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>¿Tiene Pareja?:</label>
                                <span>${emp.tienePareja === 'si' ? 'Sí' : 'No'}</span>
                            </div>
                            <div class="info-item">
                                <label>Cantidad de Hijos:</label>
                                <span>${emp.cantidadHijos || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Hijos a Cargo:</label>
                                <span>${emp.hijosACargo || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Hijos que Conviven:</label>
                                <span>${emp.hijosConviven || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Familiares a Cargo:</label>
                                <span>${emp.familiaresACargo || 0}</span>
                            </div>
                        </div>
                        ${emp.escolaridadFamiliar ? `<p><strong>Observaciones:</strong> ${escapeHtml(emp.escolaridadFamiliar)}</p>` : ''}
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-graduation-cap"></i> Educación</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Nivel Educativo:</label>
                                <span>${escapeHtml(emp.nivelEducativo || '-')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="perfil-section">
                        <h3><i class="fas fa-heartbeat"></i> Salud</h3>
                        ${emp.problemasSalud ? `
                            <div class="alert alert-warning">
                                <strong>⚠️ Observaciones de Salud:</strong> ${escapeHtml(emp.problemasSalud)}
                            </div>
                        ` : '<p class="text-muted">Sin problemas de salud reportados</p>'}
                    </div>
                    
                    ${emp.esExtranjero === 'si' ? `
                    <div class="perfil-section">
                        <h3><i class="fas fa-globe"></i> Información Migratoria</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>País de Origen:</label>
                                <span>${escapeHtml(emp.paisOrigen || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Entrada:</label>
                                <span>${emp.fechaEntradaPais ? formatDate(emp.fechaEntradaPais) : '-'}</span>
                            </div>
                            <div class="info-item">
                                <label>Tipo de Residencia:</label>
                                <span>${escapeHtml(emp.tipoResidencia || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Entradas/Salidas:</label>
                                <span>${escapeHtml(emp.entradasSalidasPais || '-')}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${emp.antecedentesPenales === 'si' ? `
                    <div class="perfil-section">
                        <h3><i class="fas fa-exclamation-triangle"></i> Antecedentes</h3>
                        <div class="alert alert-danger">
                            <strong>⚠️ Tiene antecedentes penales</strong><br>
                            ${emp.observacionesAntecedentes ? escapeHtml(emp.observacionesAntecedentes) : 'Ver detalles en documentación'}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-contacto">
                <div class="perfil-grid">
                    <div class="perfil-section">
                        <h3><i class="fas fa-map-marker-alt"></i> Dirección y Contacto</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Teléfono:</label>
                                <span>${escapeHtml(emp.telefono || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Provincia:</label>
                                <span>${escapeHtml(emp.provincia || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Vivienda:</label>
                                <span>${escapeHtml(emp.vivienda || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Dirección:</label>
                                <span>${escapeHtml(emp.direccion || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Número de Lote/Invernadero:</label>
                                <span>${escapeHtml(emp.numeroLoteInvernaculo || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Calle:</label>
                                <span>${escapeHtml(emp.calle || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Número:</label>
                                <span>${escapeHtml(emp.numero || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Localidad:</label>
                                <span>${escapeHtml(emp.localidad || '-')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-familiares">
                <div class="perfil-grid">
                    <div class="perfil-section">
                        <h3><i class="fas fa-users"></i> Composición Familiar</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>¿Tiene Pareja?:</label>
                                <span>${emp.tienePareja ? 'Sí' : 'No'}</span>
                            </div>
                            <div class="info-item">
                                <label>Cantidad de Hijos:</label>
                                <span>${emp.cantidadHijos || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Hijos a Cargo:</label>
                                <span>${emp.hijosACargo || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Hijos que Conviven:</label>
                                <span>${emp.hijosConviven || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Familiares a Cargo:</label>
                                <span>${emp.familiaresACargo || 0}</span>
                            </div>
                        </div>
                        ${emp.integracionFamiliar ? `<div class="alert alert-info"><strong>Integración Familiar:</strong> ${escapeHtml(emp.integracionFamiliar)}</div>` : ''}
                        ${emp.escolaridadFamiliar ? `<div class="alert alert-info"><strong>Escolaridad Familiar:</strong> ${escapeHtml(emp.escolaridadFamiliar)}</div>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-laboral">
                <div class="perfil-grid">
                    <div class="perfil-section">
                        <h3><i class="fas fa-briefcase"></i> Información Laboral</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Puesto:</label>
                                <span>${escapeHtml(emp.puesto || '-')}</span>
                            </div>
                            <div class="info-item">
                                <label>Fecha de Ingreso:</label>
                                <span>${emp.fechaIngreso ? formatDate(emp.fechaIngreso) : '-'}</span>
                            </div>
                        </div>
                        ${emp.experienciaLaboral ? `<p><strong>Experiencia:</strong> ${escapeHtml(emp.experienciaLaboral)}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-documentos">
                <div class="perfil-section">
                    <h3><i class="fas fa-file-alt"></i> Documentos Adjuntos</h3>
                    
                    <div class="documentos-upload" style="margin-bottom: 20px;">
                        <div class="upload-area" style="border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 15px;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 2em; color: #666; margin-bottom: 10px;"></i>
                            <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                            <input type="file" id="documento-input-${emp.id}" accept=".pdf,.doc,.docx,.jpg,.png,.jpeg" style="display: none;" onchange="subirDocumento(${emp.id}, this)">
                            <button class="btn btn-primary" onclick="document.getElementById('documento-input-${emp.id}').click()">
                                <i class="fas fa-plus"></i> Agregar Documento
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="text" id="documento-descripcion-${emp.id}" placeholder="Descripción del documento (opcional)" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <div class="documentos-list" id="documentos-lista-${emp.id}">
                        <div class="loading-docs">
                            <i class="fas fa-spinner fa-spin"></i> Cargando documentos...
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="perfil-tab-content" id="perfil-tab-historial">
                <div class="perfil-section">
                    <h3><i class="fas fa-timeline"></i> Historial Laboral y Eventos</h3>
                    <p class="text-muted">No hay historial registrado</p>
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
            
            <div class="perfil-actions" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color); display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="imprimirPerfil()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
                ${canEditEmployees() ? `
                    <button class="btn btn-primary" onclick="editarEmpleado(${id})">
                        <i class="fas fa-edit"></i> Editar Empleado
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="modalPerfil.style.display='none'">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;

        document.getElementById('perfil-content').innerHTML = perfilHTML;
        modalPerfil.style.display = 'block';

        // Activar tabs del perfil
        activatePerfilTabs();

        // Cargar tickets del empleado
        loadTicketsEmpleado(emp.id);

        // Cargar documentos del empleado
        loadDocumentosEmpleado(emp.id);

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
        if (!container) {
            console.error('Container no encontrado para tickets de empleado:', empleadoId);
            return;
        }

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

    const tipo = document.getElementById('ticket-tipo').value;
    const empleadoSelect = document.getElementById('ticket-empleado-select');

    if (!empleadoSelect || !empleadoSelect.value) {
        alert('❌ Debe seleccionar un empleado');
        return;
    }

    const ticketData = {
        empleadoId: parseInt(empleadoSelect.value),
        tipo: tipo,
        titulo: document.getElementById('ticket-titulo').value,
        descripcion: document.getElementById('ticket-descripcion').value || '',
        creadoPor: currentUser.nombre
    };

    // Agregar fechas según el tipo de ticket
    const camposPeriodo = document.getElementById('ticket-campos-periodo');
    const camposEvento = document.getElementById('ticket-campos-evento');
    const camposCambio = document.getElementById('ticket-campos-cambio');

    if (camposPeriodo && camposPeriodo.style.display !== 'none') {
        ticketData.fechaDesde = document.getElementById('ticket-fecha-desde').value;
        ticketData.fechaHasta = document.getElementById('ticket-fecha-hasta').value;
    }

    if (camposEvento && camposEvento.style.display !== 'none') {
        ticketData.fechaEvento = document.getElementById('ticket-fecha-evento').value;
    }

    if (camposCambio && camposCambio.style.display !== 'none') {
        ticketData.valorAnterior = document.getElementById('ticket-valor-anterior').value;
        ticketData.valorNuevo = document.getElementById('ticket-valor-nuevo').value;
        ticketData.actualizaEmpleado = document.getElementById('ticket-actualiza-empleado').checked;
    }

    // Obtener nombre del empleado
    const empleado = empleados.find(e => e.id === ticketData.empleadoId);
    ticketData.empleadoNombre = empleado ? empleado.nombreCompleto : 'Desconocido';

    // Agregar empresa_id
    ticketData.empresa_id = currentEmpresa?.id || 1;

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
            loadAllTickets();
        } else {
            alert('❌ Error al crear ticket: ' + (data.mensaje || 'Error desconocido'));
        }
    } catch (error) {
        alert('❌ Error al crear ticket');
        console.error(error);
    }
});

async function loadAllTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets?empresa_id=${currentEmpresa.id}`);
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
            <p><strong>Empleado:</strong> ${escapeHtml(t.nombre_completo || t.empleado_nombre || 'Sin nombre')}</p>
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

    // Ocultar pantalla de empresas
    const empresaScreen = document.getElementById('empresa-screen');
    if (empresaScreen) {
        empresaScreen.classList.remove('active');
        empresaScreen.style.display = 'none';
    }

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
    let columnas = [];

    switch (tipo) {
        case 'general':
            filteredData = empleados;
            nombreReporte = 'Reporte General de Personal';
            columnas = ['Nombre', 'CUIL', 'F. Nacimiento', 'Puesto', 'Área', 'Email', 'Teléfono', 'F. Ingreso'];
            break;
        case 'extranjeros':
            filteredData = empleados.filter(e => e.esExtranjero === 'si');
            nombreReporte = 'Reporte de Personal Extranjero';
            columnas = ['Nombre', 'CUIL', 'País', 'Residencia', 'Puesto'];
            break;
        case 'antecedentes':
            filteredData = empleados.filter(e => e.antecedentesPenales === 'si');
            nombreReporte = 'Reporte de Personal con Antecedentes';
            columnas = ['Nombre', 'CUIL', 'Puesto', 'Observaciones'];
            break;
        case 'salud':
            filteredData = empleados.filter(e => e.problemasSalud && e.problemasSalud.trim() !== '');
            nombreReporte = 'Reporte de Problemas de Salud';
            columnas = ['Nombre', 'CUIL', 'Puesto', 'Problema de Salud'];
            break;
        case 'familias':
            filteredData = empleados;
            nombreReporte = 'Reporte de Composición Familiar';
            columnas = ['Nombre', 'CUIL', 'Estado Civil', 'Tiene Pareja', 'Cant. Hijos', 'Hijos a Cargo'];
            break;
        case 'educacion':
            filteredData = empleados;
            nombreReporte = 'Reporte de Nivel Educativo';
            columnas = ['Nombre', 'CUIL', 'Puesto', 'Nivel Educativo'];
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
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        ${columnas.map(col => `<th style="border: 1px solid #ddd; padding: 6px;">${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(emp => {
        let row = '';
        switch (tipo) {
            case 'general':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto || ''}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.fechaNacimiento ? formatDate(emp.fechaNacimiento) : '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.puesto || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.area || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.email || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.telefono || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.fechaIngreso ? formatDate(emp.fechaIngreso) : '-'}</td>
                                `;
                break;
            case 'extranjeros':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.paisOrigen || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.tipoResidencia || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.puesto || '-'}</td>
                                `;
                break;
            case 'antecedentes':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.puesto || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.observacionesAntecedentes || '-'}</td>
                                `;
                break;
            case 'salud':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.puesto || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.problemasSalud || '-'}</td>
                                `;
                break;
            case 'familias':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.estadoCivil || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.tienePareja || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cantidadHijos || '0'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.hijosACargo || '0'}</td>
                                `;
                break;
            case 'educacion':
                row = `
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nombreCompleto}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.cuil}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.puesto || '-'}</td>
                                    <td style="border: 1px solid #ddd; padding: 6px;">${emp.nivelEducativo || '-'}</td>
                                `;
                break;
        }
        return `<tr>${row}</tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Abrir en nueva ventana para imprimir
    const ventana = window.open('', '_blank');
    ventana.document.write(html);
    ventana.document.close();

    // Esperar que cargue y luego mostrar mensaje
    setTimeout(() => {
        showToast('success', 'Reporte Generado', 'Use Ctrl+P para imprimir o guardar como PDF');
    }, 500);
}

function exportarExcel() {
    if (empleados.length === 0) {
        alert('⚠️ No hay datos para exportar.');
        return;
    }

    // Debug: Ver qué campos tiene el primer empleado
    console.log('📊 Exportando empleados. Ejemplo del primero:', empleados[0]);
    console.log('📊 Campos disponibles:', Object.keys(empleados[0]));
    console.log('📊 Total empleados en array:', empleados.length);

    // Crear CSV con campos que sabemos que existen
    const headers = ['ID', 'Nombre Completo', 'DNI', 'CUIL', 'Fecha Nacimiento', 'Estado Civil', 'Teléfono', 'Dirección', 'Provincia', 'Puesto', 'Fecha Ingreso'];
    let csv = headers.join(',') + '\n';

    empleados.forEach((emp, index) => {
        // Debug del primer empleado en el forEach
        if (index === 0) {
            console.log('📊 Dentro del forEach - primer empleado:', emp);
            console.log('📊 emp.nombreCompleto:', emp.nombreCompleto);
            console.log('📊 emp.nombre:', emp.nombre);
            console.log('📊 emp.apellido:', emp.apellido);
            console.log('📊 emp.nombre_completo:', emp.nombre_completo);
        }

        const row = [
            emp.id || '',
            emp.nombreCompleto || `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || emp.nombre_completo || 'Sin nombre',
            emp.dni || emp.documento || '',
            emp.cuil || '',
            emp.fechaNacimiento || '',
            emp.estadoCivil || '',
            emp.telefono || '',
            emp.direccion || '',
            emp.provincia || '',
            emp.puesto || '',
            emp.fechaIngreso || ''
        ].map(field => {
            // Escapar comillas y encerrar en comillas
            const str = String(field || '');
            return `"${str.replace(/"/g, '""')}"`;
        });

        csv += row.join(',') + '\n';
    });

    // Descargar con BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast('success', 'Excel Exportado', `${empleados.length} empleados exportados correctamente`);
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
            const antiguedad = emp.laboral ? calcularAntiguedad(emp.laboral.fechaIngreso) : 0;
            const fechaNacFormatted = datos.fechaNacimiento ? new Date(datos.fechaNacimiento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
            const fechaIngresoFormatted = emp.laboral?.fechaIngreso ? new Date(emp.laboral.fechaIngreso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';

            return {
                'ID': emp.id,
                'Nombre Completo': datos.nombreCompleto || '-',
                'DNI': datos.dni || '-',
                'CUIL': datos.cuil || '-',
                'Fecha Nacimiento': fechaNacFormatted,
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
                'Fecha Ingreso': fechaIngresoFormatted,
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
                    const fechaNacFamFormatted = fam.fechaNacimiento ? new Date(fam.fechaNacimiento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                    familiaresData.push({
                        'Empleado': datos.nombreCompleto || '-',
                        'DNI Empleado': datos.dni || '-',
                        'Familiar': fam.nombreCompleto || `${fam.nombre || ''} ${fam.apellido || ''}`.trim() || '-',
                        'Relación': fam.relacion,
                        'DNI Familiar': fam.dni || '-',
                        'CUIL Familiar': fam.cuil || '-',
                        'Fecha Nacimiento': fechaNacFamFormatted,
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
                    const fechaVencFormatted = doc.fechaVencimiento ? new Date(doc.fechaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Sin vencimiento';

                    documentosData.push({
                        'Empleado': datos.nombreCompleto || '-',
                        'DNI Empleado': datos.dni || '-',
                        'Tipo Documento': doc.tipo,
                        'Número': doc.numero || '-',
                        'Fecha Vencimiento': fechaVencFormatted,
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
            const ultimoExamenFormatted = salud.ultimoExamen ? new Date(salud.ultimoExamen).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';

            return {
                'Empleado': datos.nombreCompleto || '-',
                'DNI': datos.dni || '-',
                'Grupo Sanguíneo': salud.grupoSanguineo || '-',
                'Problemas de Salud': salud.problemasSalud === 'si' ? 'SÍ' : 'NO',
                'Descripción': salud.descripcionProblemas || '-',
                'Discapacidad': salud.discapacidad === 'si' ? 'SÍ' : 'NO',
                'Tipo Discapacidad': salud.tipoDiscapacidad || '-',
                'Requiere Adaptación': salud.requiereAdaptacion === 'si' ? 'SÍ' : 'NO',
                'Último Examen': ultimoExamenFormatted,
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
                'Empleado': datos.nombreCompleto || '-',
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
                const vencimientoFormatted = inm.residenciaVencimiento ? new Date(inm.residenciaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                const fechaIngresoFormatted = inm.fechaIngreso ? new Date(inm.fechaIngreso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';

                inmigracionData.push({
                    'Empleado': datos.nombreCompleto || '-',
                    'Nacionalidad': datos.nacionalidad,
                    'País Origen': inm.paisOrigen || '-',
                    'Tipo Residencia': inm.tipoResidencia || '-',
                    'N° Residencia': inm.numeroResidencia || '-',
                    'Vencimiento': vencimientoFormatted,
                    'Días Hasta Venc.': diasVenc !== null ? diasVenc : '-',
                    'Estado': estadoRes,
                    'Fecha Ingreso': fechaIngresoFormatted
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
    // Validación CUIL desactivada - cualquier formato es válido
    /*
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
    */

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
                    body: JSON.stringify({ ...empleado, empresa_id: currentEmpresa?.id || 1 })
                });
            }

            // Importar tickets si existen
            if (backup.datos.tickets && backup.datos.tickets.length > 0) {
                for (const ticket of backup.datos.tickets) {
                    await fetch(`${API_URL}/tickets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...ticket, empresa_id: currentEmpresa?.id || 1 })
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
            await loadAllTickets();

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

// ===== SISTEMA DE ALERTAS PERSONALIZADAS =====

let alertasPersonalizadas = JSON.parse(localStorage.getItem('alertasPersonalizadas')) || [];

function mostrarModalNuevaAlerta() {
    const modal = document.getElementById('modal-alerta');
    if (!modal) return;

    // Llenar select de empleados
    const empleadoSelect = document.getElementById('alerta-empleado');
    empleadoSelect.innerHTML = '<option value="">Alerta general del sistema</option>' +
        empleados.map(e => `<option value="${e.id}">${e.nombreCompleto || e.nombre}</option>`).join('');

    // Limpiar formulario
    document.getElementById('alerta-form').reset();

    modal.style.display = 'flex';
}

function closeAlertaModal() {
    const modal = document.getElementById('modal-alerta');
    if (modal) modal.style.display = 'none';
}

// Manejar submit de formulario de alertas
document.getElementById('alerta-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertaId = document.getElementById('alerta-form').dataset.editId;
    const esEdicion = alertaId && alertaId !== '';

    const alerta = {
        id: esEdicion ? parseInt(alertaId) : Date.now(),
        empleadoId: document.getElementById('alerta-empleado').value,
        tipo: document.getElementById('alerta-tipo').value,
        titulo: document.getElementById('alerta-titulo').value,
        mensaje: document.getElementById('alerta-mensaje').value,
        fecha: document.getElementById('alerta-fecha').value || new Date().toISOString().split('T')[0],
        fechaVencimiento: document.getElementById('alerta-fecha-vencimiento').value || null,
        prioridad: document.getElementById('alerta-prioridad').value,
        creadoPor: currentUser.nombre,
        fechaCreacion: esEdicion ? (alertasPersonalizadas.find(a => a.id == alertaId)?.fechaCreacion) : new Date().toISOString(),
        fechaModificacion: esEdicion ? new Date().toISOString() : null,
        estado: 'activa'
    };

    if (esEdicion) {
        // Actualizar alerta existente
        const index = alertasPersonalizadas.findIndex(a => a.id == alertaId);
        if (index !== -1) {
            alertasPersonalizadas[index] = alerta;
        }
    } else {
        // Agregar nueva alerta
        alertasPersonalizadas.push(alerta);
    }

    localStorage.setItem('alertasPersonalizadas', JSON.stringify(alertasPersonalizadas));

    showToast('success', esEdicion ? 'Alerta Actualizada' : 'Alerta Creada',
        esEdicion ? 'La alerta se ha actualizado correctamente' : 'La alerta se ha creado correctamente');

    closeAlertaModal();
    delete document.getElementById('alerta-form').dataset.editId;
    loadDashboard(); // Recargar dashboard
    loadAlertas(); // Recargar alertas
});

// Recargar alertas incluyendo las personalizadas
async function loadAlertas() {
    try {
        const response = await fetch(`${API_URL}/empleados`);
        empleados = await response.json();

        // Cargar alertas personalizadas
        alertasPersonalizadas = JSON.parse(localStorage.getItem('alertasPersonalizadas')) || [];

        mostrarAlertasCompletas(empleados);
    } catch (error) {
        console.error('Error al cargar alertas:', error);
    }
}

function mostrarAlertasCompletas(empleados) {
    const alertasContainer = document.getElementById('alertas-list');
    const alertas = [];

    // Alertas automáticas del sistema
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
                categoria: 'criticas',
                fecha: new Date()
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
                categoria: 'salud',
                fecha: new Date()
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
                categoria: 'migratorio',
                fecha: new Date()
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
                categoria: 'criticas,migratorio',
                fecha: new Date()
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
                categoria: 'todas',
                fecha: new Date()
            });
        }
    });

    // Agregar alertas personalizadas
    alertasPersonalizadas.filter(a => a.estado === 'activa').forEach(alerta => {
        const empleado = alerta.empleadoId ? empleados.find(e => e.id == alerta.empleadoId) : null;

        const iconosMap = {
            'vacaciones': 'fas fa-umbrella-beach',
            'permiso': 'fas fa-clipboard-check',
            'licencia': 'fas fa-hospital',
            'vencimiento': 'fas fa-calendar-times',
            'cumpleaños': 'fas fa-birthday-cake',
            'aniversario': 'fas fa-calendar-star',
            'recordatorio': 'fas fa-bell',
            'urgente': 'fas fa-exclamation-circle',
            'info': 'fas fa-info-circle'
        };

        const tipoMap = {
            'urgente': 'critica',
            'vencimiento': 'warning',
            'vacaciones': 'info',
            'permiso': 'info',
            'licencia': 'warning',
            'cumpleaños': 'info',
            'aniversario': 'info',
            'recordatorio': 'info',
            'info': 'info'
        };

        alertas.push({
            tipo: tipoMap[alerta.tipo] || 'info',
            icono: iconosMap[alerta.tipo] || 'fas fa-bell',
            titulo: alerta.titulo,
            descripcion: empleado ? empleado.nombreCompleto : 'Sistema',
            detalles: alerta.mensaje,
            empleadoId: alerta.empleadoId,
            categoria: 'avisos',
            fecha: new Date(alerta.fecha),
            esPersonalizada: true,
            alertaId: alerta.id
        });
    });

    // Ordenar por fecha (más recientes primero)
    alertas.sort((a, b) => b.fecha - a.fecha);

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
                <small>${formatDate(a.fecha)}</small>
                ${a.empleadoId ? `
                    <button class="btn btn-small btn-info" onclick="verPerfil(${a.empleadoId})">
                        <i class="fas fa-eye"></i> Ver Perfil
                    </button>
                ` : ''}
                ${a.esPersonalizada ? `
                    <button class="btn btn-small btn-danger" onclick="eliminarAlerta(${a.alertaId})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function editarAlerta(alertaId) {
    const alerta = alertasPersonalizadas.find(a => a.id === alertaId);
    if (!alerta) return;

    // Llenar el formulario con los datos de la alerta
    document.getElementById('alerta-empleado').value = alerta.empleadoId || '';
    document.getElementById('alerta-tipo').value = alerta.tipo;
    document.getElementById('alerta-titulo').value = alerta.titulo;
    document.getElementById('alerta-mensaje').value = alerta.mensaje;
    document.getElementById('alerta-fecha').value = alerta.fecha;
    document.getElementById('alerta-fecha-vencimiento').value = alerta.fechaVencimiento || '';
    document.getElementById('alerta-prioridad').value = alerta.prioridad;

    // Marcar como edición
    document.getElementById('alerta-form').dataset.editId = alertaId;

    // Abrir modal
    document.getElementById('modal-alerta').style.display = 'flex';

    // Cambiar título del modal
    document.querySelector('#modal-alerta h3').textContent = '✏️ Editar Alerta';
}

function anularAlerta(alertaId) {
    if (!confirm('¿Deseas anular esta alerta? Cambiará su estado a "anulada" pero no se eliminará.')) return;

    const index = alertasPersonalizadas.findIndex(a => a.id === alertaId);
    if (index !== -1) {
        alertasPersonalizadas[index].estado = 'anulada';
        localStorage.setItem('alertasPersonalizadas', JSON.stringify(alertasPersonalizadas));

        showToast('success', 'Alerta Anulada', 'La alerta se ha anulado correctamente');
        loadDashboard();
        loadAlertas();
    }
}

function eliminarAlerta(alertaId) {
    if (!confirm('¿Deseas eliminar esta alerta?')) return;

    alertasPersonalizadas = alertasPersonalizadas.filter(a => a.id !== alertaId);
    localStorage.setItem('alertasPersonalizadas', JSON.stringify(alertasPersonalizadas));

    showToast('success', 'Alerta Eliminada', 'La alerta se ha eliminado correctamente');
    loadDashboard();
    loadAlertas();
}

// ===== AUDITORÍA DEL SISTEMA =====

let auditoriaLog = JSON.parse(localStorage.getItem('auditoriaLog')) || [];

async function registrarAuditoria(accion, tipo, detalles, registroId) {
    const entrada = {
        usuarioId: currentUser ? currentUser.id : null,
        usuarioNombre: currentUser ? (currentUser.username || currentUser.nombre) : 'Sistema',
        accion: accion, // 'creado', 'editado', 'eliminado', 'aprobado', 'rechazado'
        tipo: tipo, // 'empleado', 'ticket', 'alerta'
        descripcion: detalles,
        entidad: tipo,
        entidadId: registroId,
        empresa_id: currentEmpresa?.id || 1
    };

    try {
        // Enviar al servidor
        await fetch(`${API_URL}/auditoria`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entrada)
        });

        // También guardar en localStorage como backup
        auditoriaLog.push({
            id: Date.now(),
            fecha: new Date().toISOString(),
            usuario: entrada.usuarioNombre,
            accion: entrada.accion,
            tipo: entrada.tipo,
            descripcion: entrada.descripcion,
            registroId: registroId
        });

        if (auditoriaLog.length > 500) {
            auditoriaLog = auditoriaLog.slice(-500);
        }

        localStorage.setItem('auditoriaLog', JSON.stringify(auditoriaLog));
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
    }
}

async function loadAuditoria() {
    const auditoriaList = document.getElementById('auditoria-list');
    if (!auditoriaList) return;

    auditoriaList.innerHTML = '<p class="loading">⏳ Cargando actividades...</p>';

    try {
        // Obtener auditoría del servidor
        console.log('Consultando auditoría...');
        const response = await fetch(`${API_URL}/auditoria?empresa_id=${currentEmpresa.id}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Datos de auditoría recibidos:', data.length, 'registros');

        auditoriaLog = data.map(r => ({
            usuario: r.usuario_nombre || r.usuarioNombre || 'Sistema',
            accion: r.accion,
            tipo: r.tipo,
            descripcion: r.descripcion,
            fecha: r.created_at || r.createdAt || new Date().toISOString(),
            registroId: r.entidad_id || r.entidadId
        }));

        console.log('auditoriaLog mapeado:', auditoriaLog);

        // Guardar en localStorage también
        localStorage.setItem('auditoriaLog', JSON.stringify(auditoriaLog));

        // Filtros
        const filtroUsuario = document.getElementById('auditoria-usuario')?.value || '';
        const filtroAccion = document.getElementById('auditoria-accion')?.value || '';
        const filtroFecha = document.getElementById('auditoria-fecha')?.value || '';

        let registrosFiltrados = auditoriaLog;

        if (filtroUsuario) {
            registrosFiltrados = registrosFiltrados.filter(r => r.usuario === filtroUsuario);
        }

        if (filtroAccion) {
            registrosFiltrados = registrosFiltrados.filter(r => r.accion === filtroAccion);
        }

        if (filtroFecha) {
            registrosFiltrados = registrosFiltrados.filter(r => r.fecha.startsWith(filtroFecha));
        }

        console.log('registrosFiltrados:', registrosFiltrados.length);

        // Ordenar por fecha descendente
        registrosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        // Llenar select de usuarios
        const usuarios = [...new Set(auditoriaLog.map(r => r.usuario))];
        const usuarioSelect = document.getElementById('auditoria-usuario');
        if (usuarioSelect && usuarioSelect.options.length <= 1) {
            usuarioSelect.innerHTML = '<option value="">Todos los usuarios</option>' +
                usuarios.map(u => `<option value="${u}">${u}</option>`).join('');
        }

        if (registrosFiltrados.length === 0) {
            console.log('No hay registros filtrados');
            auditoriaList.innerHTML = '<p class="empty-state"><i class="fas fa-history"></i><br>No hay registros de auditoría.</p>';
            return;
        }

        console.log('Renderizando', registrosFiltrados.length, 'registros');

        // Mostrar registros (últimos 100)
        const htmlContent = registrosFiltrados.slice(0, 100).map(r => {
            const iconosAccion = {
                'creado': '<i class="fas fa-plus-circle" style="color: #4caf50;"></i>',
                'editado': '<i class="fas fa-edit" style="color: #2196f3;"></i>',
                'eliminado': '<i class="fas fa-trash" style="color: #f44336;"></i>',
                'aprobado': '<i class="fas fa-check-circle" style="color: #4caf50;"></i>',
                'rechazado': '<i class="fas fa-times-circle" style="color: #f44336;"></i>'
            };

            const iconosTipo = {
                'empleado': '<i class="fas fa-user"></i>',
                'ticket': '<i class="fas fa-ticket-alt"></i>',
                'alerta': '<i class="fas fa-bell"></i>'
            };

            const fechaLocal = new Date(r.fecha);
            const fechaFormateada = fechaLocal.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const horaFormateada = fechaLocal.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

            return `
                <div class="auditoria-item">
                    ${iconosAccion[r.accion] || '<i class="fas fa-circle"></i>'}
                    <div class="auditoria-content">
                        <strong>${r.usuario}</strong> ${r.accion} ${r.tipo} <span class="auditoria-id">#${r.registroId || '?'}</span>
                        <p>${r.descripcion || r.detalles || 'Sin descripción'}</p>
                        <small><i class="fas fa-clock"></i> ${fechaFormateada} ${horaFormateada}</small>
                    </div>
                </div>
            `;
        }).join('');

        console.log('HTML generado (primeros 200 chars):', htmlContent.substring(0, 200));
        console.log('auditoriaList element:', auditoriaList);

        auditoriaList.innerHTML = htmlContent;
        console.log('✅ Auditoría renderizada correctamente');
    } catch (error) {
        console.error('Error al cargar auditoría:', error);
        auditoriaList.innerHTML = '<p class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Error al cargar auditoría. Intente nuevamente.</p>';
    }
}

// Cargar todos los tickets
async function loadAllTickets() {
    try {
        if (!currentEmpresa || !currentEmpresa.id) {
            console.error('No hay empresa seleccionada para tickets');
            return;
        }

        const response = await fetch(`${API_URL}/tickets?empresa_id=${currentEmpresa.id}&t=${Date.now()}`);
        const data = await response.json();
        tickets = data;

        // Actualizar estadísticas
        actualizarEstadisticasTickets();

        // Mostrar tickets
        renderTicketsList(tickets);

        // Cargar empleados ausentes
        loadEmpleadosAusentes();
    } catch (error) {
        console.error('Error al cargar tickets:', error);
        showToast('Error al cargar tickets', 'error');
    }
}

// Actualizar estadísticas de tickets
function actualizarEstadisticasTickets() {
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
    console.log('🎫 Abriendo modal de ticket. EmpleadoId:', empleadoId);

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
    const modal = document.getElementById('modal-ticket');
    console.log('Modal encontrado?', !!modal);
    modal.classList.add('active');
    console.log('Modal classes:', modal.className);
}

// Cargar empleados en select
async function cargarEmpleadosEnSelect() {
    try {
        if (empleados.length === 0) {
            await loadEmpleados();
        }

        console.log('Empleados cargados para select:', empleados.length);
        const select = document.getElementById('ticket-empleado-select');
        if (!select) {
            console.error('No se encontró el select ticket-empleado-select');
            return;
        }

        select.innerHTML = '<option value="">Seleccionar empleado...</option>' +
            empleados.map(emp =>
                `<option value="${emp.id}">${emp.nombreCompleto} - ${emp.puesto || 'Sin puesto'}</option>`
            ).join('');
        console.log('Select poblado con opciones:', select.options.length);
        console.log('Select visible?', select.offsetWidth > 0, select.offsetHeight > 0);
        console.log('Select display:', window.getComputedStyle(select).display);
        console.log('Select visibility:', window.getComputedStyle(select).visibility);

        // Asegurar que el select sea visible
        select.style.display = 'block';
        select.style.width = '100%';
        select.style.minWidth = '200px';
        select.style.visibility = 'visible';
        select.style.opacity = '1';
        select.style.height = 'auto';
        select.style.minHeight = '40px';

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
window.closeTicketModal = function () {
    console.log('Cerrando modal de ticket');
    const modal = document.getElementById('modal-ticket');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('ticket-form');
    if (form) {
        form.reset();
    }
}

// Guardar ticket (crear o editar)
if (document.getElementById('ticket-form')) {
    document.getElementById('ticket-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const ticketId = document.getElementById('ticket-id').value;
        const empleadoId = document.getElementById('ticket-empleado-select').value;
        const tipo = document.getElementById('ticket-tipo').value;
        const titulo = document.getElementById('ticket-titulo').value;
        const descripcion = document.getElementById('ticket-descripcion').value;
        const observaciones = document.getElementById('ticket-observaciones').value;
        const estado = document.getElementById('ticket-estado').value;

        const data = {
            empleadoId,
            tipo,
            titulo,
            descripcion,
            observaciones,
            estado,
            creadoPor: currentUser.id,
            empresa_id: currentEmpresa?.id || 1
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

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showToast(ticketId ? 'Ticket actualizado correctamente' : 'Ticket creado correctamente', 'success');
                closeTicketModal();
                loadAllTickets();
            } else {
                showToast('Error al guardar ticket: ' + (result.mensaje || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error al guardar ticket:', error);
            showToast('Error al guardar ticket', 'error');
        }
    });
}

// Aprobar ticket
async function aprobarTicket(ticketId) {
    if (!confirm('¿Deseas aprobar este ticket?')) return;

    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
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
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
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
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
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
        const response = await fetch(`${API_URL}/tickets/${ticketId}`);
        const ticket = await response.json();

        const detalleHTML = `
            <div class="ticket-detalle">
                <h3>${getTicketTipoIcon(ticket.tipo)} ${ticket.titulo}</h3>
                ${getTicketEstadoBadge(ticket.estado)}
                ${getTicketTipoBadge(ticket.tipo)}
                
                <div class="detalle-section">
                    <h4><i class="fas fa-user"></i> Empleado</h4>
                    <p>${ticket.nombre_completo || ticket.empleado_nombre || 'Sin nombre'} - ${ticket.puesto || 'Sin puesto'}</p>
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
        document.getElementById('modal-ticket-detalle').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar detalle del ticket', 'error');
    }
}

// Cerrar modal de detalle
function closeTicketDetalleModal() {
    document.getElementById('modal-ticket-detalle').classList.remove('active');
}

// Editar ticket
async function editarTicket(ticketId) {
    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`);
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
        filtrados = filtrados.filter(t =>
            t.titulo.toLowerCase().includes(searchText) ||
            (t.nombre_completo && t.nombre_completo.toLowerCase().includes(searchText)) ||
            (t.empleado_nombre && t.empleado_nombre.toLowerCase().includes(searchText)) ||
            t.tipo.toLowerCase().includes(searchText)
        );
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
        const ausentes = await response.json();

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
        document.getElementById('empleados-ausentes-list').innerHTML =
            '<p class="error-state">Error al cargar empleados ausentes</p>';
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
    return currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'rrhh' || currentUser.rol === 'manager');
}

function canEditTickets() {
    return currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'rrhh');
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

    // Llenar el formulario de EDICIÓN con los datos actuales (usando prefijo edit-)
    if (document.getElementById('edit-nombreCompleto')) document.getElementById('edit-nombreCompleto').value = empleado.nombreCompleto || '';
    if (document.getElementById('edit-cuil')) document.getElementById('edit-cuil').value = empleado.cuil || '';
    if (document.getElementById('edit-fechaNacimiento')) document.getElementById('edit-fechaNacimiento').value = empleado.fechaNacimiento || '';
    if (document.getElementById('edit-documento')) document.getElementById('edit-documento').value = empleado.documento || '';

    // Composición Familiar
    if (document.getElementById('edit-estadoCivil')) document.getElementById('edit-estadoCivil').value = empleado.estadoCivil || '';
    if (document.getElementById('edit-tienePareja')) document.getElementById('edit-tienePareja').value = empleado.tienePareja || 'no';
    if (document.getElementById('edit-cantidadHijos')) document.getElementById('edit-cantidadHijos').value = empleado.cantidadHijos || 0;
    if (document.getElementById('edit-hijosACargo')) document.getElementById('edit-hijosACargo').value = empleado.hijosACargo || 0;
    if (document.getElementById('edit-hijosConviven')) document.getElementById('edit-hijosConviven').value = empleado.hijosConviven || 0;
    if (document.getElementById('edit-familiaresACargo')) document.getElementById('edit-familiaresACargo').value = empleado.familiaresACargo || 0;
    if (document.getElementById('edit-escolaridadFamiliar')) document.getElementById('edit-escolaridadFamiliar').value = empleado.escolaridadFamiliar || '';

    // Datos de Vivienda
    if (document.getElementById('edit-vivienda')) document.getElementById('edit-vivienda').value = empleado.vivienda || '';
    if (document.getElementById('edit-direccion')) document.getElementById('edit-direccion').value = empleado.direccion || '';
    if (document.getElementById('edit-provincia')) document.getElementById('edit-provincia').value = empleado.provincia || '';
    if (document.getElementById('edit-telefono')) document.getElementById('edit-telefono').value = empleado.telefono || '';
    if (document.getElementById('edit-numeroLoteInvernaculo')) document.getElementById('edit-numeroLoteInvernaculo').value = empleado.numeroLoteInvernaculo || '';

    // Educación
    if (document.getElementById('edit-nivelEducativo')) document.getElementById('edit-nivelEducativo').value = empleado.nivelEducativo || '';

    // Salud
    if (document.getElementById('edit-problemasSalud')) document.getElementById('edit-problemasSalud').value = empleado.problemasSalud || '';

    // Datos Migratorios
    if (document.getElementById('edit-esExtranjero')) document.getElementById('edit-esExtranjero').value = empleado.esExtranjero || 'no';
    if (document.getElementById('edit-paisOrigen')) document.getElementById('edit-paisOrigen').value = empleado.paisOrigen || '';
    if (document.getElementById('edit-fechaEntradaPais')) document.getElementById('edit-fechaEntradaPais').value = empleado.fechaEntradaPais || '';
    if (document.getElementById('edit-tipoResidencia')) document.getElementById('edit-tipoResidencia').value = empleado.tipoResidencia || '';
    if (document.getElementById('edit-entradasSalidasPais')) document.getElementById('edit-entradasSalidasPais').value = empleado.entradasSalidasPais || '';

    // Datos Laborales
    if (document.getElementById('edit-experienciaLaboral')) document.getElementById('edit-experienciaLaboral').value = empleado.experienciaLaboral || '';
    if (document.getElementById('edit-fechaIngreso')) document.getElementById('edit-fechaIngreso').value = empleado.fechaIngreso || '';
    if (document.getElementById('edit-puesto')) document.getElementById('edit-puesto').value = empleado.puesto || '';
    if (document.getElementById('edit-sueldo')) document.getElementById('edit-sueldo').value = empleado.sueldo || '';

    // Antecedentes
    if (document.getElementById('edit-antecedentesPenales')) document.getElementById('edit-antecedentesPenales').value = empleado.antecedentesPenales || 'no';
    if (document.getElementById('edit-observacionesAntecedentes')) document.getElementById('edit-observacionesAntecedentes').value = empleado.observacionesAntecedentes || '';

    // Observaciones
    if (document.getElementById('edit-observaciones')) document.getElementById('edit-observaciones').value = empleado.observaciones || '';

    // Mostrar nombre del empleado en el título
    const nombreSpan = document.getElementById('edit-empleado-nombre');
    if (nombreSpan) nombreSpan.textContent = ` - ${empleado.nombreCompleto}`;

    // Guardar el ID del empleado que estamos editando
    const editForm = document.getElementById('empleado-edit-form');
    if (editForm) {
        editForm.dataset.editId = id;
        console.log('ID guardado para edición:', id, 'Tipo:', typeof id);
    }

    // Mostrar el botón de editar en el sidebar
    const editTab = document.querySelector('[data-tab="editar"]');
    if (editTab) editTab.style.display = 'flex';

    // Cambiar a la pestaña de edición
    editTab.click();

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

// ===== MENÚ HAMBURGUESA (MÓVIL) =====
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    });
}

// ===== FORMULARIO DE EDICIÓN DE EMPLEADO =====
const empleadoEditForm = document.getElementById('empleado-edit-form');

if (empleadoEditForm) {
    empleadoEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const empleadoData = {
            nombreCompleto: document.getElementById('edit-nombreCompleto').value,
            cuil: document.getElementById('edit-cuil').value,
            fechaNacimiento: document.getElementById('edit-fechaNacimiento').value,
            documento: document.getElementById('edit-documento').value,

            estadoCivil: document.getElementById('edit-estadoCivil').value,
            tienePareja: document.getElementById('edit-tienePareja')?.value || 'no',
            cantidadHijos: parseInt(document.getElementById('edit-cantidadHijos')?.value || '0'),
            hijosACargo: parseInt(document.getElementById('edit-hijosACargo')?.value || '0'),
            hijosConviven: parseInt(document.getElementById('edit-hijosConviven')?.value || '0'),
            familiaresACargo: parseInt(document.getElementById('edit-familiaresACargo')?.value || '0'),
            escolaridadFamiliar: document.getElementById('edit-escolaridadFamiliar')?.value || '',

            // Datos de Vivienda
            vivienda: document.getElementById('edit-vivienda')?.value || '',
            direccion: document.getElementById('edit-direccion')?.value || '',
            provincia: document.getElementById('edit-provincia')?.value || '',
            telefono: document.getElementById('edit-telefono')?.value || '',
            numeroLoteInvernaculo: document.getElementById('edit-numeroLoteInvernaculo')?.value || '',

            nivelEducativo: document.getElementById('edit-nivelEducativo').value,

            problemasSalud: document.getElementById('edit-problemasSalud').value,

            esExtranjero: document.getElementById('edit-esExtranjero').value,
            paisOrigen: document.getElementById('edit-paisOrigen').value,
            fechaEntradaPais: document.getElementById('edit-fechaEntradaPais').value,
            tipoResidencia: document.getElementById('edit-tipoResidencia').value,
            entradasSalidasPais: document.getElementById('edit-entradasSalidasPais').value,

            experienciaLaboral: document.getElementById('edit-experienciaLaboral').value,
            fechaIngreso: document.getElementById('edit-fechaIngreso').value,
            puesto: document.getElementById('edit-puesto').value,
            sueldo: document.getElementById('edit-sueldo')?.value || null,

            antecedentesPenales: document.getElementById('edit-antecedentesPenales').value,
            observacionesAntecedentes: document.getElementById('edit-observacionesAntecedentes').value,

            observaciones: document.getElementById('edit-observaciones').value
        };

        const submitBtn = empleadoEditForm.querySelector('button[type="submit"]');
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const editId = empleadoEditForm.dataset.editId;

            console.log('Intentando actualizar empleado con ID:', editId, 'Tipo:', typeof editId);

            if (!editId || editId === 'undefined' || editId === 'null') {
                throw new Error('No se encontró el ID del empleado a editar');
            }

            // Asegurar que el ID sea numérico
            const numericId = parseInt(editId);
            if (isNaN(numericId)) {
                throw new Error(`ID inválido: ${editId}`);
            }

            // Agregar empresa_id al empleadoData
            empleadoData.empresa_id = currentEmpresa?.id || 1;

            const response = await fetch(`${API_URL}/empleados/${numericId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empleadoData)
            });

            const data = await response.json();

            if (data.success) {
                registrarAuditoria(
                    'editado',
                    'empleado',
                    `${empleadoData.nombreCompleto} - CUIL: ${empleadoData.cuil}`,
                    editId
                );

                showToast('success', 'Empleado Actualizado', 'Los cambios se guardaron correctamente');

                empleadoEditForm.reset();
                delete empleadoEditForm.dataset.editId;

                // Ocultar el botón de editar
                const editTab = document.querySelector('[data-tab="editar"]');
                if (editTab) editTab.style.display = 'none';

                // Cambiar a la tab de lista
                document.querySelector('[data-tab="lista"]').click();

                // Recargar empleados
                await loadEmpleados();
            }
        } catch (error) {
            showToast('error', 'Error', 'No se pudo actualizar el empleado');
            console.error(error);
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });
}

function cancelarEdicion() {
    const editForm = document.getElementById('empleado-edit-form');
    if (editForm) {
        editForm.reset();
        delete editForm.dataset.editId;
    }

    // Ocultar el botón de editar
    const editTab = document.querySelector('[data-tab="editar"]');
    if (editTab) editTab.style.display = 'none';

    // Cambiar a la tab de lista
    document.querySelector('[data-tab="lista"]').click();
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    });
}
// ===== GESTIÓN DE EMPRESAS =====

// Cargar empresas
async function loadEmpresas() {
    try {
        const response = await fetch(`${API_URL}/empresas?t=${Date.now()}`);
        const data = await response.json();
        empresas = data;
        renderEmpresas();

        // Si solo hay una empresa, seleccionarla automáticamente
        if (empresas.length === 1) {
            console.log('Solo hay una empresa, seleccionando automáticamente:', empresas[0].nombre);
            selectEmpresa(empresas[0].id);
        }
    } catch (error) {
        console.error('Error al cargar empresas:', error);
        showToast('error', 'Error', 'No se pudieron cargar las empresas');
    }
}

// Renderizar empresas en el grid
function renderEmpresas() {
    const grid = document.getElementById('empresas-grid');
    const btnAdd = document.getElementById('btn-add-empresa');

    if (!grid) return;

    if (empresas.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <p>No hay empresas registradas</p>
                <p>Haz clic en "Nueva Empresa" para comenzar</p>
            </div>
        `;
    } else {
        grid.innerHTML = empresas.map(emp => {
            const isEmoji = emp.logo && emp.logo.length <= 4;
            const logoHtml = isEmoji
                ? `<div class="empresa-logo">${emp.logo}</div>`
                : `<div class="empresa-logo"><img src="${emp.logo}" alt="${emp.nombre}"></div>`;

            return `
                <div class="empresa-card" onclick="selectEmpresa(${emp.id})">
                    ${currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') ? `
                        <div class="empresa-actions">
                            <button class="btn-edit" onclick="event.stopPropagation(); editEmpresa(${emp.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="event.stopPropagation(); deleteEmpresa(${emp.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                    ${logoHtml}
                    <div class="empresa-nombre">${emp.nombre}</div>
                    ${emp.descripcion ? `<div class="empresa-descripcion">${emp.descripcion}</div>` : ''}
                    <div class="empresa-badge">
                        <i class="fas fa-building"></i> Empresa
                    </div>
                </div>
            `;
        }).join('');
    }

    // Mostrar botón "Nueva Empresa" solo para admin
    if (btnAdd) {
        console.log('currentUser:', currentUser);
        console.log('currentUser.rol:', currentUser?.rol);
        if (currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'superadmin')) {
            btnAdd.style.display = 'flex';
            console.log('Mostrando botón Nueva Empresa');
        } else {
            btnAdd.style.display = 'none';
            console.log('Ocultando botón Nueva Empresa');
        }
    }
}

// Seleccionar empresa
function selectEmpresa(empresaId) {
    currentEmpresa = empresas.find(e => e.id === empresaId);
    if (currentEmpresa) {
        // Guardar en localStorage
        localStorage.setItem('empresaId', empresaId);

        // Actualizar nombre de empresa en sidebar
        const sidebarEmpresaNombre = document.getElementById('sidebar-empresa-nombre');
        if (sidebarEmpresaNombre) {
            sidebarEmpresaNombre.textContent = currentEmpresa.nombre;
        }

        // Mostrar el dashboard
        showMainScreen();
        aplicarPermisos();

        // IMPORTANTE: Cargar empleados de la empresa seleccionada
        loadEmpleados();
        loadDashboard();
        loadAllTickets();
    }
}

// Mostrar pantalla de empresas
function showEmpresaScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('empresa-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
    loadEmpresas();
}

// Abrir modal para crear empresa
function openEmpresaModal() {
    console.log('openEmpresaModal llamado');
    const modal = document.getElementById('modal-empresa');
    const form = document.getElementById('empresa-form');
    const title = document.getElementById('empresa-modal-title');

    console.log('modal:', modal);
    console.log('form:', form);
    console.log('modal classes antes:', modal.className);
    console.log('modal display antes:', window.getComputedStyle(modal).display);
    console.log('modal opacity antes:', window.getComputedStyle(modal).opacity);
    console.log('modal z-index antes:', window.getComputedStyle(modal).zIndex);

    form.reset();
    delete form.dataset.editId;
    title.innerHTML = '<i class="fas fa-building"></i> Nueva Empresa';
    modal.classList.add('active');

    console.log('modal classes después:', modal.className);
    console.log('modal display después:', window.getComputedStyle(modal).display);
    console.log('Modal abierto con clase active');
}

// Abrir modal para editar empresa
function editEmpresa(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa) return;

    const modal = document.getElementById('modal-empresa');
    const form = document.getElementById('empresa-form');
    const title = document.getElementById('empresa-modal-title');

    document.getElementById('empresa-nombre').value = empresa.nombre;
    document.getElementById('empresa-descripcion').value = empresa.descripcion || '';
    document.getElementById('empresa-logo').value = empresa.logo || '';

    form.dataset.editId = empresaId;
    title.innerHTML = '<i class="fas fa-edit"></i> Editar Empresa';
    modal.classList.add('active');
}

// Cerrar modal de empresa
function closeEmpresaModal() {
    const modal = document.getElementById('modal-empresa');
    modal.classList.remove('active');
}

// Eliminar empresa
async function deleteEmpresa(empresaId) {
    if (!confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/empresas`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: empresaId })
        });

        const data = await response.json();

        if (data.success) {
            showToast('success', 'Empresa Eliminada', 'La empresa se eliminó correctamente');
            loadEmpresas();
        } else {
            showToast('error', 'Error', data.mensaje || 'No se pudo eliminar la empresa');
        }
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        showToast('error', 'Error', 'No se pudo eliminar la empresa');
    }
}

// Event listeners para empresas
document.getElementById('btn-add-empresa')?.addEventListener('click', openEmpresaModal);

document.getElementById('btn-config-empresa')?.addEventListener('click', () => {
    if (currentEmpresa) {
        editEmpresa(currentEmpresa.id);
    } else {
        showToast('error', 'Error', 'No hay empresa seleccionada');
    }
});

document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
    document.getElementById('empresa-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
});

document.getElementById('empresa-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const nombre = document.getElementById('empresa-nombre').value.trim();
    const descripcion = document.getElementById('empresa-descripcion').value.trim();
    const logo = document.getElementById('empresa-logo').value.trim() || '🏢';
    const editId = form.dataset.editId;

    const empresaData = {
        nombre,
        descripcion,
        logo
    };

    try {
        let response;

        if (editId) {
            // Actualizar empresa
            response = await fetch(`${API_URL}/empresas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...empresaData, id: parseInt(editId) })
            });
        } else {
            // Crear empresa
            response = await fetch(`${API_URL}/empresas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empresaData)
            });
        }

        const data = await response.json();

        if (data.success) {
            showToast('success', editId ? 'Empresa Actualizada' : 'Empresa Creada',
                data.mensaje || 'Operación exitosa');
            closeEmpresaModal();

            // Si editamos la empresa actual, actualizar currentEmpresa
            if (editId && currentEmpresa && currentEmpresa.id == editId) {
                currentEmpresa = { id: parseInt(editId), nombre, descripcion, logo };
                // Actualizar nombre en sidebar
                const sidebarEmpresaNombre = document.getElementById('sidebar-empresa-nombre');
                if (sidebarEmpresaNombre) {
                    sidebarEmpresaNombre.textContent = nombre;
                }
            }

            loadEmpresas();
        } else {
            showToast('error', 'Error', data.mensaje || 'No se pudo guardar la empresa');
        }
    } catch (error) {
        console.error('Error al guardar empresa:', error);
        showToast('error', 'Error', 'No se pudo guardar la empresa');
    }
});


// ===== GESTIÓN DE DOCUMENTOS DE EMPLEADOS =====

// Cargar documentos de un empleado
async function loadDocumentosEmpleado(empleadoId) {
    const container = document.getElementById(`documentos-lista-${empleadoId}`);
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/empleados/${empleadoId}/documentos`);
        const documentos = await response.json();

        if (documentos.length === 0) {
            container.innerHTML = '<p class="text-muted"><i class="fas fa-folder-open"></i> No hay documentos adjuntos</p>';
            return;
        }

        container.innerHTML = documentos.map(doc => `
            <div class="documento-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; align-items: center; justify-content: between;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <i class="fas ${getIconoArchivo(doc.tipo_archivo)}" style="color: #666;"></i>
                        <strong>${escapeHtml(doc.nombre_archivo)}</strong>
                        <small style="color: #666;">(${formatFileSize(doc.tamano)})</small>
                    </div>
                    ${doc.descripcion ? `<p style="margin: 5px 0; color: #666;">${escapeHtml(doc.descripcion)}</p>` : ''}
                    <small style="color: #999;">Subido por ${escapeHtml(doc.subido_por)} el ${formatDateTime(doc.fecha_subida)}</small>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-small btn-secondary" onclick="descargarDocumento(${doc.id})" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="eliminarDocumento(${doc.id}, ${empleadoId})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        container.innerHTML = '<p class="text-muted text-danger">Error al cargar documentos</p>';
    }
}

// Subir documento
async function subirDocumento(empleadoId, input) {
    const file = input.files[0];
    if (!file) return;

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
    }

    const descripcionInput = document.getElementById(`documento-descripcion-${empleadoId}`);
    const descripcion = descripcionInput ? descripcionInput.value : '';

    try {
        // Mostrar loading
        const container = document.getElementById(`documentos-lista-${empleadoId}`);
        container.innerHTML = '<div class="loading-docs"><i class="fas fa-spinner fa-spin"></i> Subiendo documento...</div>';

        // Convertir archivo a base64
        const base64 = await fileToBase64(file);

        const documentoData = {
            nombre_archivo: file.name,
            tipo_archivo: file.type,
            tamano: file.size,
            contenido_base64: base64,
            descripcion: descripcion,
            subido_por: currentUser.nombre,
            empresa_id: currentEmpresa?.id || 1
        };

        const response = await fetch(`${API_URL}/empleados/${empleadoId}/documentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(documentoData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('success', 'Documento Subido', 'El documento se subió correctamente');

            // Limpiar campos
            input.value = '';
            if (descripcionInput) descripcionInput.value = '';

            // Recargar lista
            loadDocumentosEmpleado(empleadoId);
        } else {
            throw new Error(result.mensaje || 'Error al subir documento');
        }
    } catch (error) {
        console.error('Error al subir documento:', error);
        showToast('error', 'Error', 'No se pudo subir el documento');
        loadDocumentosEmpleado(empleadoId);
    }
}

// Descargar documento
async function descargarDocumento(documentoId) {
    try {
        const response = await fetch(`${API_URL}/documentos/${documentoId}`);
        const result = await response.json();

        if (result.success) {
            const doc = result.data;

            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = `data:${doc.tipo_archivo || 'application/octet-stream'};base64,${doc.contenido_base64}`;
            link.download = doc.nombre_archivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('success', 'Descarga', 'Documento descargado correctamente');
        } else {
            throw new Error(result.mensaje || 'Error al descargar documento');
        }
    } catch (error) {
        console.error('Error al descargar documento:', error);
        showToast('error', 'Error', 'No se pudo descargar el documento');
    }
}

// Eliminar documento
async function eliminarDocumento(documentoId, empleadoId) {
    if (!confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/documentos/${documentoId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('success', 'Documento Eliminado', 'El documento se eliminó correctamente');
            loadDocumentosEmpleado(empleadoId);
        } else {
            throw new Error(result.mensaje || 'Error al eliminar documento');
        }
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        showToast('error', 'Error', 'No se pudo eliminar el documento');
    }
}

// Funciones auxiliares
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remover el prefijo data:mime;base64,
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

function getIconoArchivo(tipoArchivo) {
    if (!tipoArchivo) return 'fa-file';

    if (tipoArchivo.includes('pdf')) return 'fa-file-pdf';
    if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) return 'fa-file-word';
    if (tipoArchivo.includes('image') || tipoArchivo.includes('jpg') || tipoArchivo.includes('png')) return 'fa-file-image';
    if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) return 'fa-file-excel';

    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// ===== GESTIÓN DE USUARIOS Y PERMISOS =====

async function loadUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.mensaje);
        }

        const container = document.getElementById('usuarios-list');
        const usuarios = result.data;

        if (usuarios.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay usuarios registrados</p>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Empresas</th>
                        <th>Estado</th>
                        <th>Último Login</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuarios.map(u => `
                        <tr>
                            <td><strong>${escapeHtml(u.username)}</strong></td>
                            <td>${escapeHtml(u.nombre)}</td>
                            <td>${escapeHtml(u.email || '-')}</td>
                            <td><span class="badge badge-${u.rol_global === 'superadmin' ? 'danger' : u.rol_global === 'admin' ? 'warning' : 'info'}">${u.rol_global || 'usuario'}</span></td>
                            <td><span class="badge badge-secondary">${u.empresas_asignadas || 0}</span></td>
                            <td><span class="badge badge-${u.activo ? 'success' : 'danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                            <td>${u.ultimo_login ? formatDateTime(u.ultimo_login) : 'Nunca'}</td>
                            <td class="actions">
                                <button class="btn-icon" onclick="verDetalleUsuario(${u.id})" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon btn-edit" onclick="editarUsuario(${u.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${u.id !== 1 ? `
                                    <button class="btn-icon btn-delete" onclick="eliminarUsuario(${u.id}, '${escapeHtml(u.username)}')" title="Eliminar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        document.getElementById('usuarios-list').innerHTML = '<p class="text-danger">Error al cargar usuarios</p>';
    }
}

function showModalUsuario(usuarioId = null) {
    const modal = document.getElementById('modal-usuario');
    const form = document.getElementById('form-usuario');
    const titulo = document.getElementById('modal-usuario-titulo');

    form.reset();
    document.getElementById('usuario-id').value = usuarioId || '';

    if (usuarioId) {
        titulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
        document.getElementById('password-fields').style.display = 'none';
        document.getElementById('usuario-username').disabled = true;
        cargarDatosUsuario(usuarioId);
    } else {
        titulo.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
        document.getElementById('password-fields').style.display = 'block';
        document.getElementById('usuario-username').disabled = false;
        document.getElementById('usuario-password').required = true;
        document.getElementById('usuario-password-confirm').required = true;
        cargarEmpresasParaAsignar();
    }

    modal.classList.add('active');
}

function closeUsuarioModal() {
    document.getElementById('modal-usuario').classList.remove('active');
}

async function cargarDatosUsuario(usuarioId) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioId}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.mensaje);

        const usuario = result.data;

        document.getElementById('usuario-username').value = usuario.username;
        document.getElementById('usuario-username').disabled = true;
        document.getElementById('usuario-email').value = usuario.email || '';
        document.getElementById('usuario-nombre').value = usuario.nombre;
        document.getElementById('usuario-rol').value = usuario.rol_global || 'usuario';
        document.getElementById('usuario-activo').checked = usuario.activo;
        document.getElementById('usuario-debe-cambiar-password').checked = usuario.debe_cambiar_password;

        // Cargar empresas asignadas
        await cargarEmpresasParaAsignar(usuario.empresas);

    } catch (error) {
        console.error('Error al cargar usuario:', error);
        showToast('error', 'Error', 'No se pudo cargar el usuario');
        closeUsuarioModal();
    }
}

async function cargarEmpresasParaAsignar(empresasAsignadas = []) {
    try {
        const response = await fetch(`${API_URL}/empresas`);
        const empresas = await response.json();

        const container = document.getElementById('empresas-asignacion');

        container.innerHTML = empresas.map(emp => {
            const asignada = empresasAsignadas.find(e => e.id === emp.id);
            const permisos = asignada?.permisos || {
                ver_empleados: true,
                editar_empleados: false,
                eliminar_empleados: false,
                ver_tickets: true,
                editar_tickets: false,
                eliminar_tickets: false,
                ver_reportes: true,
                ver_auditoria: false
            };

            return `
                <div class="empresa-asignacion-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <input type="checkbox" 
                               id="emp-${emp.id}" 
                               name="empresas" 
                               value="${emp.id}"
                               ${asignada ? 'checked' : ''}
                               onchange="toggleEmpresaPermisos(${emp.id})">
                        <label for="emp-${emp.id}" style="margin: 0; font-weight: bold; flex: 1;">
                            ${escapeHtml(emp.nombre)}
                        </label>
                        <select id="rol-emp-${emp.id}" ${!asignada ? 'disabled' : ''}>
                            <option value="empleado" ${asignada?.rol_empresa === 'empleado' ? 'selected' : ''}>Empleado</option>
                            <option value="supervisor" ${asignada?.rol_empresa === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                            <option value="admin" ${asignada?.rol_empresa === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <div id="permisos-emp-${emp.id}" class="permisos-empresa" style="display: ${asignada ? 'grid' : 'none'}; grid-template-columns: repeat(2, 1fr); gap: 5px; padding-left: 30px;">
                        <label><input type="checkbox" id="perm-${emp.id}-ver_empleados" ${permisos.ver_empleados ? 'checked' : ''}> Ver Empleados</label>
                        <label><input type="checkbox" id="perm-${emp.id}-editar_empleados" ${permisos.editar_empleados ? 'checked' : ''}> Editar Empleados</label>
                        <label><input type="checkbox" id="perm-${emp.id}-ver_tickets" ${permisos.ver_tickets ? 'checked' : ''}> Ver Tickets</label>
                        <label><input type="checkbox" id="perm-${emp.id}-editar_tickets" ${permisos.editar_tickets ? 'checked' : ''}> Editar Tickets</label>
                        <label><input type="checkbox" id="perm-${emp.id}-ver_reportes" ${permisos.ver_reportes ? 'checked' : ''}> Ver Reportes</label>
                        <label><input type="checkbox" id="perm-${emp.id}-ver_auditoria" ${permisos.ver_auditoria ? 'checked' : ''}> Ver Auditoría</label>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar empresas:', error);
    }
}

function toggleEmpresaPermisos(empresaId) {
    const checkbox = document.getElementById(`emp-${empresaId}`);
    const permisos = document.getElementById(`permisos-emp-${empresaId}`);
    const rolSelect = document.getElementById(`rol-emp-${empresaId}`);

    if (checkbox.checked) {
        permisos.style.display = 'grid';
        rolSelect.disabled = false;
    } else {
        permisos.style.display = 'none';
        rolSelect.disabled = true;
    }
}

async function guardarUsuario(event) {
    event.preventDefault();

    const usuarioId = document.getElementById('usuario-id').value;
    const username = document.getElementById('usuario-username').value;
    const email = document.getElementById('usuario-email').value;
    const nombre = document.getElementById('usuario-nombre').value;
    const rol_global = document.getElementById('usuario-rol').value;
    const activo = document.getElementById('usuario-activo').checked;
    const debe_cambiar_password = document.getElementById('usuario-debe-cambiar-password').checked;

    let password = null;
    if (!usuarioId) {
        password = document.getElementById('usuario-password').value;
        const passwordConfirm = document.getElementById('usuario-password-confirm').value;

        if (password !== passwordConfirm) {
            showToast('error', 'Error', 'Las contraseñas no coinciden');
            return;
        }
    }

    // Recopilar empresas asignadas
    const empresas = [];
    const checkboxes = document.querySelectorAll('input[name="empresas"]:checked');
    checkboxes.forEach(cb => {
        const empresaId = parseInt(cb.value);
        const rol_empresa = document.getElementById(`rol-emp-${empresaId}`).value;

        const permisos = {
            ver_empleados: document.getElementById(`perm-${empresaId}-ver_empleados`).checked,
            editar_empleados: document.getElementById(`perm-${empresaId}-editar_empleados`).checked,
            ver_tickets: document.getElementById(`perm-${empresaId}-ver_tickets`).checked,
            editar_tickets: document.getElementById(`perm-${empresaId}-editar_tickets`).checked,
            ver_reportes: document.getElementById(`perm-${empresaId}-ver_reportes`).checked,
            ver_auditoria: document.getElementById(`perm-${empresaId}-ver_auditoria`).checked
        };

        empresas.push({ empresa_id: empresaId, rol_empresa, permisos });
    });

    try {
        const data = { username, email, nombre, rol_global, activo, debe_cambiar_password, empresas };
        if (password) data.password = password;

        const url = usuarioId ? `${API_URL}/usuarios/${usuarioId}` : `${API_URL}/usuarios`;
        const method = usuarioId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) throw new Error(result.mensaje);

        // Si es nuevo usuario o se actualizó, también actualizar empresas asignadas
        if (empresas.length > 0 && result.data.id) {
            await fetch(`${API_URL}/usuarios/${result.data.id}/empresas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresas })
            });
        }

        showToast('success', 'Éxito', usuarioId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        closeUsuarioModal();
        loadUsuarios();

    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showToast('error', 'Error', error.message || 'No se pudo guardar el usuario');
    }
}

async function editarUsuario(usuarioId) {
    showModalUsuario(usuarioId);
}

async function eliminarUsuario(usuarioId, username) {
    if (!confirm(`¿Está seguro de eliminar el usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) throw new Error(result.mensaje);

        showToast('success', 'Usuario Eliminado', 'El usuario se eliminó correctamente');
        loadUsuarios();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        showToast('error', 'Error', error.message || 'No se pudo eliminar el usuario');
    }
}

async function verDetalleUsuario(usuarioId) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioId}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.mensaje);

        const usuario = result.data;

        const html = `
            <div style="padding: 20px;">
                <h3><i class="fas fa-user-circle"></i> ${escapeHtml(usuario.nombre)}</h3>
                <hr>
                <p><strong>Usuario:</strong> ${escapeHtml(usuario.username)}</p>
                <p><strong>Email:</strong> ${escapeHtml(usuario.email || '-')}</p>
                <p><strong>Rol Global:</strong> <span class="badge badge-info">${usuario.rol_global}</span></p>
                <p><strong>Estado:</strong> <span class="badge badge-${usuario.activo ? 'success' : 'danger'}">${usuario.activo ? 'Activo' : 'Inactivo'}</span></p>
                <p><strong>Último Login:</strong> ${usuario.ultimo_login ? formatDateTime(usuario.ultimo_login) : 'Nunca'}</p>
                <p><strong>Creado:</strong> ${formatDateTime(usuario.created_at)}</p>
                
                <h4 style="margin-top: 20px;"><i class="fas fa-building"></i> Empresas Asignadas</h4>
                ${usuario.empresas.length > 0 ? `
                    <table class="data-table" style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Rol</th>
                                <th>Permisos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuario.empresas.map(e => `
                                <tr>
                                    <td>${escapeHtml(e.nombre)}</td>
                                    <td><span class="badge badge-secondary">${e.rol_empresa}</span></td>
                                    <td style="font-size: 0.85em;">
                                        ${Object.entries(e.permisos || {})
                .filter(([k, v]) => v)
                .map(([k]) => k.replace(/_/g, ' '))
                .join(', ') || 'Sin permisos'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p class="text-muted">No tiene empresas asignadas</p>'}
                
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-primary" onclick="editarUsuario(${usuarioId})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;

        // Mostrar en un modal o alert
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; z-index: 10000; max-width: 800px; max-height: 80vh; overflow-y: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
        overlay.onclick = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(tempDiv);
        };

        document.body.appendChild(overlay);
        document.body.appendChild(tempDiv);

    } catch (error) {
        console.error('Error al ver detalle:', error);
        showToast('error', 'Error', 'No se pudo cargar el detalle del usuario');
    }
}

// ===== PARTÍCULAS INTERACTIVAS EN LOGIN =====
(function () {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    canvas.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.size = Math.random() * 3 + 1;
            this.density = Math.random() * 30 + 5;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
        }

        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        update() {
            // Movimiento suave
            this.x += this.speedX;
            this.y += this.speedY;

            // Rebotar en los bordes
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Interacción con el mouse
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }

            // Volver suavemente a la posición base
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            this.x += dx * 0.05;
            this.y += dy * 0.05;
        }
    }

    function init() {
        particles = [];
        let numberOfParticles = (canvas.width * canvas.height) / 6000;
        for (let i = 0; i < numberOfParticles; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    function connect() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - distance / 100) * 0.3 + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connect();

        requestAnimationFrame(animate);
    }

    init();
    animate();
})();
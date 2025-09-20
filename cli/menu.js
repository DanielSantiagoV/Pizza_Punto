const inquirer = require('inquirer');
const PedidoService = require('../services/PedidoService');
const ReporteService = require('../services/ReporteService');
const Ingrediente = require('../models/Ingrediente');
const Pizza = require('../models/Pizza');
const Cliente = require('../models/Cliente');
const Repartidor = require('../models/Repartidor');
const Pedido = require('../models/Pedido');

class Menu {
    constructor(db) {
        this.db = db;
        this.pedidoService = new PedidoService(db);
        this.reporteService = new ReporteService(db);
    }

    async mostrarMenuPrincipal() {
        console.log('\n' + '='.repeat(60));
        console.log('🍕 PIZZA Y PUNTO - Sistema de Gestión');
        console.log('='.repeat(60));

        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: '¿Qué deseas hacer?',
                choices: [
                    { name: '🍕 Realizar Pedido', value: 'realizar_pedido' },
                    { name: '📋 Ver Menú de Pizzas', value: 'ver_menu' },
                    { name: '👤 Gestionar Clientes', value: 'gestionar_clientes' },
                    { name: '🧀 Gestionar Ingredientes', value: 'gestionar_ingredientes' },
                    { name: '🛵 Gestionar Repartidores', value: 'gestionar_repartidores' },
                    { name: '📊 Ver Reportes', value: 'ver_reportes' },
                    { name: '📦 Ver Pedidos', value: 'ver_pedidos' },
                    { name: '❌ Salir', value: 'salir' }
                ]
            }
        ]);

        return opcion;
    }

    async realizarPedido() {
        console.log('\n🍕 REALIZAR PEDIDO');
        console.log('-'.repeat(30));

        try {
            // Obtener o crear cliente
            const cliente = await this.obtenerCliente();
            
            // Mostrar menú de pizzas
            const pizzas = await Pizza.getAll(this.db);
            if (pizzas.length === 0) {
                console.log('❌ No hay pizzas disponibles en el menú');
                return;
            }

            console.log('\n📋 MENÚ DE PIZZAS:');
            pizzas.forEach((pizza, index) => {
                console.log(`${index + 1}. ${pizza.nombre} - $${pizza.precio} (${pizza.categoria})`);
            });

            const { pizzaSeleccionadas } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'pizzaSeleccionadas',
                    message: 'Selecciona las pizzas que deseas:',
                    choices: pizzas.map(pizza => ({
                        name: `${pizza.nombre} - $${pizza.precio}`,
                        value: pizza._id.toString()
                    }))
                }
            ]);

            if (pizzaSeleccionadas.length === 0) {
                console.log('❌ Debes seleccionar al menos una pizza');
                return;
            }

            // Realizar pedido con transacción
            const resultado = await this.pedidoService.realizarPedido(cliente._id, pizzaSeleccionadas);
            
            console.log('\n🎉 PEDIDO REALIZADO EXITOSAMENTE!');
            console.log('='.repeat(50));
            console.log(`📋 Pedido ID: ${resultado.pedido._id}`);
            console.log(`👤 Cliente: ${resultado.cliente.nombre}`);
            console.log(`🛵 Repartidor: ${resultado.repartidor.nombre} (${resultado.repartidor.zona})`);
            console.log(`💰 Total: $${resultado.total}`);
            console.log('🍕 Pizzas:');
            resultado.pizzas.forEach(pizza => {
                console.log(`  - ${pizza.nombre}: $${pizza.precio}`);
            });

        } catch (error) {
            console.log(`❌ Error realizando pedido: ${error.message}`);
        }
    }

    async obtenerCliente() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: '¿Cómo deseas proceder con el cliente?',
                choices: [
                    { name: '🔍 Buscar cliente existente', value: 'buscar' },
                    { name: '➕ Crear nuevo cliente', value: 'crear' }
                ]
            }
        ]);

        if (opcion === 'buscar') {
            const { telefono } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'telefono',
                    message: 'Ingresa el teléfono del cliente:'
                }
            ]);

            console.log(`🔍 Buscando cliente con teléfono: ${telefono}...`);
            let cliente = await Cliente.getByPhone(this.db, telefono);
            if (!cliente) {
                console.log('❌ Cliente no encontrado. Creando nuevo cliente...');
                return await this.crearCliente();
            }
            console.log(`✅ Cliente encontrado: ${cliente.nombre}`);
            return cliente;
        } else {
            return await this.crearCliente();
        }
    }

    async crearCliente() {
        const datos = await inquirer.prompt([
            {
                type: 'input',
                name: 'nombre',
                message: 'Nombre del cliente:'
            },
            {
                type: 'input',
                name: 'telefono',
                message: 'Teléfono:'
            },
            {
                type: 'input',
                name: 'direccion',
                message: 'Dirección:'
            }
        ]);

        return await Cliente.create(this.db, datos);
    }

    async verMenu() {
        console.log('\n📋 MENÚ DE PIZZAS');
        console.log('='.repeat(50));

        const pizzas = await Pizza.getAll(this.db);
        if (pizzas.length === 0) {
            console.log('❌ No hay pizzas en el menú');
            return;
        }

        // Obtener todos los ingredientes para mapear IDs a nombres
        const ingredientes = await Ingrediente.getAll(this.db);
        const ingredientesMap = {};
        ingredientes.forEach(ing => {
            ingredientesMap[ing._id.toString()] = ing.nombre;
        });

        // Agrupar por categoría
        const pizzasPorCategoria = {};
        pizzas.forEach(pizza => {
            if (!pizzasPorCategoria[pizza.categoria]) {
                pizzasPorCategoria[pizza.categoria] = [];
            }
            pizzasPorCategoria[pizza.categoria].push(pizza);
        });

        Object.keys(pizzasPorCategoria).forEach(categoria => {
            console.log(`\n🍕 ${categoria.toUpperCase()}:`);
            console.log('-'.repeat(30));
            pizzasPorCategoria[categoria].forEach(pizza => {
                console.log(`  ${pizza.nombre} - $${pizza.precio}`);
                
                // Mapear ingredientes a nombres legibles
                const ingredientesNombres = pizza.ingredientes.map(ing => {
                    const nombreIngrediente = ingredientesMap[ing.ingredienteId.toString()] || 'Ingrediente no encontrado';
                    return `${ing.cantidad}x ${nombreIngrediente}`;
                }).join(', ');
                
                console.log(`    Ingredientes: ${ingredientesNombres}`);
            });
        });
    }

    async gestionarClientes() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Gestión de Clientes:',
                choices: [
                    { name: '👥 Ver todos los clientes', value: 'ver_todos' },
                    { name: '➕ Agregar cliente', value: 'agregar' },
                    { name: '🔍 Buscar cliente', value: 'buscar' },
                    { name: '🔙 Volver al menú principal', value: 'volver' }
                ]
            }
        ]);

        switch (opcion) {
            case 'ver_todos':
                await this.verTodosLosClientes();
                break;
            case 'agregar':
                await this.crearCliente();
                console.log('✅ Cliente creado exitosamente');
                break;
            case 'buscar':
                await this.buscarCliente();
                break;
        }
    }

    async verTodosLosClientes() {
        const clientes = await Cliente.getAll(this.db);
        console.log('\n👥 CLIENTES REGISTRADOS:');
        console.log('='.repeat(60));
        
        if (clientes.length === 0) {
            console.log('❌ No hay clientes registrados');
            return;
        }

        clientes.forEach((cliente, index) => {
            console.log(`${index + 1}. ${cliente.nombre}`);
            console.log(`   📞 ${cliente.telefono}`);
            console.log(`   📍 ${cliente.direccion}`);
            console.log(`   📅 Registrado: ${cliente.createdAt.toLocaleDateString()}`);
            console.log('');
        });
    }

    async buscarCliente() {
        const { telefono } = await inquirer.prompt([
            {
                type: 'input',
                name: 'telefono',
                message: 'Ingresa el teléfono del cliente (con o sin guiones):',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Por favor ingresa un número de teléfono';
                    }
                    return true;
                }
            }
        ]);

        console.log(`🔍 Buscando cliente con teléfono: ${telefono}...`);
        
        const cliente = await Cliente.getByPhone(this.db, telefono);
        if (cliente) {
            console.log('\n👤 CLIENTE ENCONTRADO:');
            console.log('='.repeat(30));
            console.log(`Nombre: ${cliente.nombre}`);
            console.log(`Teléfono: ${cliente.telefono}`);
            console.log(`Dirección: ${cliente.direccion}`);
            console.log(`Registrado: ${cliente.createdAt.toLocaleDateString()}`);
        } else {
            console.log('❌ Cliente no encontrado');
            console.log('💡 Tip: Puedes buscar con o sin guiones (ej: 555-0101 o 5550101)');
        }
    }

    async gestionarIngredientes() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Gestión de Ingredientes:',
                choices: [
                    { name: '🧀 Ver todos los ingredientes', value: 'ver_todos' },
                    { name: '➕ Agregar ingrediente', value: 'agregar' },
                    { name: '📦 Actualizar stock', value: 'actualizar_stock' },
                    { name: '🔙 Volver al menú principal', value: 'volver' }
                ]
            }
        ]);

        switch (opcion) {
            case 'ver_todos':
                await this.verTodosLosIngredientes();
                break;
            case 'agregar':
                await this.agregarIngrediente();
                break;
            case 'actualizar_stock':
                await this.actualizarStockIngrediente();
                break;
        }
    }

    async verTodosLosIngredientes() {
        const ingredientes = await Ingrediente.getAll(this.db);
        console.log('\n🧀 INGREDIENTES DISPONIBLES:');
        console.log('='.repeat(60));
        
        if (ingredientes.length === 0) {
            console.log('❌ No hay ingredientes registrados');
            return;
        }

        // Agrupar por tipo
        const ingredientesPorTipo = {};
        ingredientes.forEach(ing => {
            if (!ingredientesPorTipo[ing.tipo]) {
                ingredientesPorTipo[ing.tipo] = [];
            }
            ingredientesPorTipo[ing.tipo].push(ing);
        });

        Object.keys(ingredientesPorTipo).forEach(tipo => {
            console.log(`\n${tipo.toUpperCase()}:`);
            console.log('-'.repeat(20));
            ingredientesPorTipo[tipo].forEach(ing => {
                const stockStatus = ing.stock > 10 ? '✅' : ing.stock > 0 ? '⚠️' : '❌';
                console.log(`  ${stockStatus} ${ing.nombre}: ${ing.stock} unidades`);
            });
        });
    }

    async agregarIngrediente() {
        const datos = await inquirer.prompt([
            {
                type: 'input',
                name: 'nombre',
                message: 'Nombre del ingrediente:'
            },
            {
                type: 'list',
                name: 'tipo',
                message: 'Tipo de ingrediente:',
                choices: ['queso', 'salsa', 'topping', 'masa', 'vegetal', 'carne', 'otro']
            },
            {
                type: 'number',
                name: 'stock',
                message: 'Stock inicial:',
                default: 0
            }
        ]);

        await Ingrediente.create(this.db, datos);
        console.log('✅ Ingrediente agregado exitosamente');
    }

    async actualizarStockIngrediente() {
        const ingredientes = await Ingrediente.getAll(this.db);
        if (ingredientes.length === 0) {
            console.log('❌ No hay ingredientes para actualizar');
            return;
        }

        const { ingredienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'ingredienteId',
                message: 'Selecciona el ingrediente:',
                choices: ingredientes.map(ing => ({
                    name: `${ing.nombre} (${ing.tipo}) - Stock: ${ing.stock}`,
                    value: ing._id
                }))
            }
        ]);

        const { nuevoStock } = await inquirer.prompt([
            {
                type: 'number',
                name: 'nuevoStock',
                message: 'Nuevo stock:',
                default: 0
            }
        ]);

        await Ingrediente.updateStock(this.db, ingredienteId, nuevoStock);
        console.log('✅ Stock actualizado exitosamente');
    }

    async gestionarRepartidores() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Gestión de Repartidores:',
                choices: [
                    { name: '🛵 Ver todos los repartidores', value: 'ver_todos' },
                    { name: '➕ Agregar repartidor', value: 'agregar' },
                    { name: '🔄 Cambiar estado', value: 'cambiar_estado' },
                    { name: '🔙 Volver al menú principal', value: 'volver' }
                ]
            }
        ]);

        switch (opcion) {
            case 'ver_todos':
                await this.verTodosLosRepartidores();
                break;
            case 'agregar':
                await this.agregarRepartidor();
                break;
            case 'cambiar_estado':
                await this.cambiarEstadoRepartidor();
                break;
        }
    }

    async verTodosLosRepartidores() {
        const repartidores = await Repartidor.getAll(this.db);
        console.log('\n🛵 REPARTIDORES:');
        console.log('='.repeat(50));
        
        if (repartidores.length === 0) {
            console.log('❌ No hay repartidores registrados');
            return;
        }

        repartidores.forEach((repartidor, index) => {
            const estadoIcon = repartidor.estado === 'disponible' ? '✅' : '🚫';
            console.log(`${index + 1}. ${estadoIcon} ${repartidor.nombre}`);
            console.log(`   📍 Zona: ${repartidor.zona}`);
            console.log(`   🔄 Estado: ${repartidor.estado}`);
            console.log('');
        });
    }

    async agregarRepartidor() {
        const datos = await inquirer.prompt([
            {
                type: 'input',
                name: 'nombre',
                message: 'Nombre del repartidor:'
            },
            {
                type: 'input',
                name: 'zona',
                message: 'Zona de reparto:'
            }
        ]);

        await Repartidor.create(this.db, datos);
        console.log('✅ Repartidor agregado exitosamente');
    }

    async cambiarEstadoRepartidor() {
        const repartidores = await Repartidor.getAll(this.db);
        if (repartidores.length === 0) {
            console.log('❌ No hay repartidores para actualizar');
            return;
        }

        const { repartidorId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'repartidorId',
                message: 'Selecciona el repartidor:',
                choices: repartidores.map(rep => ({
                    name: `${rep.nombre} (${rep.zona}) - ${rep.estado}`,
                    value: rep._id
                }))
            }
        ]);

        const { nuevoEstado } = await inquirer.prompt([
            {
                type: 'list',
                name: 'nuevoEstado',
                message: 'Nuevo estado:',
                choices: ['disponible', 'ocupado']
            }
        ]);

        await Repartidor.updateEstado(this.db, repartidorId, nuevoEstado);
        console.log('✅ Estado actualizado exitosamente');
    }

    async verReportes() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Reportes disponibles:',
                choices: [
                    { name: '🧀 Ingredientes más utilizados', value: 'ingredientes' },
                    { name: '💰 Promedio de precios por categoría', value: 'precios' },
                    { name: '📊 Categoría con más ventas', value: 'ventas' },
                    { name: '📋 Reporte completo', value: 'completo' },
                    { name: '🔙 Volver al menú principal', value: 'volver' }
                ]
            }
        ]);

        switch (opcion) {
            case 'ingredientes':
                await this.reporteService.ingredientesMasUtilizados();
                break;
            case 'precios':
                await this.reporteService.promedioPreciosPorCategoria();
                break;
            case 'ventas':
                await this.reporteService.categoriaConMasVentas();
                break;
            case 'completo':
                await this.reporteService.reporteCompleto();
                break;
        }
    }

    async verPedidos() {
        const { opcion } = await inquirer.prompt([
            {
                type: 'list',
                name: 'opcion',
                message: 'Ver pedidos:',
                choices: [
                    { name: '📋 Ver todos los pedidos', value: 'ver_todos' },
                    { name: '🔍 Buscar pedido por ID', value: 'buscar' },
                    { name: '❌ Cancelar pedido', value: 'cancelar' },
                    { name: '🔙 Volver al menú principal', value: 'volver' }
                ]
            }
        ]);

        switch (opcion) {
            case 'ver_todos':
                await this.verTodosLosPedidos();
                break;
            case 'buscar':
                await this.buscarPedido();
                break;
            case 'cancelar':
                await this.cancelarPedido();
                break;
        }
    }

    async verTodosLosPedidos() {
        const pedidos = await Pedido.getAll(this.db);
        console.log('\n📋 PEDIDOS:');
        console.log('='.repeat(80));
        
        if (pedidos.length === 0) {
            console.log('❌ No hay pedidos registrados');
            return;
        }

        pedidos.forEach((pedido, index) => {
            const estadoIcon = {
                'pendiente': '⏳',
                'en_proceso': '🔄',
                'entregado': '✅',
                'cancelado': '❌'
            }[pedido.estado] || '❓';

            console.log(`${index + 1}. ${estadoIcon} Pedido ID: ${pedido._id}`);
            console.log(`   👤 Cliente: ${pedido.clienteId}`);
            console.log(`   🛵 Repartidor: ${pedido.repartidorAsignado}`);
            console.log(`   💰 Total: $${pedido.total}`);
            console.log(`   📅 Fecha: ${pedido.fecha.toLocaleString()}`);
            console.log(`   🔄 Estado: ${pedido.estado}`);
            console.log('');
        });
    }

    async buscarPedido() {
        const { pedidoId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'pedidoId',
                message: 'Ingresa el ID del pedido:'
            }
        ]);

        const pedido = await Pedido.getById(this.db, pedidoId);
        if (pedido) {
            console.log('\n📋 PEDIDO ENCONTRADO:');
            console.log('='.repeat(40));
            console.log(`ID: ${pedido._id}`);
            console.log(`Cliente: ${pedido.clienteId}`);
            console.log(`Repartidor: ${pedido.repartidorAsignado}`);
            console.log(`Total: $${pedido.total}`);
            console.log(`Fecha: ${pedido.fecha.toLocaleString()}`);
            console.log(`Estado: ${pedido.estado}`);
        } else {
            console.log('❌ Pedido no encontrado');
        }
    }

    async cancelarPedido() {
        const { pedidoId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'pedidoId',
                message: 'Ingresa el ID del pedido a cancelar:'
            }
        ]);

        try {
            await this.pedidoService.cancelarPedido(pedidoId);
            console.log('✅ Pedido cancelado exitosamente');
        } catch (error) {
            console.log(`❌ Error cancelando pedido: ${error.message}`);
        }
    }

    async ejecutar() {
        let continuar = true;
        
        while (continuar) {
            try {
                const opcion = await this.mostrarMenuPrincipal();
                
                switch (opcion) {
                    case 'realizar_pedido':
                        await this.realizarPedido();
                        break;
                    case 'ver_menu':
                        await this.verMenu();
                        break;
                    case 'gestionar_clientes':
                        await this.gestionarClientes();
                        break;
                    case 'gestionar_ingredientes':
                        await this.gestionarIngredientes();
                        break;
                    case 'gestionar_repartidores':
                        await this.gestionarRepartidores();
                        break;
                    case 'ver_reportes':
                        await this.verReportes();
                        break;
                    case 'ver_pedidos':
                        await this.verPedidos();
                        break;
                    case 'salir':
                        continuar = false;
                        console.log('\n👋 ¡Gracias por usar Pizza y Punto!');
                        break;
                }

                if (continuar) {
                    await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'continuar',
                            message: 'Presiona Enter para continuar...'
                        }
                    ]);
                }
            } catch (error) {
                console.error('❌ Error en el menú:', error.message);
            }
        }
    }
}

module.exports = Menu;

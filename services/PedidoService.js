const { ObjectId } = require('mongodb');
const Pizza = require('../models/Pizza');
const Ingrediente = require('../models/Ingrediente');
const Repartidor = require('../models/Repartidor');
const Pedido = require('../models/Pedido');
const Cliente = require('../models/Cliente');

class PedidoService {
    constructor(db) {
        this.db = db;
    }

    async realizarPedido(clienteId, pizzaIds) {
        const session = await this.db.startSession();
        
        try {
            let resultado;
            await session.withTransaction(async () => {
                console.log('🔄 Iniciando transacción para realizar pedido...');
                
                // 1. Verificar que el cliente existe
                const cliente = await Cliente.getById(this.db, clienteId);
                if (!cliente) {
                    throw new Error(`Cliente con ID ${clienteId} no encontrado`);
                }
                console.log(`✅ Cliente verificado: ${cliente.nombre}`);

                // 2. Obtener pizzas y verificar que existen
                const pizzas = [];
                let total = 0;
                
                for (const pizzaId of pizzaIds) {
                    const pizza = await Pizza.getById(this.db, pizzaId);
                    if (!pizza) {
                        throw new Error(`Pizza con ID ${pizzaId} no encontrada`);
                    }
                    pizzas.push({ pizzaId, nombre: pizza.nombre, precio: pizza.precio });
                    total += pizza.precio;
                }
                console.log(`✅ Pizzas verificadas: ${pizzas.length} pizzas, Total: $${total}`);

                // 3. Verificar ingredientes disponibles
                const ingredientesNecesarios = await Pizza.getIngredientesNecesarios(this.db, pizzaIds);
                console.log('🔍 Verificando stock de ingredientes...');
                
                for (const [ingredienteId, cantidadNecesaria] of Object.entries(ingredientesNecesarios)) {
                    const ingrediente = await Ingrediente.getById(this.db, ingredienteId);
                    if (!ingrediente) {
                        throw new Error(`Ingrediente con ID ${ingredienteId} no encontrado`);
                    }
                    
                    if (ingrediente.stock < cantidadNecesaria) {
                        throw new Error(
                            `Stock insuficiente de ${ingrediente.nombre}. ` +
                            `Disponible: ${ingrediente.stock}, Necesario: ${cantidadNecesaria}`
                        );
                    }
                }
                console.log('✅ Stock de ingredientes verificado');

                // 4. Restar ingredientes del inventario
                console.log('📦 Actualizando inventario...');
                for (const [ingredienteId, cantidadNecesaria] of Object.entries(ingredientesNecesarios)) {
                    const ingrediente = await Ingrediente.getById(this.db, ingredienteId);
                    const nuevoStock = ingrediente.stock - cantidadNecesaria;
                    await Ingrediente.updateStock(this.db, ingredienteId, nuevoStock);
                    console.log(`  - ${ingrediente.nombre}: ${ingrediente.stock} → ${nuevoStock}`);
                }

                // 5. Asignar repartidor disponible
                const repartidor = await Repartidor.asignarRepartidor(this.db);
                if (!repartidor) {
                    throw new Error('No hay repartidores disponibles');
                }
                console.log(`✅ Repartidor asignado: ${repartidor.nombre} (${repartidor.zona})`);

                // 6. Crear el pedido
                const pedidoData = {
                    clienteId,
                    pizzas: pizzaIds.map(id => ({ pizzaId: id, cantidad: 1 })),
                    total,
                    repartidorAsignado: repartidor._id
                };
                
                const pedido = await Pedido.create(this.db, pedidoData);
                console.log(`✅ Pedido creado con ID: ${pedido._id}`);

                resultado = {
                    pedido,
                    cliente,
                    pizzas,
                    repartidor,
                    total
                };
            });

            console.log('🎉 Transacción completada exitosamente');
            return resultado;

        } catch (error) {
            console.error('❌ Error en la transacción:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async cancelarPedido(pedidoId) {
        const session = await this.db.startSession();
        
        try {
            let resultado;
            await session.withTransaction(async () => {
                console.log('🔄 Iniciando transacción para cancelar pedido...');
                
                // 1. Obtener el pedido
                const pedido = await Pedido.getById(this.db, pedidoId);
                if (!pedido) {
                    throw new Error(`Pedido con ID ${pedidoId} no encontrado`);
                }
                
                if (pedido.estado === 'entregado') {
                    throw new Error('No se puede cancelar un pedido ya entregado');
                }

                // 2. Devolver ingredientes al inventario
                const ingredientesNecesarios = await Pizza.getIngredientesNecesarios(
                    this.db, 
                    pedido.pizzas.map(p => p.pizzaId)
                );
                
                console.log('📦 Devolviendo ingredientes al inventario...');
                for (const [ingredienteId, cantidad] of Object.entries(ingredientesNecesarios)) {
                    const ingrediente = await Ingrediente.getById(this.db, ingredienteId);
                    const nuevoStock = ingrediente.stock + cantidad;
                    await Ingrediente.updateStock(this.db, ingredienteId, nuevoStock);
                    console.log(`  + ${ingrediente.nombre}: ${ingrediente.stock} → ${nuevoStock}`);
                }

                // 3. Liberar repartidor
                await Repartidor.updateEstado(this.db, pedido.repartidorAsignado, 'disponible');
                console.log('✅ Repartidor liberado');

                // 4. Actualizar estado del pedido
                await Pedido.updateEstado(this.db, pedidoId, 'cancelado');
                console.log('✅ Pedido cancelado');

                resultado = { pedido, mensaje: 'Pedido cancelado exitosamente' };
            });

            console.log('🎉 Transacción de cancelación completada');
            return resultado;

        } catch (error) {
            console.error('❌ Error cancelando pedido:', error.message);
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

module.exports = PedidoService;
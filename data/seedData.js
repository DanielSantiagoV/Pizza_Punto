const { ObjectId } = require('mongodb');
const Ingrediente = require('../models/Ingrediente');
const Pizza = require('../models/Pizza');
const Cliente = require('../models/Cliente');
const Repartidor = require('../models/Repartidor');

class SeedData {
    constructor(db) {
        this.db = db;
    }

    async seedIngredientes() {
        console.log('🌱 Sembrando ingredientes...');
        
        const ingredientes = [
            // Quesos
            { nombre: 'Mozzarella', tipo: 'queso', stock: 50 },
            { nombre: 'Parmesano', tipo: 'queso', stock: 30 },
            { nombre: 'Cheddar', tipo: 'queso', stock: 25 },
            { nombre: 'Gorgonzola', tipo: 'queso', stock: 15 },
            
            // Salsas
            { nombre: 'Salsa de Tomate', tipo: 'salsa', stock: 40 },
            { nombre: 'Salsa Pesto', tipo: 'salsa', stock: 20 },
            { nombre: 'Salsa BBQ', tipo: 'salsa', stock: 15 },
            { nombre: 'Salsa Alfredo', tipo: 'salsa', stock: 18 },
            
            // Toppings
            { nombre: 'Pepperoni', tipo: 'topping', stock: 35 },
            { nombre: 'Jamón', tipo: 'topping', stock: 30 },
            { nombre: 'Champiñones', tipo: 'topping', stock: 25 },
            { nombre: 'Aceitunas', tipo: 'topping', stock: 20 },
            { nombre: 'Pimientos', tipo: 'topping', stock: 22 },
            { nombre: 'Cebolla', tipo: 'topping', stock: 28 },
            { nombre: 'Tomate', tipo: 'topping', stock: 32 },
            { nombre: 'Albahaca', tipo: 'topping', stock: 15 },
            
            // Vegetales
            { nombre: 'Espinacas', tipo: 'vegetal', stock: 18 },
            { nombre: 'Rúcula', tipo: 'vegetal', stock: 12 },
            { nombre: 'Brócoli', tipo: 'vegetal', stock: 20 },
            
            // Carnes
            { nombre: 'Pollo', tipo: 'carne', stock: 25 },
            { nombre: 'Salchicha', tipo: 'carne', stock: 20 },
            { nombre: 'Bacon', tipo: 'carne', stock: 18 },
            
            // Masa
            { nombre: 'Masa Tradicional', tipo: 'masa', stock: 100 },
            { nombre: 'Masa Integral', tipo: 'masa', stock: 50 },
            { nombre: 'Masa Sin Gluten', tipo: 'masa', stock: 30 }
        ];

        for (const ingrediente of ingredientes) {
            await Ingrediente.create(this.db, ingrediente);
        }
        
        console.log(`✅ ${ingredientes.length} ingredientes sembrados`);
        return await Ingrediente.getAll(this.db);
    }

    async seedPizzas(ingredientes) {
        console.log('🍕 Sembrando pizzas...');
        
        // Crear un mapa de ingredientes por nombre para facilitar la búsqueda
        const ingredientesMap = {};
        ingredientes.forEach(ing => {
            ingredientesMap[ing.nombre] = ing._id;
        });

        const pizzas = [
            {
                nombre: 'Margherita',
                categoria: 'tradicional',
                precio: 12.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Albahaca'], cantidad: 1 }
                ]
            },
            {
                nombre: 'Pepperoni',
                categoria: 'tradicional',
                precio: 14.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Pepperoni'], cantidad: 2 }
                ]
            },
            {
                nombre: 'Hawaiana',
                categoria: 'especial',
                precio: 16.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Jamón'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Tomate'], cantidad: 1 }
                ]
            },
            {
                nombre: 'Cuatro Quesos',
                categoria: 'especial',
                precio: 17.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Parmesano'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Cheddar'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Gorgonzola'], cantidad: 1 }
                ]
            },
            {
                nombre: 'Vegetariana',
                categoria: 'vegana',
                precio: 15.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Integral'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Champiñones'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Pimientos'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Cebolla'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Espinacas'], cantidad: 1 }
                ]
            },
            {
                nombre: 'BBQ Chicken',
                categoria: 'especial',
                precio: 18.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa BBQ'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Pollo'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Cebolla'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Bacon'], cantidad: 1 }
                ]
            },
            {
                nombre: 'Pesto Vegana',
                categoria: 'vegana',
                precio: 16.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Sin Gluten'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa Pesto'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Rúcula'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Brócoli'], cantidad: 1 }
                ]
            },
            {
                nombre: 'Suprema',
                categoria: 'especial',
                precio: 19.99,
                ingredientes: [
                    { ingredienteId: ingredientesMap['Masa Tradicional'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Salsa de Tomate'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Mozzarella'], cantidad: 2 },
                    { ingredienteId: ingredientesMap['Pepperoni'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Jamón'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Champiñones'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Pimientos'], cantidad: 1 },
                    { ingredienteId: ingredientesMap['Cebolla'], cantidad: 1 }
                ]
            }
        ];

        for (const pizza of pizzas) {
            await Pizza.create(this.db, pizza);
        }
        
        console.log(`✅ ${pizzas.length} pizzas sembradas`);
    }

    async seedClientes() {
        console.log('👥 Sembrando clientes...');
        
        const clientes = [
            { nombre: 'Juan Pérez', telefono: '555-0101', direccion: 'Calle Principal 123' },
            { nombre: 'María García', telefono: '555-0102', direccion: 'Avenida Central 456' },
            { nombre: 'Carlos López', telefono: '555-0103', direccion: 'Plaza Mayor 789' },
            { nombre: 'Ana Martínez', telefono: '555-0104', direccion: 'Calle Secundaria 321' },
            { nombre: 'Luis Rodríguez', telefono: '555-0105', direccion: 'Boulevard Norte 654' },
            { nombre: 'Carmen Sánchez', telefono: '555-0106', direccion: 'Calle Sur 987' },
            { nombre: 'Pedro González', telefono: '555-0107', direccion: 'Avenida Este 147' },
            { nombre: 'Laura Fernández', telefono: '555-0108', direccion: 'Calle Oeste 258' }
        ];

        for (const cliente of clientes) {
            await Cliente.create(this.db, cliente);
        }
        
        console.log(`✅ ${clientes.length} clientes sembrados`);
    }

    async seedRepartidores() {
        console.log('🛵 Sembrando repartidores...');
        
        const repartidores = [
            { nombre: 'Miguel Torres', zona: 'Centro', estado: 'disponible' },
            { nombre: 'Sofia Herrera', zona: 'Norte', estado: 'disponible' },
            { nombre: 'Diego Morales', zona: 'Sur', estado: 'disponible' },
            { nombre: 'Valentina Ruiz', zona: 'Este', estado: 'disponible' },
            { nombre: 'Andrés Vargas', zona: 'Oeste', estado: 'disponible' },
            { nombre: 'Camila Jiménez', zona: 'Centro', estado: 'disponible' }
        ];

        for (const repartidor of repartidores) {
            await Repartidor.create(this.db, repartidor);
        }
        
        console.log(`✅ ${repartidores.length} repartidores sembrados`);
    }

    async seedAll() {
        console.log('🌱 Iniciando proceso de sembrado de datos...\n');
        
        try {
            const ingredientes = await this.seedIngredientes();
            await this.seedPizzas(ingredientes);
            await this.seedClientes();
            await this.seedRepartidores();
            
            console.log('\n🎉 ¡Datos sembrados exitosamente!');
            console.log('El sistema está listo para usar.');
        } catch (error) {
            console.error('❌ Error sembrando datos:', error);
            throw error;
        }
    }
}

module.exports = SeedData;
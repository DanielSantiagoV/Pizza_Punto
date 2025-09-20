const { ObjectId } = require('mongodb');

class Pizza {
    constructor(nombre, categoria, precio, ingredientes) {
        this.nombre = nombre;
        this.categoria = categoria; // tradicional, especial, vegana, etc.
        this.precio = precio;
        this.ingredientes = ingredientes; // array de objetos con ingrediente y cantidad
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    static async create(db, pizzaData) {
        const collection = db.getCollection('pizzas');
        const pizza = new Pizza(
            pizzaData.nombre,
            pizzaData.categoria,
            pizzaData.precio,
            pizzaData.ingredientes
        );
        const result = await collection.insertOne(pizza);
        return { ...pizza, _id: result.insertedId };
    }

    static async getAll(db) {
        const collection = db.getCollection('pizzas');
        return await collection.find({}).toArray();
    }

    static async getById(db, id) {
        const collection = db.getCollection('pizzas');
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    static async getByCategory(db, categoria) {
        const collection = db.getCollection('pizzas');
        return await collection.find({ categoria }).toArray();
    }

    static async getIngredientesNecesarios(db, pizzaIds) {
        const collection = db.getCollection('pizzas');
        const objectIds = pizzaIds.map(id => new ObjectId(id));
        const pizzas = await collection.find({ _id: { $in: objectIds } }).toArray();
        
        // Consolidar ingredientes necesarios
        const ingredientesNecesarios = {};
        pizzas.forEach(pizza => {
            pizza.ingredientes.forEach(ing => {
                if (ingredientesNecesarios[ing.ingredienteId]) {
                    ingredientesNecesarios[ing.ingredienteId] += ing.cantidad;
                } else {
                    ingredientesNecesarios[ing.ingredienteId] = ing.cantidad;
                }
            });
        });
        
        return ingredientesNecesarios;
    }
}

module.exports = Pizza;
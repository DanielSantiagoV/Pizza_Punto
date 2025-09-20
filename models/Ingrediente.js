const { ObjectId } = require('mongodb');

class Ingrediente {
    constructor(nombre, tipo, stock) {
        this.nombre = nombre;
        this.tipo = tipo; // queso, salsa, topping, etc.
        this.stock = stock; // unidades disponibles
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    static async create(db, ingredienteData) {
        const collection = db.getCollection('ingredientes');
        const ingrediente = new Ingrediente(
            ingredienteData.nombre,
            ingredienteData.tipo,
            ingredienteData.stock
        );
        const result = await collection.insertOne(ingrediente);
        return { ...ingrediente, _id: result.insertedId };
    }

    static async getAll(db) {
        const collection = db.getCollection('ingredientes');
        return await collection.find({}).toArray();
    }

    static async getById(db, id) {
        const collection = db.getCollection('ingredientes');
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    static async updateStock(db, id, newStock) {
        const collection = db.getCollection('ingredientes');
        return await collection.updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    stock: newStock,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async getByType(db, tipo) {
        const collection = db.getCollection('ingredientes');
        return await collection.find({ tipo }).toArray();
    }
}

module.exports = Ingrediente;
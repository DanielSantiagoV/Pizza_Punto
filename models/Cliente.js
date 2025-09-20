const { ObjectId } = require('mongodb');

class Cliente {
    constructor(nombre, telefono, direccion) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.direccion = direccion;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    static async create(db, clienteData) {
        const collection = db.getCollection('clientes');
        const cliente = new Cliente(
            clienteData.nombre,
            clienteData.telefono,
            clienteData.direccion
        );
        const result = await collection.insertOne(cliente);
        return { ...cliente, _id: result.insertedId };
    }

    static async getAll(db) {
        const collection = db.getCollection('clientes');
        return await collection.find({}).toArray();
    }

    static async getById(db, id) {
        const collection = db.getCollection('clientes');
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    static async getByPhone(db, telefono) {
        const collection = db.getCollection('clientes');
        
        // Normalizar el teléfono removiendo guiones, espacios y paréntesis
        const telefonoNormalizado = telefono.replace(/[-\(\)\s]/g, '');
        
        // Buscar primero con el teléfono exacto
        let cliente = await collection.findOne({ telefono });
        
        // Si no se encuentra, buscar con el teléfono normalizado
        if (!cliente) {
            cliente = await collection.findOne({
                $or: [
                    { telefono: { $regex: telefonoNormalizado, $options: 'i' } },
                    { telefono: { $regex: telefono.replace(/[-\(\)\s]/g, ''), $options: 'i' } }
                ]
            });
        }
        
        return cliente;
    }
}

module.exports = Cliente;
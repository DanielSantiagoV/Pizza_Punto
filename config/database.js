const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.dbName = 'pizza_y_punto';
    }

    async connect() {
        try {
            this.client = new MongoClient(this.uri);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            console.log('✅ Conectado a MongoDB exitosamente');
            return this.db;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.close();
                console.log('🔌 Desconectado de MongoDB');
            }
        } catch (error) {
            console.error('❌ Error desconectando de MongoDB:', error);
        }
    }

    getCollection(collectionName) {
        if (!this.db) {
            throw new Error('Base de datos no conectada');
        }
        return this.db.collection(collectionName);
    }

    async startSession() {
        if (!this.client) {
            throw new Error('Cliente MongoDB no conectado');
        }
        return this.client.startSession();
    }
}

module.exports = new Database();
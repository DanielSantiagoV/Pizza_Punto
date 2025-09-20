const database = require('./config/database');
const Menu = require('./cli/menu');
const SeedData = require('./data/seedData');

async function main() {
    try {
        // Conectar a la base de datos
        await database.connect();
        
        // Verificar si hay datos en la base de datos
        const ingredientes = await database.getCollection('ingredientes').countDocuments();
        
        if (ingredientes === 0) {
            console.log('📦 No se encontraron datos en la base de datos.');
            console.log('🌱 Iniciando proceso de sembrado de datos de ejemplo...\n');
            
            const seedData = new SeedData(database);
            await seedData.seedAll();
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ Sistema inicializado correctamente');
            console.log('='.repeat(60));
        } else {
            console.log('✅ Base de datos conectada con datos existentes');
        }
        
        // Iniciar el menú principal
        const menu = new Menu(database);
        await menu.ejecutar();
        
    } catch (error) {
        console.error('❌ Error en la aplicación:', error);
    } finally {
        // Desconectar de la base de datos
        await database.disconnect();
        process.exit(0);
    }
}

// Manejar señales de terminación
process.on('SIGINT', async () => {
    console.log('\n\n👋 Cerrando aplicación...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n👋 Cerrando aplicación...');
    await database.disconnect();
    process.exit(0);
});

// Ejecutar la aplicación
main();
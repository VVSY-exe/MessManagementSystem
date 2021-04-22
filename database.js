const mysql=require('mysql2/promise');
module.exports={
    async connectToDb(){
        const pool= await mysql.createPool({
            host: "127.0.0.1",
            user: "root",
            password: process.env.dbpassword,
            database: "messmanagementsystem",
            waitForConnections: true,
            connectionLimit: 10,
          });
          return pool;
    },
    
  async disconnectFromDb(pool) {
    try {
      let res = await pool.end();
    } catch(err) {
      console.error('Error in destructor:');
    }
  }

}
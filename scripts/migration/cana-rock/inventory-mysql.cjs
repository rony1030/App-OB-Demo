/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");

const canaRockRepo = process.env.CANA_ROCK_REPO;

if (!canaRockRepo) {
  throw new Error("CANA_ROCK_REPO is required");
}

const mysql = require(path.join(canaRockRepo, "node_modules", "mysql2", "promise"));

const connectionOptions = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const tablesOnly = process.argv.includes("--tables-only");
  const connection = await mysql.createConnection(connectionOptions);

  try {
    await connection.query("SET SESSION TRANSACTION READ ONLY");
    await connection.beginTransaction();

    const [server] = await connection.query(
      "SELECT DATABASE() AS database_name, VERSION() AS server_version",
    );
    const [tables] = await connection.query(`
      SELECT
        table_name,
        engine,
        table_rows AS estimated_rows,
        data_length,
        index_length
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableInventory = [];
    for (const table of tables) {
      const tableName = table.TABLE_NAME ?? table.table_name;
      if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
        throw new Error(`Unsafe table name returned by metadata: ${tableName}`);
      }

      const [countRows] = await connection.query(
        `SELECT COUNT(*) AS exact_rows FROM \`${tableName}\``,
      );
      tableInventory.push({
        table: tableName,
        exact_rows: Number(countRows[0].exact_rows),
        engine: table.ENGINE ?? table.engine,
        data_bytes: Number(table.DATA_LENGTH ?? table.data_length ?? 0),
        index_bytes: Number(table.INDEX_LENGTH ?? table.index_length ?? 0),
      });
    }

    let columns = [];
    let foreignKeys = [];
    if (!tablesOnly) {
      [columns] = await connection.query(`
        SELECT
          table_name,
          column_name,
          column_type,
          is_nullable,
          column_key,
          extra
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        ORDER BY table_name, ordinal_position
      `);
      [foreignKeys] = await connection.query(`
        SELECT
          table_name,
          column_name,
          referenced_table_name,
          referenced_column_name,
          constraint_name
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
          AND referenced_table_name IS NOT NULL
        ORDER BY table_name, constraint_name, ordinal_position
      `);
    }

    await connection.rollback();
    process.stdout.write(
      `${JSON.stringify({ server: server[0], tables: tableInventory, columns, foreignKeys }, null, 2)}\n`,
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ code: error.code || "ERROR", message: error.message })}\n`,
  );
  process.exitCode = 1;
});

// database.js
// Simples wrapper para criar SQLite DB + migrations + seed
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.db');

function open() {
  return new sqlite3.Database(DB_FILE);
}

function runSql(sql) {
  return new Promise((resolve, reject) => {
    const db = open();
    db.exec(sql, (err) => {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

async function migrate() {
  const initSql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
  await runSql(initSql);
}

async function seedIfEmpty() {
  const db = open();
  db.get("SELECT count(1) AS c FROM users", (err, row) => {
    if (err) { db.close(); return; }
    if (row && row.c === 0) {
      const stmt = db.prepare("INSERT INTO users (name,email,role,password) VALUES (?,?,?,?)");
      stmt.run("Admin","admin@local","admin","admin"); // senha simples de seed (troque em prod)
      stmt.finalize();

      const s2 = db.prepare("INSERT INTO visits (day,visits) VALUES (?,?)");
      const now = Date.now();
      // seed 7 dias
      for (let i=6;i>=0;i--) {
        s2.run(i, Math.round(120 + Math.random()*120));
      }
      s2.finalize();

      const s3 = db.prepare("INSERT INTO conversions (day,countv) VALUES (?,?)");
      for (let i=6;i>=0;i--) s3.run(i, Math.round(8 + Math.random()*25));
      s3.finalize();

      const s4 = db.prepare("INSERT INTO actions (text,created_at) VALUES (?,?)");
      s4.run("Iniciado sistema", new Date().toISOString());
      s4.finalize();
    }
    db.close();
  });
}

module.exports = { open, migrate, seedIfEmpty, DB_FILE };

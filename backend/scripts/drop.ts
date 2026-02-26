import { AppDataSource } from '../src/config/data-source';

const dropTables = async () => {
  // Override synchronize for this specific run so it boots without error
  AppDataSource.setOptions({ synchronize: false });
  await AppDataSource.initialize();
  console.log('🗑️ Connected to DB. Forcibly dropping tables...');

  try {
    const queryRunner = AppDataSource.createQueryRunner();

    // Disable constraints temporarily to drop everything
    await queryRunner.query('SET session_replication_role = replica;');

    await queryRunner.query(`DROP TABLE IF EXISTS "answers" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "results" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_models" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subjects" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sections" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knex_migrations" CASCADE;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "knex_migrations_lock" CASCADE;`,
    );

    await queryRunner.query('SET session_replication_role = DEFAULT;');
    await queryRunner.release();

    console.log('✅ All old tables dropped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
    process.exit(1);
  }
};

dropTables();

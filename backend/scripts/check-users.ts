import { AppDataSource } from '../src/config/data-source';
import { User } from '../src/entities/User';

const check = async () => {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: ['role'] });
  console.log('--- Current Users ---');
  users.forEach((u) => {
    console.log(
      `ID: ${u.id}, Username: ${u.username}, NationalID: ${u.national_id}, Role: ${u.role?.name}`,
    );
  });
  process.exit(0);
};

check().catch(console.error);

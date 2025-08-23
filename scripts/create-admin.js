import bcrypt from 'bcryptjs';

async function hashPassword() {
  const password = 'RCadmin2025';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash for password RCadmin2025:');
  console.log(hash);
}

hashPassword();
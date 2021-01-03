import { compile, compileAll } from '../compiler';

async function main() {
    await compileAll('constantinople');
    await compileAll('byzantium');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

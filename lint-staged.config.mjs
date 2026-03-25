export default {
  '*.ts': [
    () => 'pnpm typecheck',
    () => 'pnpm lint',
    () => 'pnpm spellcheck',
    () => 'pnpm test',
  ],
};
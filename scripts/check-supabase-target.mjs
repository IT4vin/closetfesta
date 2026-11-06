// Verificação estática e segura. NÃO se conecta ao Supabase ou valida permissões.
// Para confirmar a conexão real, é necessário consultar o projeto por uma conta autorizada.
import fs from "node:fs";
import process from "node:process";

const config = fs.readFileSync("supabase/config.toml", "utf8");
const match = config.match(/^\s*project_id\s*=\s*["']([a-z0-9]{20})["']/m);
if (!match) {
  console.error("ERRO: supabase/config.toml sem project_id válido.");
  process.exit(1);
}
const expectedRef = match[1];
const references = [];
if (fs.existsSync(".env")) {
  const envText = fs.readFileSync(".env", "utf8");
  const envMatch = envText.match(/^\s*VITE_SUPABASE_URL\s*=\s*["']?([^\s"'#]+)["']?/m);
  if (envMatch) references.push({ source: ".env", url: envMatch[1] });
}
if (process.env.VITE_SUPABASE_URL) {
  references.push({ source: "VITE_SUPABASE_URL", url: process.env.VITE_SUPABASE_URL });
}
if (process.env.SUPABASE_EXPECTED_PROJECT_REF &&
    process.env.SUPABASE_EXPECTED_PROJECT_REF !== expectedRef) {
  console.error("ERRO: project_id não confere com SUPABASE_EXPECTED_PROJECT_REF.");
  process.exit(1);
}
if (!references.length) {
  console.error("AVISO: nenhuma URL foi informada para comparar com supabase/config.toml.");
}
for (const { source, url } of references) {
  let host;
  try { host = new URL(url).hostname; }
  catch {
    console.error(`ERRO: URL inválida em ${source}.`);
    process.exit(1);
  }
  if (host !== `${expectedRef}.supabase.co`) {
    console.error(`ERRO: referência em ${source} diverge de supabase/config.toml. Não prossiga com o deploy.`);
    process.exit(1);
  }
}
console.log(`Referência configurada para o Supabase: ${expectedRef}.`);
console.log("IMPORTANTE: este teste NÃO comprova acesso ao banco nem confirma o ambiente de produção.");

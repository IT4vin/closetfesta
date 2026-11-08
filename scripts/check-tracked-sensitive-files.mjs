import { execFileSync } from "node:child_process";

const listed = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
const risky = listed.filter((path) => {
  const file = path.replace(/\\/g, "/").split("/").at(-1) ?? "";
  const envFile = /^\.env(?:\..+)?$/.test(file) &&
    !file.endsWith(".example");
  const localDatabase = /\.(?:db|sqlite|sqlite3)$/i.test(file);
  const secretName = /(?:^|\/)(?:service-role|secrets?|credentials?)\.(?:json|pem|key)$/i.test(path);
  return envFile || localDatabase || secretName;
});

if (risky.length) {
  console.error("Arquivos sensíveis ou bancos locais versionados:");
  for (const file of risky) console.error(" - " + file);
  console.error("Remova do índice do Git e rotacione segredos expostos. Ignorar o arquivo não remove o histórico.");
  process.exitCode = 1;
} else {
  console.log("Nenhum arquivo sensível ou banco local versionado na branch.");
}

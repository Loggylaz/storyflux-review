import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Chemins
  const rootEnv   = path.resolve(__dirname, '../../../.env'); // racine du repo
  const serverEnv = path.resolve(__dirname, '../.env');       // apps/server/.env (on évite d'en avoir un)

  // 1) On charge le .env racine en écrasant tout (même variables d'env existantes)
  dotenv.config({ path: rootEnv, override: true });

  // 2) Si jamais un apps/server/.env existe encore, on l'applique aussi
  //    (tu peux garder override: false pour qu'il N'ÉCRASE PAS la racine)
  dotenv.config({ path: serverEnv, override: false });
}

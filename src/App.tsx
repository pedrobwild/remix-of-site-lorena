/**
 * App.tsx — Home da Bewild (rota `/`).
 *
 * A nova Home é totalmente autocontida em `src/pages/HomePage.tsx` (com
 * nav e footer próprios), seguindo o spec v4 do prompt. Por isso aqui não
 * renderizamos Header/Footer globais.
 */
import HomePage from "./pages/HomePage";

export default function App() {
  return <HomePage />;
}

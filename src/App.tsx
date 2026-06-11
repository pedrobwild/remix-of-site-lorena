/**
 * App.tsx — Home da BeWild (rota `/`).
 *
 * A Home foi reescrita em `src/pages/HomePage.tsx` (porte fiel do mock
 * aprovado: hero cinematográfico, lâminas, trilho horizontal pinado,
 * cartões empilhados, portal, comparativo, FAQ, CTA final, FloatingCTA).
 * O Header/Footer continuam globais.
 */
import Header from "./components/landing/Header";
import Footer from "./components/landing/Footer";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <>
      <Header />
      <HomePage />
      <Footer />
    </>
  );
}

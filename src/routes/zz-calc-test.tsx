import { createFileRoute } from "@tanstack/react-router";
import ReformaCalculadora from "@/components/ReformaCalculadora";
export const Route = createFileRoute("/zz-calc-test")({ component: () => <ReformaCalculadora /> });

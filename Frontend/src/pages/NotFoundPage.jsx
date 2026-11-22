import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <section className="container-x flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-cyan">
        Error 404
      </p>
      <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base">
        This page may have moved or the address may be incorrect.
      </p>
      <Button as={Link} to="/" className="mt-8">
        Back to home
      </Button>
    </section>
  );
}

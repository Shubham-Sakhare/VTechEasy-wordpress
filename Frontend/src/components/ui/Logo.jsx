import { Link } from "react-router-dom";

export default function Logo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      {/* Simple abstract "bird / spark" mark built with gradients */}
      <span className="relative grid h-10 w-10 place-items-center">
        <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="45%" stopColor="#2d7cff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="logoGrad2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path
            d="M8 26c6-2 10-6 14-14 1 8 5 13 14 15-7 2-11 6-14 13-2-7-7-11-14-14z"
            fill="url(#logoGrad)"
          />
          <path
            d="M30 10c3 1 6 3 8 7-4-1-7 0-10 3 1-4 1-7 2-10z"
            fill="url(#logoGrad2)"
          />
        </svg>
      </span>
      <span className="font-display text-xl font-extrabold leading-none">
        Tech <span className="text-gradient-warm">Easy</span>
      </span>
    </Link>
  );
}

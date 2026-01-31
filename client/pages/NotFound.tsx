import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-xl md:text-2xl text-sunset-200 mb-2">
          Oops! Page not found
        </p>
        <p className="text-sunset-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sunset-500 to-pink-500 hover:from-sunset-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-sunset-500/50"
        >
          <Home className="w-5 h-5" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

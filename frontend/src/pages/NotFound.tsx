import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ROLE_HOME } from '../types';

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? ROLE_HOME[user.role] : '/';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1c33] px-4 text-center text-[#f6f1e7]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <Construction className="h-16 w-16 text-[#c6a15b] mb-4" />
        <h1 className="font-display text-7xl text-[#c6a15b]">404</h1>
        <div className="mx-auto mt-4 h-[3px] w-24 bg-gradient-to-r from-transparent via-[#c6a15b] to-transparent" />
        <p className="mt-5 text-xl font-semibold">Page not found</p>
        <p className="mt-2 max-w-md text-white/60">
          The page you are looking for does not exist, has been moved, or you may not have permission to view it.
        </p>
        <Link
          to={home}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c6a15b] px-6 py-3 font-semibold text-[#0b1c33] transition hover:bg-[#d4b46e] hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          {user ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </motion.div>
    </div>
  );
}

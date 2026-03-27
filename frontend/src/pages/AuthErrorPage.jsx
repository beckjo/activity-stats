import { useSearchParams, Link } from 'react-router-dom';

const errorMessages = {
  access_denied: 'You denied access to your Strava account.',
  no_code: 'No authorization code was received.',
  server_error: 'A server error occurred. Please try again.',
  no_token: 'Authentication failed. Please try again.',
};

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'server_error';
  const message = errorMessages[reason] || 'An unexpected error occurred.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h1>
        <p className="text-gray-500 mb-6">{message}</p>
        <Link to="/" className="btn-primary">
          Try Again
        </Link>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSheetId } from '../../store/settingsSlice';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { googleSheetsService, GoogleSheetsService } from '../../services/GoogleSheetsService';
import { GOOGLE_CONFIG } from '../../config/google';

export default function Onboarding() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const existingSheetId = useAppSelector(state => state.settings.sheetId);
  const { signIn, isSignedIn, userEmail, error: authError } = useGoogleAuth();

  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if Client ID is configured
  const isConfigured = !!GOOGLE_CONFIG.CLIENT_ID;

  // If user is signed in and has a sheetId, they're ready to go
  // App.tsx will handle navigation to dashboard
  const hasExistingSetup = !!existingSheetId;

  const handleSignIn = () => {
    if (!isConfigured) {
      setError('Google Client ID is not configured. Please check your .env file.');
      return;
    }

    setError('');
    signIn();
  };

  const handleSheetSetup = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a valid Google Sheet URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract spreadsheet ID from URL
      const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        throw new Error('Invalid Google Sheet URL');
      }

      // Save sheet ID
      dispatch(setSheetId(spreadsheetId));

      // Initialize sheets (create if needed)
      await googleSheetsService.initializeSheets(spreadsheetId);

      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up Google Sheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('onboarding.title')}
          </h1>
          <p className="text-gray-600">
            {t('onboarding.subtitle')}
          </p>
        </div>

        {!isConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-900 font-semibold mb-2">{t('onboarding.configRequired')}</p>
            <p className="text-xs text-red-800">
              {t('onboarding.configMessage')}
            </p>
          </div>
        )}

        {/* Step 1: Sign in with Google */}
        {!isSignedIn ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {hasExistingSetup ? t('onboarding.signInToContinue') : t('onboarding.step1')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {hasExistingSetup
                  ? t('onboarding.sessionExpired')
                  : t('onboarding.needAccess')
                }
              </p>

              {!hasExistingSetup && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-xs text-blue-900 font-semibold mb-2">{t('onboarding.whatAccess')}</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>{t('onboarding.accessItem1')}</li>
                    <li>{t('onboarding.accessItem2')}</li>
                    <li>{t('onboarding.accessItem3')}</li>
                  </ul>
                </div>
              )}
            </div>

            {(error || authError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error || authError}</p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={loading || !isConfigured}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? t('onboarding.signingIn') : t('onboarding.signInButton')}
            </button>
          </div>
        ) : hasExistingSetup ? (
          /* User has existing setup, show loading message while App.tsx navigates */
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                {t('onboarding.signedInAs', { email: userEmail })}
              </p>
            </div>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">{t('onboarding.loadingData')}</p>
            </div>
          </div>
        ) : (
          /* Step 2: Google Sheet Setup - only for new users */
          <div className="space-y-6">
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  {t('onboarding.signedInAs', { email: userEmail })}
                </p>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('onboarding.step2')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t('onboarding.enterSheetUrl')}
              </p>

              <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700 mb-2">
                {t('onboarding.sheetUrlLabel')}
              </label>
              <input
                type="text"
                id="sheetUrl"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('onboarding.noSheet')}{' '}
                <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {t('onboarding.createSheet')}
                </a>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleSheetSetup}
              disabled={loading || !sheetUrl.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('onboarding.settingUp') : t('onboarding.completeSetup')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateSettings, setSheetId } from '../../store/settingsSlice';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings.settings);
  const currentSheetId = useAppSelector(state => state.settings.sheetId);
  const { persistAuth, setPersistAuth } = useGoogleAuth();

  const [formData, setFormData] = useState({
    sheetId: currentSheetId || '',
    dependents: settings.dependents.toString(),
    ownerSplit: (settings.ownerSplit * 100).toString(),
    adminSplit: (settings.adminSplit * 100).toString(),
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update Google Sheet ID (localStorage)
    if (formData.sheetId !== currentSheetId) {
      dispatch(setSheetId(formData.sheetId));
    }

    // Update settings (will sync to Google Sheets later)
    dispatch(updateSettings({
      dependents: parseInt(formData.dependents),
      ownerSplit: parseFloat(formData.ownerSplit) / 100,
      adminSplit: parseFloat(formData.adminSplit) / 100,
    }));

    // Show saved feedback
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google Sheet ID */}
          <div>
            <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheet ID
            </label>
            <input
              type="text"
              id="sheetId"
              value={formData.sheetId}
              onChange={(e) => setFormData({ ...formData, sheetId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your Google Sheet ID..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Stored locally for connection purposes only
            </p>
          </div>

          {/* Security Settings Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Security Settings</h3>

            {/* Keep me signed in toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="persistAuth" className="block text-sm font-medium text-gray-700">
                    Keep me signed in
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {persistAuth
                      ? 'You\'ll stay signed in after closing your browser'
                      : 'You\'ll be logged out when you close your browser (more secure)'}
                  </p>
                </div>
                <button
                  type="button"
                  id="persistAuth"
                  onClick={() => setPersistAuth(!persistAuth)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    persistAuth ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={persistAuth}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      persistAuth ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 font-semibold mb-1">🔒 Security Note:</p>
                <p className="text-xs text-blue-800">
                  For better security, disable "Keep me signed in" on shared computers.
                  This stores your access token only in session storage, which clears when you close the browser.
                </p>
              </div>
            </div>
          </div>

          {/* Tax Settings Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Tax Settings</h3>

            {/* Number of Dependents */}
            <div className="mb-4">
              <label htmlFor="dependents" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Dependents
              </label>
              <input
                type="number"
                id="dependents"
                min="0"
                value={formData.dependents}
                onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for tax deduction calculation
              </p>
            </div>
          </div>

          {/* Income Split Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Income Split</h3>

            {/* Owner Split */}
            <div className="mb-4">
              <label htmlFor="ownerSplit" className="block text-sm font-medium text-gray-700 mb-2">
                Owner Percentage (%)
              </label>
              <input
                type="number"
                id="ownerSplit"
                min="0"
                max="100"
                step="0.01"
                value={formData.ownerSplit}
                onChange={(e) => {
                  const ownerValue = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    ownerSplit: e.target.value,
                    adminSplit: (100 - ownerValue).toFixed(2),
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Admin Split */}
            <div className="mb-4">
              <label htmlFor="adminSplit" className="block text-sm font-medium text-gray-700 mb-2">
                Administrator Percentage (%)
              </label>
              <input
                type="number"
                id="adminSplit"
                min="0"
                max="100"
                step="0.01"
                value={formData.adminSplit}
                onChange={(e) => {
                  const adminValue = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    adminSplit: e.target.value,
                    ownerSplit: (100 - adminValue).toFixed(2),
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Validation message */}
            {parseFloat(formData.ownerSplit) + parseFloat(formData.adminSplit) !== 100 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠ Owner and Administrator percentages must add up to 100%
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={parseFloat(formData.ownerSplit) + parseFloat(formData.adminSplit) !== 100}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

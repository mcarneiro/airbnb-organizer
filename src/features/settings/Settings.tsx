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
  const { persistAuth, setPersistAuth, fullLogout } = useGoogleAuth();

  const [formData, setFormData] = useState({
    sheetId: currentSheetId || '',
    dependents: settings.dependents.toString(),
    ownerSplit: (settings.ownerSplit * 100).toString(),
    adminSplit: (settings.adminSplit * 100).toString(),
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google Sheet ID */}
          <div>
            <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-2">
              ID da Planilha Google
            </label>
            <input
              type="text"
              id="sheetId"
              value={formData.sheetId}
              onChange={(e) => setFormData({ ...formData, sheetId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Digite o ID da sua Planilha Google..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Armazenado localmente apenas para fins de conexão
            </p>
          </div>

          {/* Security Settings Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Configurações de Segurança</h3>

            {/* Keep me signed in toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="persistAuth" className="block text-sm font-medium text-gray-700">
                    Manter conectado
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {persistAuth
                      ? 'Você permanecerá conectado após fechar o navegador'
                      : 'Você será desconectado ao fechar o navegador (mais seguro)'}
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
                <p className="text-xs text-blue-900 font-semibold mb-1">🔒 Nota de Segurança:</p>
                <p className="text-xs text-blue-800">
                  Para melhor segurança, desative "Manter conectado" em computadores compartilhados.
                  Isso armazena seu token de acesso apenas no armazenamento de sessão, que é limpo quando você fecha o navegador.
                </p>
              </div>
            </div>
          </div>

          {/* Tax Settings Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Configurações de Impostos</h3>

            {/* Number of Dependents */}
            <div className="mb-4">
              <label htmlFor="dependents" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Dependentes
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
                Usado para cálculo de dedução de impostos
              </p>
            </div>
          </div>

          {/* Income Split Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Divisão de Renda</h3>

            {/* Owner Split */}
            <div className="mb-4">
              <label htmlFor="ownerSplit" className="block text-sm font-medium text-gray-700 mb-2">
                Porcentagem do Proprietário (%)
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
                Porcentagem do Administrador (%)
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
                  ⚠ As porcentagens do Proprietário e Administrador devem somar 100%
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
            {isSaved ? '✓ Salvo!' : 'Salvar Configurações'}
          </button>
        </form>

        {/* Logout Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Sair e Limpar Todos os Dados
          </button>
          <p className="mt-2 text-xs text-center text-gray-500">
            Isso removerá todos os dados armazenados localmente e fará logout da sua conta
          </p>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Logout</h3>
              <p className="text-sm text-gray-600 mb-6">
                Tem certeza que deseja sair? Isso irá:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• Fazer logout da sua conta Google</li>
                <li>• Remover o ID da planilha armazenado</li>
                <li>• Limpar todas as configurações locais</li>
                <li>• Limpar todos os dados em memória</li>
              </ul>
              <p className="text-sm text-gray-600 mb-6">
                Seus dados na Planilha Google permanecerão intactos.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={fullLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Sim, Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

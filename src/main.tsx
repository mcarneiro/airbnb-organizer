import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import { store } from './store'
import { GoogleAuthProvider } from './contexts/GoogleAuthContext'
import { GOOGLE_CONFIG } from './config/google'
import './config/i18n' // Initialize i18n
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CONFIG.CLIENT_ID}>
      <Provider store={store}>
        <GoogleAuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleAuthProvider>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)

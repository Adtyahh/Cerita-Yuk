import { login } from '../../data/api';
import { saveAuthToken, getAuthToken } from '../../utils';

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <div class="form-container">
          <h2>Login</h2>
          <form id="login-form">
            <div id="error-message" class="error-message"></div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="form-button" id="login-button">Login</button>
            <p style="margin-top: 15px;">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const loadingOverlay = document.querySelector('#loading-overlay');
    
    loadingOverlay.style.display = 'none';

    if (getAuthToken()) {
      window.location.hash = '#/';
      return;
    }

    const loginForm = document.querySelector('#login-form');
    const errorMessage = document.querySelector('#error-message');
    const loginButton = document.querySelector('#login-button');
    const formContainer = document.querySelector('.form-container'); 

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = ''; 

      loadingOverlay.style.display = 'flex';
      loginButton.disabled = true;

      const email = event.target.email.value;
      const password = event.target.password.value;

      try {
        const response = await login({ email, password });
        saveAuthToken(response.loginResult.token);
        
        loadingOverlay.style.display = 'none';

        formContainer.innerHTML = `
          <div class="success-message">
            <span class="success-icon">✅</span>
            <h2>Selamat Datang</h2>
            <p>Ayo Bagikan Cerita Anda Sekarang!</p>
          </div>
        `;

        setTimeout(() => {
          window.location.hash = '#/';
        }, 2000);

      } catch (error) {
        loadingOverlay.style.display = 'none';
        loginButton.disabled = false;
        errorMessage.textContent = error.message;
      }
    });
  }
}
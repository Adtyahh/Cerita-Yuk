import { register } from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <div class="form-container">
          <h2>Register</h2>
          <form id="register-form">
            <div id="error-message" class="error-message"></div>
            <div class="form-group">
              <label for="name">Nama</label>
              <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" minlength="8" required>
            </div>
            <button type="submit" class="form-button">Register</button>
            <p style="margin-top: 15px;">Sudah punya akun? <a href="#/login">Login di sini</a></p>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.querySelector('#register-form');
    const errorMessage = document.querySelector('#error-message');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = ''; 

      const name = event.target.name.value;
      const email = event.target.email.value;
      const password = event.target.password.value;

      try {
        await register({ name, email, password });
        
        alert('Registrasi berhasil! Silakan login.');
        window.location.hash = '#/login';
      } catch (error) {
        errorMessage.textContent = error.message;
      }
    });
  }
}
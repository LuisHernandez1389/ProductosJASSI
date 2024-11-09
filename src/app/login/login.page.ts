import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {
  username: string = '';
  password: string = '';

  private apiUrl = 'https://jassi-productos-default-rtdb.firebaseio.com/vendedores.json';
  vendedores: any[] = [];
  usuarioLogueado: any = null;

  constructor(private http: HttpClient, private navCtrl: NavController) {}

  ngOnInit() {
    this.http.get(this.apiUrl).subscribe(
      (data: any) => {
        // Convertimos el objeto en un array para poder iterarlo
        this.vendedores = Object.keys(data).map(key => {
          return { id: key, ...data[key] };
        });

        console.log('Vendedores:', this.vendedores);
      },
      error => {
        console.error('Error al obtener los vendedores:', error);
      }
    );
    this.verificarLocalStorage();
  }

  login() {
    const usuario = this.username.trim();
    const contrasena = this.password.trim();
    
    // Buscar el usuario y la contraseña en la lista de vendedores
    const usuarioEncontrado = this.vendedores.find(vendedor =>
      vendedor.usuario === usuario && vendedor.contrasena === contrasena
    );

    if (usuarioEncontrado) {
      this.usuarioLogueado = usuarioEncontrado;
      console.log('Usuario logueado:', this.usuarioLogueado);
      
      // Guardar el usuario logueado en localStorage
      localStorage.setItem('usuarioLogueado', JSON.stringify(this.usuarioLogueado));

      // Redirigir a la página de tabs
      this.navCtrl.navigateRoot('/tabs');
    } else {
      console.log('Credenciales incorrectas');
      // Mostrar un mensaje de error o realizar otras acciones
    }
  }

  verificarLocalStorage() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    if (usuarioGuardado) {
      console.log('Usuario guardado en localStorage:', JSON.parse(usuarioGuardado));
      // Redirigir a la página de tabs si el usuario ya está logueado
      this.navCtrl.navigateRoot('/tabs');
    } else {
      console.log('No se encontró usuario en localStorage.');
    }
  }
}

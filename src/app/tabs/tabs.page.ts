import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// Interfaces
interface Producto {
  cantidad: number;
  id: string;
  nombre: string;
  precio: string;
}

interface Usuario {
  nombre: string;
  apellido: string;
  id: string;
  telefono: string;
  usuario: string;
  contrasena: string;
  mercancia?: any;
  mercanciaInicial?: any;
}

interface Venta {
  carrito: Producto[];
  fecha: string;
  usuario: Usuario;
}

interface VentasData {
  [key: string]: Venta;
}

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {
  MAC: string = '';
  apiUrl: string = 'https://jassi-productos-default-rtdb.firebaseio.com/ventas.json';
  ventas$: Observable<VentasData>;
  presentingElement: any;
  nombre: string | null = null;
  apellido: string | null = null;

  constructor(
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private http: HttpClient
  ) {
    this.ventas$ = this.http.get<VentasData>(this.apiUrl);
  }

  ngOnInit() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (usuarioLogueado) {
      const usuario = JSON.parse(usuarioLogueado);
      this.nombre = usuario.nombre;
      this.apellido = usuario.apellido;
    }
    this.presentingElement = document.querySelector('ion-page');
    console.log(localStorage.getItem('savedText'));
  }

  getVentas() {
    this.ventas$ = this.http.get<VentasData>(this.apiUrl).pipe(
      tap(data => console.log('Contenido del nodo "ventas":', data)),
      catchError(error => {
        console.error('Error al obtener datos del nodo "ventas":', error);
        throw error;
      })
    );
  }

  saveToLocalStorage() {
    if (this.MAC) {
      localStorage.setItem('savedText', this.MAC);
      alert('MAC guardada');
      this.MAC = '';
    } else {
      alert('Por favor, ingresa un valor para la MAC');
    }
  }

  public actionSheetButtons = [
    {
      text: 'Cerrar Sesión',
      handler: () => {
        this.logout();
      }
    }
  ];

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones',
      buttons: this.actionSheetButtons
    });
    await actionSheet.present();
  }

  logout() {
    localStorage.removeItem('usuarioLogueado');
    this.router.navigate(['/login']);
    window.location.reload();
  }
}
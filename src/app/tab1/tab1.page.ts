//VERSION PRINCIPAL
//Se importo el OnInit para estar cachando los datos en tiempo real
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  private apiUrl = 'https://jassi-productos-default-rtdb.firebaseio.com/articulos.json';
  articulos: any[] = [];
  
//////////////////
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(this.apiUrl).subscribe(
      (data: any) => {
        this.articulos = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          cantidad: null
        }));
      },
      error => {
        console.error('Error al obtener los artículos:', error);
      }
    );
  }
  /////////////////////

  agregarAlCarrito(articulo: any) {
    if (!articulo.cantidad || articulo.cantidad < 1) {
      articulo.cantidad = 1;
    }

    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const articuloEnCarrito = carrito.find((item: any) => item.id === articulo.id);

    if (articuloEnCarrito) {
      articuloEnCarrito.cantidad += articulo.cantidad;
    } else {
      carrito.push({
        id: articulo.id,
        nombre: articulo.nombre,
        precio: articulo.precio,
        cantidad: articulo.cantidad
      });
    }
//////////////////////////
    localStorage.setItem('carrito', JSON.stringify(carrito));
    articulo.cantidad = null;
    window.dispatchEvent(new Event('carritoActualizado'));  
    ////////////////
  }
}
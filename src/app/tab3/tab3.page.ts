import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
})
export class Tab3Page implements OnInit {
  public alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: () => {
        this.corte();
      },
    },
  ];

  setResult(ev: { detail: { role: any; }; }) {
    console.log(`Dismissed with role: ${ev.detail.role}`);
  }
  selectedTab: string = 'tab1'; // Tab seleccionado por defecto
  mercancia: { [key: string]: any } = {}; // Tipo específico para mercancia
  mercanciaArray: { key: string; value: any }[] = [];
  mercanciaInicialArray: {
    key: string;
    value: { precio: string; unidades: number };
  }[] = [];

  mercanciaInicial: {
    [key: string]: { [key: string]: { precio: string; unidades: number } };
  } = {};
  articulos: { [key: string]: { nombre: string } } = {}; // Almacena los artículos
    
  private apiUrlArticulos =
    'https://jassi-productos-default-rtdb.firebaseio.com/articulos.json';

  constructor(private http: HttpClient) {
    const usuario = this.obtenerUsuarioLogueado(); // Obtén el usuario logueado al iniciar el componente
    console.log('Usuario logueado:', usuario);
  }

  ngOnInit() {
    this.cargarArticulos();
    const usuario = this.obtenerUsuarioLogueado();
    if (usuario) {
      this.obtenerMercancia(usuario.id);
      this.obtenerMercanciaInicial(usuario.id); // Llamada para obtener la mercancía inicial
    } else {
      console.log('No hay usuario logueado');
    }
    
  }

  cargarArticulos() {
    this.http
      .get<{ [key: string]: { nombre: string } }>(this.apiUrlArticulos)
      .subscribe(
        (response) => {
          this.articulos = response;
        },
        (error) => {
          console.error('Error al cargar los artículos:', error);
        }
      );
  }

  getArticuloNombre(id: string): string {
    return this.articulos[id]?.nombre || 'Nombre no disponible';
  }

  calcularTotal(): number {
    let total = 0;

    for (const vendedor of Object.values(this.mercanciaInicial)) {
      for (const item of Object.values(vendedor)) {
        const precio = parseFloat(item.precio);
        const unidades = item.unidades;
        total += precio * unidades;
      }
    }

    return total;
  }

  obtenerUsuarioLogueado(): { id: string } | null {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  }

  obtenerMercancia(id: string) {
    const url = `https://jassi-productos-default-rtdb.firebaseio.com/vendedores/${id}/mercancia.json`;
    this.http.get(url).subscribe(
      (data) => {
        this.mercancia = data;
        // Convertir el objeto mercancia en un arreglo
        this.mercanciaArray = Object.keys(this.mercancia).map((key) => ({
          key: key,
          value: this.mercancia[key],
        }));
        console.log('Mercancia:', this.mercanciaArray);
      },
      (error) => {
        console.error('Error al obtener la mercancia:', error);
      }
    );
  }
  
  obtenerMercanciaInicial(id: string) {
    const url = `https://jassi-productos-default-rtdb.firebaseio.com/vendedores/${id}/mercanciaInicial.json`;

    this.http.get(url).subscribe(
      (data) => {
        console.log('Datos de mercancía:', data);

        // Suponemos que la respuesta es un objeto donde el primer nivel es el ID
        const mercancia = data as {
          [key: string]: {
            [key: string]: { precio: string; unidades: number };
          };
        };

        // Extraemos los datos del primer ID
        const mercanciaData = Object.values(mercancia)[0];

        // Convertimos el objeto de artículos en un arreglo
        this.mercanciaInicialArray = Object.keys(mercanciaData).map((key) => ({
          key: key,
          value: mercanciaData[key],
        }));

        console.log('Mercancía Inicial Array:', this.mercanciaInicialArray);
      },
      (error) => {
        console.error('Error al obtener la mercancía inicial:', error);
      }
    );
  }

  //Funcion para calcular el total de precios 

  calcularTotalPrecios(): number {
    let total = 0;

    //Sumar el total de precios por unidades en mercanciaArray
    this.mercanciaArray.forEach(
      (item: { key: string; value: { precio: string; unidades: number } }) => {
        if (
          item.value &&
          item.value.unidades !== undefined &&
          item.value.precio !== undefined
        ) {
          total += parseFloat(item.value.precio) * item.value.unidades;
        }
      }
    );

    return total;
  }

  calcularTotalPrecios2(): number {
    let total = 0;

    //Sumar el total de precios por unidades en mercanciaInicialArray
    this.mercanciaInicialArray.forEach(
      (item: { key: string; value: { precio: string; unidades: number } }) => {
        if (
          item.value &&
          item.value.unidades !== undefined &&
          item.value.precio !== undefined
        ) {
          total += parseFloat(item.value.precio) * item.value.unidades;
        }
      }
    );

    return total;
  }

  //Funcion para calcular el total de precios por articulo
  calcularTotalPorArticulo(precio: string, unidades: number): number {
    return parseFloat(precio) * unidades;
  }

  corte() {
    const usuario = this.obtenerUsuarioLogueado();
    if (!usuario) {
      console.error('No hay usuario logueado para realizar el corte.');
      return;
    }
  
    // Crear el objeto del corte
    const nuevoCorte = {
      fecha: new Date().toLocaleString(), // Guardamos la fecha actual
      mercanciaArray: this.mercanciaArray,
      mercanciaInicialArray: this.mercanciaInicialArray,
      totalMercancia: this.calcularTotalPrecios(),
      totalMercanciaInicial: this.calcularTotalPrecios2(),
      totalVendido: this.calcularTotalPrecios2() - this.calcularTotalPrecios(),
    };
  
    // Ruta de Firebase para guardar el corte
    const url = `https://jassi-productos-default-rtdb.firebaseio.com/vendedores/${usuario.id}/cortes.json`;
  
    // Hacer una solicitud POST para añadir el nuevo corte al array de cortes
    this.http.post(url, nuevoCorte).subscribe(
      (response) => {
        console.log('Corte guardado correctamente:', response);
      },
      (error) => {
        console.error('Error al guardar el corte:', error);
      }
    );
  }
  
}

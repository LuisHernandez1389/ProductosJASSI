import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import EscPosEncoder from 'esc-pos-encoder-ionic';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { AlertController } from '@ionic/angular';
import { Share } from '@capacitor/share';


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
    
  private ventaGuardada: any = null; // Propiedad para almacenar la venta

  carrito: any[] = [];
  mercancia: any = {};
  articulos: any = {};
  vendedores: any = {};
  private apiUrlVentas = 'https://jassi-productos-default-rtdb.firebaseio.com/ventas.json';
  private apiUrlArticulos = 'https://jassi-productos-default-rtdb.firebaseio.com/articulos.json';
  private apiUrlVendedores = 'https://jassi-productos-default-rtdb.firebaseio.com/vendedores.json';
  selectedTab: string = 'tab1'; // Tab seleccionado por defecto
  private apiUrl = 'http://localhost:8000/imprimir'; // Cambia esta URL si es necesario
  MAC_ADDRESS = ''; // check your mac address in listDevices or discoverUnpaired

  constructor(
    private http: HttpClient, 
    private alertController: AlertController, 
    private bluetoothSerial: BluetoothSerial
  ) {
    this.cargarCarrito();
    this.cargarVendedores();
    this.cargarArticulos();
    window.addEventListener('carritoActualizado', () => {
      this.cargarCarrito();
    });
    let encoder = new EscPosEncoder();

    let result = encoder
      .initialize()
      .text('The quick brown fox jumps over the lazy dog')
      .newline()
      .qrcode('https://nielsleenheer.com')
      .encode();

    console.log(result);
  }

  ngOnInit() {
    console.log(this.carrito);

  }

  eliminarDelCarrito(articulo: any) {
    const index = this.carrito.findIndex(item => item.id === articulo.id);
    if (index !== -1) {
      // Eliminar el artículo del carrito
      this.carrito.splice(index, 1);
      this.guardarCarrito();
    }
  }

  agregarAlCarrito(articulo: any) {
    const index = this.carrito.findIndex(item => item.id === articulo.id);
    if (index !== -1) {
      // Si ya está en el carrito, aumentar la cantidad
      this.carrito[index].cantidad++;
    } else {
      // Si no está, añadirlo al carrito
      this.carrito.push({ ...articulo, cantidad: 1 });
    }
    // Disminuir la cantidad en mercancia temporalmente
    this.mercancia[articulo.id].unidades--;
    this.guardarCarrito();
  }

  guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
  }

  cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.carrito = JSON.parse(carritoGuardado);
    }
  }

  cargarVendedores() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    if (usuario && usuario.id) {
      this.http.get<any>(this.apiUrlVendedores).subscribe(
        response => {
          this.vendedores = response;
          this.mercancia = this.vendedores[usuario.id]?.mercancia || {};
        },
        error => {
          console.error('Error al cargar los vendedores:', error);
        }
      );
    }
  }

  cargarArticulos() {
    this.http.get<any>(this.apiUrlArticulos).subscribe(
      response => {
        this.articulos = response;
      },
      error => {
        console.error('Error al cargar los artículos:', error);
      }
    );
  }
  actualizarUnidadesEnFirebase() {
    this.carrito.forEach(item => {
      // Obtener el artículo actual en base al id del carrito
      const articuloId = item.id;
  
      // Obtener la cantidad actual del artículo en el nodo de "articulos"
      this.http.get<any>(`https://jassi-productos-default-rtdb.firebaseio.com/articulos/${articuloId}.json`).subscribe(
        articulo => {
          if (articulo && articulo.cantidad) {
            // Descontar la cantidad en el carrito de la cantidad actual del artículo
            const nuevaCantidad = parseInt(articulo.cantidad, 10) - item.cantidad;
  
            // Actualizar la cantidad en el nodo de "articulos"
            this.http.patch(`https://jassi-productos-default-rtdb.firebaseio.com/articulos/${articuloId}.json`, { cantidad: nuevaCantidad }).subscribe(
              response => {
                console.log(`Unidades del artículo ${articuloId} actualizadas a ${nuevaCantidad}:`, response);

              },
              error => {
                console.error(`Error al actualizar las unidades del artículo ${articuloId}:`, error);
              }
            );
          }
        },
        error => {
          console.error(`Error al obtener el artículo ${articuloId}:`, error);
        }
      );
    });
  }
  
  guardarCarritoEnDB() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    const venta = {
      carrito: this.carrito,
      fecha: new Date().toLocaleString(),
      usuario: usuario
    };

    this.http.post(this.apiUrlVentas, venta).subscribe(
      response => {
        // Guardar la venta en la propiedad
        this.ventaGuardada = response;
        console.log('Carrito guardado en la base de datos:', this.ventaGuardada);

        // Actualizar unidades de mercancía en la base de datos usando PATCH
        const updatedMercancia = { ...this.mercancia };

        this.carrito.forEach(item => {
          if (updatedMercancia[item.id]) {
            updatedMercancia[item.id].unidades -= item.cantidad;
          }
        });

        // Enviar los datos actualizados al servidor usando PATCH
        this.http.patch(`https://jassi-productos-default-rtdb.firebaseio.com/vendedores/${usuario.id}/mercancia.json`, updatedMercancia).subscribe(
          response => {
            console.log('Unidades de mercancía actualizadas:', response);
          },
          error => {
            console.error('Error al actualizar unidades de mercancía:', error);
          }
        );
        this.actualizarUnidadesEnFirebase();
        this.compartirTicket();
        // Limpiar el carrito
        this.carrito = [];
        this.guardarCarrito();
      },
      error => {
        console.error('Error al guardar el carrito en la base de datos:', error);
      }
    );
  }

  // Método para acceder a la venta guardada
  obtenerVentaGuardada() {
    return this.ventaGuardada;
  }

  getMercanciaKeys() {
    return Object.keys(this.mercancia);
  }

  calculateTotal(): number {
    let total = 0;

    for (const key of Object.keys(this.mercancia)) {
      const item = this.mercancia[key];
      const quantity = item.unidades || 0;
      const price = this.articulos[key]?.precio || 0;

      total += quantity * price;
    }

    return total;
  }

  generarTicketTexto(): string {
    // Verificar si el carrito está vacío
    if (!this.carrito || this.carrito.length === 0) {
      return "No hay artículos en el carrito";
    }
  
    let totalGeneral = 0;
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();
    const vendedor = localStorage.getItem('usuarioLogueado') ? 
      JSON.parse(localStorage.getItem('usuarioLogueado')!).nombre : 'N/A';
  
    // Función para centrar texto
    const centrarTexto = (texto: string, ancho: number = 32) => {
      const espacios = Math.max(0, (ancho - texto.length) / 2);
      return ' '.repeat(Math.floor(espacios)) + texto;
    };
  
    // Construir el contenido del carrito como texto plano
    const carritoTexto = this.carrito.map(item => {
      const precio = Number(item.precio);
      const subtotal = item.cantidad * precio;
      totalGeneral += subtotal;
      return centrarTexto(`${item.nombre}`) + '\n' +
             centrarTexto(`${item.cantidad} x $${precio.toFixed(2)} = $${subtotal.toFixed(2)}`);
    }).join('\n');
  
    // Construir el ticket como texto
    const ticketTexto = `
  ${centrarTexto('')}  
  ${centrarTexto('       PRODUCTOS JASSI       ')}
  ${centrarTexto('¡Una Botana con Sabor!')}
  ${centrarTexto('Tel: 6444128557')}
  ${centrarTexto('-----------------------------')}
  ${centrarTexto(`Fecha: ${fecha}`)}
  ${centrarTexto(`Hora: ${hora}`)}
  ${centrarTexto(`Vendedor: ${vendedor}`)}
  ${centrarTexto('-----------------------------')}
  ${carritoTexto}
  ${centrarTexto('-----------------------------')}
  ${centrarTexto(`TOTAL: $${totalGeneral.toFixed(2)}`)}
  ${centrarTexto('-----------------------------')}
  ${centrarTexto('Gracias por su compra')}
  ${centrarTexto('¡Vuelva pronto!')}
    ${centrarTexto('')}  
  ${centrarTexto('')}  

  `.trim();
  
    return ticketTexto;
  }

  compartirTicket() {
    const ticketTexto = this.generarTicketTexto(); // Usar la misma función para obtener el ticket
  
    // Usar el plugin nativo de compartir de Capacitor
    Share.share({
      title: 'Ticket de Compra',
      text: ticketTexto,
      dialogTitle: 'Compartir Ticket'
    }).then(() => {
      console.log('Ticket compartido con éxito');
    }).catch((error) => {
      console.error('Error al compartir el ticket:', error);
    });
  }
  
  

  reset() {
    console.log('reset')
    window.location.reload();
  }

}

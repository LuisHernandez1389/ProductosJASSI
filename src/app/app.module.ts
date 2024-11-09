import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { environment  } from '../environments/environment';

import { initializeApp } from 'firebase/app';
import { HttpClientModule } from '@angular/common/http';

import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';



@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, BluetoothSerial],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
  }
}

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { IndexComponent } from './post/index/index.component';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent, IndexComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}

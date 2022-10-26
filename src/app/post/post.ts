import { OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

export class Post implements OnInit {
  post!: FormGroup;

  /*constructor(
        id: number,
        marca: string,
        modelo: string,
        anio: number,
        color: string,
        precio: string
    ){}*/

  ngOnInit(): void {
    this.post = new FormGroup({
      marca: new FormControl(''),
      modelo: new FormControl(''),
      anio: new FormControl(''),
      color: new FormControl(''),
      precio: new FormControl(''),
    });
  }
}

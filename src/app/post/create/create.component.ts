import { Component, OnInit } from '@angular/core';
//import { PostService } from '../post.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css'],
})
export class CreateComponent implements OnInit {
  form!: FormGroup;
  post!: FormGroup;
  array = [];

  constructor(
    //public postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      marca: new FormControl('', Validators.required),
      modelo: new FormControl('', [Validators.required]),
      anio: new FormControl('', Validators.required),
      color: new FormControl('', [Validators.required]),
      precio: new FormControl('', Validators.required),
    });
  }

  get f() {
    return this.form.controls;
  }

  /*submit(){
    console.log(this.form.value);
    this.postService.create(this.form.value).subscribe(()=> {
         console.log('Vehiculo creado correctamente!');
         this.router.navigateByUrl('post/index');
    })
  }*/

  onSubmit() {
    console.log(this.form.value);
    /*this.array.push({
      marca:this.form.marca,
      modelo:this.form.modelo,
      anio:this.form.anio,
      color:this.form.color,
      precio:this.form.precio
    });*/
  }
}

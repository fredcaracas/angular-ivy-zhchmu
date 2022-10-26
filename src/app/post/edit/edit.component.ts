import { Component, OnInit } from '@angular/core';
//import { PostService } from '../post.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../post';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
})
export class EditComponent implements OnInit {
  id!: number;
  marca!: string;
  modelo!: string;
  anio!: number;
  color!: string;
  precio!: string;

  post!: Post;
  form!: FormGroup;

  constructor(
    //public postService: PostService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {}

  /*this.form = new FormGroup({
      id: new FormControl('', [Validators.required]),
      marca: new FormControl('', Validators.required),
      modelo: new FormControl('', [Validators.required]),
      anio: new FormControl('', Validators.required),
      color: new FormControl('', [Validators.required]),
      precio: new FormControl('', Validators.required)
    });
  }*/

  /*get f(){
    return this.form.controls;
  }*/

  /*submit(){
    console.log(this.form.value);
    this.postService.update(this.id, this.form.value).subscribe(() => {
         console.log('Post updated successfully!');
         this.router.navigateByUrl('post/index');
    })
  }*/
}

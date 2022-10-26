import { Component, OnInit } from '@angular/core';
//import { PostService } from '../post.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../post';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
})
export class ViewComponent implements OnInit {
  id!: number;
  marca!: string;
  modelo!: string;
  anio!: number;
  color!: string;
  precio!: string;

  post!: Post;

  constructor(
    //public postService: PostService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {}
}

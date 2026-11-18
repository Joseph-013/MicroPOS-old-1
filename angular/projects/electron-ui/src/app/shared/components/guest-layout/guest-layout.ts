import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GeneralLayout, Logo } from '@angular-shared';

@Component({
  selector: 'app-guest-layout',
  imports: [GeneralLayout, Logo, RouterOutlet],
  templateUrl: './guest-layout.html',
  styles: ``,
})
export class GuestLayout {}

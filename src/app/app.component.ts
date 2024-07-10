import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RelatorioComponent } from './relatorio/relatorio.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RelatorioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'projeto';
}

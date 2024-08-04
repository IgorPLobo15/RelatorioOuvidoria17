import { Component } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RelatorioComponent } from './relatorio/relatorio.component';
import { bootstrapApplication } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RelatorioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})

export class AppComponent {
  title = 'projeto';
}
const routes = [
  { path: 'relatorio', component: RelatorioComponent },
  // Outras rotas, se necessário
];
bootstrapApplication(RouterOutlet, {
  providers: [
    provideRouter(routes)
  ]
});

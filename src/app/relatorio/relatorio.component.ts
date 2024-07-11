import { DataService } from './../services/data.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './relatorio.component.html',
  styleUrl: './relatorio.component.css'
})
export class RelatorioComponent implements OnInit {
  filtroForm: FormGroup;
  orgaos: any[] = [];
  tipos: any[] = [];
  assuntos: any[] = [];
  subassuntos: any[] = [];
  tramites: any[] = [];
  graficoPainel1: any;
  totalRegistros: number = 0;

  constructor(private fb: FormBuilder, private dataService: DataService) {
    this.filtroForm = this.fb.group({
      data_inicial: [''],
      data_final: [''],
      orgao: [''],
      tipo: [''],
      assunto: [''],
      subassunto: [''],
      tramite: ['']
    });
  }

  ngOnInit(): void {
    this.carregarCombosIniciais();
  }

  carregarCombosIniciais() {
    this.dataService.getOrgaos().subscribe(data => this.orgaos = data);
    this.dataService.getManifestacaoTipos().subscribe(data => this.tipos = data);
    this.dataService.getAssuntos().subscribe(data => this.assuntos = data);
    this.dataService.getTramites().subscribe(data => this.tramites = data);
  }

  onAssuntoChange() {
    const idAssunto = this.filtroForm.get('assunto')?.value;
    this.dataService.getSubassuntos(idAssunto).subscribe(data => this.subassuntos = data);
  }

  onSubmit() {
    if (this.filtroForm.valid) {
       console.log('Filtros:', this.filtroForm.value);
      this.carregarGrafico1();
    }
  }

  carregarGrafico1() {
    const filtros = this.filtroForm.value;
    this.dataService.getDadosPainel1(1, filtros).subscribe(data => {
      const tipos = data.map((item: any) => item.ds_manifestacao_tipo);
      const nums = data.map((item: any) => item.num);

      const totalRegistros = nums.reduce((a: number, b: number) => a + Number(b), 0);
      this.totalRegistros = totalRegistros.toLocaleString('pt-BR');

      const ctx = document.getElementById('painel1') as HTMLCanvasElement;
      if (this.graficoPainel1) this.graficoPainel1.destroy();

      this.graficoPainel1 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: tipos,
          datasets: [{
            label: 'Quantidade de Manifestações',
            data: nums,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    });
  }
}


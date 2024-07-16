import { DadosPainelItem, DataService } from './../services/data.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
  graficoPainel2: any;
  graficoPainel3: any;
  graficoPainel4: Chart | undefined;
  graficoPainel5: Chart | undefined;
  graficoPainel6: Chart | undefined;

  totalRegistros: string = '0';  // Propriedade para armazenar o total de registros formatado

  constructor(private fb: FormBuilder, private dataService : DataService) {
    this.filtroForm = this.fb.group({
      data_inicial: [''],
      data_final: [''],
      orgao: [''],
      tipo: [''],
      assunto: [''],
      subassunto: [''],
      tramite: [''],
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
      const filtros = this.filtroForm.value;
      console.log('Filtros aplicados:', filtros);  // Verifique os filtros aplicados
      this.carregarGraficos();
    }
  }

  carregarGraficos() {
    const filtros = this.filtroForm.value;

    // Remova propriedades vazias dos filtros
    const filtrosLimpos = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v != ''));
    console.log('Filtros enviados para a API:', filtrosLimpos);  // Verifique os filtros enviados

    this.carregaGraficoPainel1(filtrosLimpos);
    this.carregaGraficoPainel2(filtrosLimpos);
    this.carregaGraficoPainel3(filtrosLimpos);
    this.carregaGraficoPainel4(filtrosLimpos);
    this.carregaGraficoPainel5(filtrosLimpos);
    this.carregaGraficoPainel6(filtrosLimpos);
  }

  carregaGraficoPainel1(filtros: any) {
    const ctx = document.getElementById('painel1') as HTMLCanvasElement;
    if (this.graficoPainel1) this.graficoPainel1.destroy();

    this.dataService.getDadosPainel1(1, filtros).subscribe(data => {
      console.log('Dados da API para Painel 1:', data);  // Verifique os dados retornados pela API

      const tipos = data.map((item: any) => item.ds_manifestacao_tipo);
      const nums = data.map((item: any) => item.num);

      // Calcule e formate o total de registros
      const totalRegistros = nums.reduce((a: number, b: number) => a + Number(b), 0);
      this.totalRegistros = totalRegistros.toLocaleString('pt-BR');

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

  carregaGraficoPainel2(filtros: any) {
      const ctx = document.getElementById('painel2') as HTMLCanvasElement;
      if (this.graficoPainel2) this.graficoPainel2.destroy();

      this.dataService.getDadosPainel1(2, filtros).subscribe(data => {
        console.log('Dados da API para Painel 2:', data);  // Verifique os dados retornados pela API

        const meses = [...new Set(data.map((item: DadosPainelItem) => item.MES))]; // Extrai os meses únicos
        const tipos = [...new Set(data.map((item: DadosPainelItem) => item.ds_manifestacao_tipo))]; // Extrai os tipos únicos

        // Preparar os dados para o gráfico
        let corAleatoria = this.gerarCorAleatoria();
        const datasets = tipos.map(tipo => {
          const dataPorTipo = data.filter((item: DadosPainelItem) => item.ds_manifestacao_tipo === tipo);
          const dataPorMes = meses.map(mes => {
            const registro = dataPorTipo.find((item: DadosPainelItem) => item.MES === mes);
            return registro ? registro.num : 0;
          });

          if (corAleatoria.length === 0) {
            console.log("Todas as cores foram usadas, considerar resetar a lista ou aumentar as opções.");
            corAleatoria = this.gerarCorAleatoria();
          }
          const corFinal = corAleatoria.shift();

          return {
            label: tipo,
            data: dataPorMes,
            fill: false,
            borderColor: corFinal,
            backgroundColor: corFinal,
            tension: 0.1
          };
        });

        this.graficoPainel2 = new Chart(ctx, {
          type: 'line',
          data: {
            labels: meses,
            datasets: datasets as any[] // Aqui, garantimos que o tipo esteja correto
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
                display: true,
                position: 'bottom',
                align: 'start' // Isto não irá alinhar a caixa de legenda à esquerda do canvas
              }
            }
          }
        });
      });
  }
  carregaGraficoPainel3(filtros: any) {
    const ctx = document.getElementById('painel3') as HTMLCanvasElement;
  if (this.graficoPainel3) this.graficoPainel3.destroy();

  this.dataService.getDadosPainel1(3, filtros).subscribe((data: DadosPainelItem[]) => {
    console.log('Dados da API para Painel 3:', data);  // Verifique os dados retornados pela API

    // Agrupa dados por órgão e soma as quantidades
    let somaPorOrgao: { [key: string]: number } = {};
    data.forEach((item: DadosPainelItem) => {
      somaPorOrgao[item.ds_sigla] = (somaPorOrgao[item.ds_sigla] || 0) + parseInt(item.num, 10);
    });

    // Transforma o objeto em array e ordena por quantidade
    let orgaosOrdenados = Object.keys(somaPorOrgao).map(key => ({
      orgao: key,
      total: somaPorOrgao[key]
    })).sort((a, b) => b.total - a.total);

    // Seleciona os top 10 órgãos e agrupa os demais em "Outros"
    let topOrgaos = orgaosOrdenados.slice(0, 10);
    let outrosTotal = orgaosOrdenados.slice(10).reduce((acc: number, curr: { orgao: string; total: number }) => acc + curr.total, 0);
    if (outrosTotal > 0) {
      topOrgaos.push({ orgao: 'Outros', total: outrosTotal });
    }

    // Prepara os dados para o gráfico
    let corAleatoria = this.gerarCorAleatoria();
    const meses = [...new Set(data.map(item => item.MES))];
    const datasets = topOrgaos.map(orgao => {
      const dadosOrgao: { [key: string]: number } = data.filter(item => item.ds_sigla === orgao.orgao || (orgao.orgao === 'Outros' && !topOrgaos.find(o => o.orgao === item.ds_sigla))).reduce((acc: { [key: string]: number }, curr: DadosPainelItem) => {
        acc[curr.MES] = (acc[curr.MES] || 0) + parseInt(curr.num, 10);
        return acc;
      }, {});

      if (corAleatoria.length === 0) {
        console.log("Todas as cores foram usadas, considerar resetar a lista ou aumentar as opções.");
        corAleatoria = this.gerarCorAleatoria();
      }

      return {
        label: orgao.orgao,
        data: meses.map(mes => dadosOrgao[mes as string] || 0),
        backgroundColor: corAleatoria.shift(),
      };
    });

    this.graficoPainel3 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: meses,
        datasets: datasets as any[]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start' // Isto não irá alinhar a caixa de legenda à esquerda do canvas
          }
        }
      }
    });
  });
  }

  carregaGraficoPainel4(filtros: any) {
    const ctx = document.getElementById('painel4') as HTMLCanvasElement;
    if (this.graficoPainel4) this.graficoPainel4.destroy();

    this.dataService.getDadosPainel1(7, filtros).subscribe((data: DadosPainelItem[]) => {
      console.log('Dados da API para Painel 4:', data);

      const labels = data.map(item => item.canal_atendimento);
      const valores = data.map(item => parseInt(item.num, 10));
      let corAleatoria = this.gerarCorAleatoria();

      this.graficoPainel4 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: valores,
            backgroundColor: corAleatoria,
            borderColor: 'rgba(255, 255, 255, 1)',
            borderWidth: 2
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              align: 'start'
            },
            datalabels: {
              color: '#fff',
              anchor: 'end',
              align: 'start',
              offset: -1,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              font: {
                weight: 'bold'
              },
              formatter: (value: number, context: any) => {
                const total = context.chart.data.datasets[0].data.reduce((acc: number, curr: number) => acc + curr, 0);
                const percentage = (value / total * 100).toFixed(2); // Mantém duas casas decimais
                return `${value.toLocaleString('pt-BR')} (${percentage}%)`; // Formatação para o padrão brasileiro com percentual
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }, (error) => {
      console.error("Erro ao carregar os dados para o Gráfico 4:", error);
    });
  }

  carregaGraficoPainel5(filtros: any) {
    const ctx = document.getElementById('painel5') as HTMLCanvasElement;
    if (this.graficoPainel5) this.graficoPainel5.destroy();

    this.dataService.getDadosPainel1(5, filtros).subscribe((data: DadosPainelItem[]) => {
      console.log('Dados da API para Painel 5:', data);

      data.forEach(item => {
        if (item.ds_municipio === null) {
          item.ds_municipio = "Não informado";
        }
      });

      // Organizar os dados
      data.sort((a, b) => parseInt(b.num, 10) - parseInt(a.num, 10)); // Ordena decrescentemente pela quantidade

      const labels = data.slice(0, 10).map(item => item.ds_municipio); // Pega os 10 primeiros municípios
      const quantidades = data.slice(0, 10).map(item => parseInt(item.num, 10)); // Pega as quantidades dos 10 primeiros

      // Calcula o total de "Outros"
      const outrosTotal = data.slice(10).reduce((sum, item) => sum + parseInt(item.num, 10), 0);
      if (outrosTotal > 0) {
        labels.push("Outros");
        quantidades.push(outrosTotal);
      }

      let corAleatoria = this.gerarCorAleatoria();

      this.graficoPainel5 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantidade',
            data: quantidades,
            backgroundColor: corAleatoria
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
    }, (error) => {
      console.error("Erro ao carregar os dados para o Gráfico 5:", error);
    });
  }

  carregaGraficoPainel6(filtros: any){

  }



  gerarCorAleatoria() {
    const coresDisponiveis = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(22, 160, 133)',
      'rgb(231, 76, 60)',
      'rgb(52, 73, 94)',
      'rgb(46, 204, 113)',
      'rgb(149, 165, 166)',
      'rgb(243, 156, 18)',
      'rgb(211, 84, 0)',
      'rgb(192, 57, 43)',
      'rgb(241, 196, 15)',
      'rgb(155, 89, 182)',
      'rgb(230, 126, 34)',
      'rgb(52, 152, 219)'
    ];

    return coresDisponiveis;
  }
}


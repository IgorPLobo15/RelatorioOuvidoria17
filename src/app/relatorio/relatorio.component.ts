import { DadosPainelItem, DataService } from './../services/data.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables);


@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
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

  //Formatação e limitação de datas
  minDate: string = '';
  currentDate: string = '';
  startDate: string = '';
  endDate: string = '';


  //Graficos
  graficoPainel1: any;
  graficoPainel2: any;
  graficoPainel3: any;
  graficoPainel4: Chart | undefined;
  graficoPainel5: Chart | undefined;
  graficoPainel6: Chart | undefined;
  graficoPainel7: Chart | undefined;

  //Conta Registros
  totalRegistros: string = '0';

  constructor(private fb: FormBuilder, private dataService : DataService, private route: ActivatedRoute) {
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
    // Carregar dados iniciais dos combos
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const minDate = new Date('2023-06-22');
    this.minDate = this.formatDate(minDate);
    this.currentDate = this.formatDate(today);
    this.startDate = this.formatDate(firstDayOfYear);
    this.endDate = this.currentDate;
    this.carregarCombosIniciais().then(() => {
      // Capturar parâmetros da URL
      this.route.queryParams.subscribe(params => {
        const orgaoParam = params['orgao'];
        const tipoParam = params['tipo'];

        // Atualizar o formulário com os parâmetros capturados
        if (orgaoParam) {
          this.filtroForm.patchValue({ orgao: orgaoParam });
        }
        if (tipoParam) {
          this.filtroForm.patchValue({ tipo: tipoParam });
        }
        

        // Carregar gráficos com os filtros aplicados
        this.carregarGraficos();
      });
    });
  }

  private getInitialStartDate(): string {
    const yearStartDate = new Date(new Date().getFullYear(), 0, 1); // 01 de janeiro do ano atual
    return this.formatDate(yearStartDate);
  }
  
  private getInitialEndDate(): string {
    return this.formatDate(new Date()); // Data de hoje
  }
  
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  carregarCombosIniciais(): Promise<void> {
    return Promise.all([
      this.dataService.getOrgaos().toPromise().then(data => this.orgaos = data),
      this.dataService.getManifestacaoTipos().toPromise().then(data => this.tipos = data),
      this.dataService.getAssuntos().toPromise().then(data => this.assuntos = data),
      this.dataService.getTramites().toPromise().then(data => this.tramites = data)
    ]).then(() => console.log('Combos carregados'));
  }

  onAssuntoChange() {
    const idAssunto = this.filtroForm.get('assunto')?.value;
    this.dataService.getSubassuntos(idAssunto).subscribe(data => this.subassuntos = data);
  }
  exportarDados() {
    const filtros = this.filtroForm.value;
    const filtrosLimpos = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v != ''));

    let queryString = new URLSearchParams(filtrosLimpos as Record<string, string>).toString();
    queryString += "&excel=true";

    const url = `https://www.ouvidoriageral.go.gov.br/api/api/relatorios/dados-painel?${queryString}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar os dados');
        }
        return response.json();
      })
      .then(data => {
        // Inclui o BOM UTF-8
        let csvContent = "\uFEFF";
        csvContent += "Data Manifestação,Órgão,Tipo Manifestação,Tema,Assunto Motivo,Situação,Canal Atendimento\n"; // Cabeçalho do CSV

        data.forEach((row: any) => {
          const rowArray = [
            row.data_manifestacao,
            row.orgao,
            row.tipo_manifestacao,
            row.tema,
            row.assunto_motivo,
            row.situacao,
            row.canal_atendimento
          ];
          const rowString = rowArray.map(item => `"${item}"`).join(',');
          csvContent += rowString + "\r\n";
        });

        // Converte o conteúdo para Blob e define o tipo como texto/csv charset=utf-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const csvUrl = URL.createObjectURL(blob);
        link.setAttribute("href", csvUrl);
        link.setAttribute("download", "relatorio.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Limpa o link após o download
      })
      .catch(error => console.error("Erro ao exportar:", error));
  }

  onSubmit() {
    if (this.filtroForm.valid) {
      const filtros = this.filtroForm.value;
      console.log('Filtros aplicados:', filtros);  // Verifique os filtros aplicados
      this.carregarGraficos();
    }
  }

  //Carrega os graficos no site
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
    this.carregaGraficoPainel7(filtrosLimpos);
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
            datasets: datasets as any[]
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
                align: 'start'
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
            align: 'start'
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
    const ctx = document.getElementById('painel6') as HTMLCanvasElement;
  if (this.graficoPainel6) this.graficoPainel6.destroy();

  this.dataService.getDadosPainel1(6, filtros).subscribe((data: DadosPainelItem[]) => {
    console.log('Dados da API para Painel 6:', data);

    if (data && data.length > 0) {
      const dataObj = data[0];
      const totalRecebidas = parseInt(dataObj.lai_recebida, 10);
      document.getElementById('totalRecebidas')!.innerHTML = `Total de LAI Recebidas: <strong>${totalRecebidas.toLocaleString('pt-BR')}</strong>`;

      const labels = ['Atendidas', 'Indeferidas', 'Em Trâmite'];
      const valores = [parseInt(dataObj.lai_atendida, 10), parseInt(dataObj.lai_indeferida, 10), parseInt(dataObj.lai_em_tramite, 10)];
      const corAleatoria = this.gerarCorAleatoria();

      this.graficoPainel6 = new Chart(ctx, {
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
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
                  const percentage = (context.raw / total * 100).toFixed(2);
                  return `${context.label}: ${context.raw.toLocaleString('pt-BR')} (${percentage}%)`;
                }
              }
            }
          }
        }
      } as any);
    } else {
      console.log("Dados inválidos ou incompletos recebidos para o gráfico de pizza.");
    }
  }, (error) => {
    console.error("Erro ao carregar os dados para o Gráfico 6:", error);
  });
  }
  carregaGraficoPainel7(filtros: any){
    const ctx = document.getElementById('painel7') as HTMLCanvasElement;
  if (this.graficoPainel7) this.graficoPainel7.destroy();

  this.dataService.getDadosPainel1(4, filtros).subscribe((data: DadosPainelItem[]) => {
    console.log('Dados da API para Painel 7:', data);

    data.sort((a, b) => parseInt(b.num, 10) - parseInt(a.num, 10)); // Ordena decrescentemente pela quantidade

    const corAleatoria = this.gerarCorAleatoria();
    const fullLabels = data.slice(0, 10).map(item => item.ds_negativa || "Outros"); // Mantém os rótulos completos aqui
    const labels = fullLabels.map(label => label.length > 15 ? label.slice(0, 15) + '...' : label); // Versão encurtada dos rótulos
    const quantidades = data.slice(0, 10).map(item => parseInt(item.num, 10));

    const outrosTotal = data.slice(10).reduce((sum, item) => sum + parseInt(item.num, 10), 0);
    if (outrosTotal > 0) {
      fullLabels.push("Outros");
      labels.push("Outros");
      quantidades.push(outrosTotal);
    }

    this.graficoPainel7 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantidade',
          data: quantidades,
          backgroundColor: quantidades.map((_, index) => corAleatoria[index % corAleatoria.length]),
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
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: any) => {
                return fullLabels[tooltipItems[0].dataIndex];
              }
            }
          }
        }
      }
    } as any);
  }, (error) => {
    console.error("Erro ao carregar os dados para o Gráfico 7:", error);
  });
  }


  //Geração de cores aleatorias para Entendimento do Usuario
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


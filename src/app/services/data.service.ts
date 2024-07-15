import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DadosPainelItem {
  ds_sigla: string;
  num: string; // ou number, dependendo do tipo retornado pela API
  MES: string;
  ds_manifestacao_tipo: string;
  canal_atendimento: string; // Adicione esta linha
  ds_municipio: string;
}
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'https://www.ouvidoriageral.go.gov.br/api/api';

  constructor(private http: HttpClient) { }
  getDadosPainel(painel: number, filtros: any): Observable<DadosPainelItem[]> {
    let params = new HttpParams().set('painel', painel.toString());
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params = params.set(key, filtros[key]);
      }
    });

    return this.http.get<DadosPainelItem[]>(this.apiUrl, { params });
  }


  getOrgaos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/allorgaos`);
  }

  getManifestacaoTipos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/manifestacao-tipos`);
  }

  getAssuntos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/assuntos`);
  }

  getSubassuntos(idAssunto: string): Observable<any> {
    const params = new HttpParams().set('id_assunto', idAssunto);
    return this.http.get(`${this.apiUrl}/subassuntos`, { params });
  }

  getTramites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tipos-tramites`);
  }

  getDadosPainel1(painel: number, filtros: any): Observable<any> {
    let params = new HttpParams().set('painel', painel.toString());
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params = params.set(key, filtros[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/relatorios/dados-painel`, { params });
  }


}

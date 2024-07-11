import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'https://www.ouvidoriageral.go.gov.br/api/api';

  constructor(private http: HttpClient) { }

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

  getDadosPainel(painel: number, filtros: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      params = params.set(key, filtros[key]);
    });
    return this.http.get(`${this.apiUrl}/relatorios/dados-painel?painel=${painel}`, { params });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiOrgao = 'https://www.ouvidoriageral.go.gov.br/api/api/allorgaos';
  private apiUrlTipos = 'https://www.ouvidoriageral.go.gov.br/api/api/manifestacao-tipos';
  private apiUrlAssuntos = 'https://www.ouvidoriageral.go.gov.br/api/api/assuntos';
  private apiSubassuntos = 'https://www.ouvidoriageral.go.gov.br/api/api/subassuntos';
  private apiTramites = 'https://www.ouvidoriageral.go.gov.br/api/api/tipos-tramites';

  private apiPainelI = 'https://www.ouvidoriageral.go.gov.br/api/api/relatorios/dados-painel?painel=1';



  constructor(private http: HttpClient) { }

  getManifestacaoTipos(): Observable<any> {
    return this.http.get<any>(this.apiUrlTipos);
  }

  getAssuntos(): Observable<any> {
    return this.http.get<any>(this.apiUrlAssuntos);
  }

  getSubassuntos(): Observable<any> {
    return this.http.get<any>(this.apiSubassuntos);
  }

  getTramites(): Observable<any> {
    return this.http.get<any>(this.apiTramites);
  }

  getOrgaos(): Observable<any> {
    return this.http.get<any>(this.apiOrgao);
  }
  getPainelI(): Observable<any>{
    return this.http.get<any>(this.apiPainelI);
  }
}
